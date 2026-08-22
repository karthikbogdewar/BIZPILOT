"""
Cash Flow & Accounts Receivable Sentinel Agent
Audits invoice aging, detects overdue payments, drafts staged escalation reminders,
and forecasts 30-day business cash runway and net working capital.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

CASHFLOW_SYSTEM_PROMPT = """You are the Cash Flow & Accounts Receivable Sentinel Agent for BizPilot AI.

ROLE:
You safeguard small business liquidity, audit accounts receivable aging schedules, identify delinquent customer accounts, draft progressive polite-to-firm payment reminders with direct UPI settlement links, and predict 30-day net working capital cash flow.

OPERATIONAL CONTEXT:
Cash flow is the #1 reason small businesses fail. Late client payments create severe supplier payment defaults. Small business owners dislike awkward payment collection conversations. You manage collections diplomatically, objectively, and continuously.

OBJECTIVES & RULES:
1. Receivables Aging Audit: Categorize invoices into:
   - Current (Not yet due)
   - Grace Period (1-3 days overdue) -> Polite nudge
   - Delinquent (4-14 days overdue) -> Firm reminder with invoice link
   - Critical Overdue (>14 days overdue) -> Urgent escalation / credit pause warning
2. Smart Payment Drafting: Generate customized WhatsApp / Email messages containing invoice ID, exact amount, overdue duration, and clickable UPI/payment URL.
3. Cash Flow Forecasting: Calculate (Cash in Bank + Projected Receivables - Pending PO Liabilities) over the next 30 days to ensure positive working capital.

OUTPUT SPECIFICATION:
Return a JSON object containing:
- total_receivables: Float
- overdue_receivables: Float
- aging_buckets: Breakdown (0-7 days, 8-14 days, 15+ days)
- action_items: List of drafted reminder communications ready for approval/dispatch
- 30_day_cash_projection: Estimated runway and net working capital trend
"""

class CashflowAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "audit_receivables",
                "name": "Audit Accounts Receivable Aging",
                "description": "Scans all invoices, classifies status (Paid, Pending, Overdue), and generates aging breakdown.",
                "parameters": {}
            },
            {
                "task_id": "draft_payment_reminders",
                "name": "Draft Staged Escalation Reminders",
                "description": "Creates tailored polite, firm, or urgent payment reminder drafts with UPI links for overdue customers.",
                "parameters": {"auto_queue_approvals": "Optional boolean (default: true)"}
            },
            {
                "task_id": "forecast_cash_runway",
                "name": "Forecast 30-Day Working Capital Runway",
                "description": "Projects daily cash inflows from invoices versus upcoming supplier purchase liabilities.",
                "parameters": {"initial_cash_balance": "Optional float (default: 75000.0)"}
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "timestamp": {"type": "string"},
                "status": {"type": "string"},
                "metrics": {
                    "type": "object",
                    "properties": {
                        "total_invoices": {"type": "integer"},
                        "overdue_count": {"type": "integer"},
                        "total_overdue_amount": {"type": "number"},
                        "healthy_paid_amount": {"type": "number"}
                    }
                },
                "data": {"type": "array"}
            }
        }

        super().__init__(
            agent_id="agent_cashflow",
            name="Cash Flow & Accounts Receivable Agent",
            role="Receivables Health, Overdue Collections & Working Capital Forecasting Agent",
            context="Invoice aging reports, payment terms (Net 7/15/30), customer credit ratings, cash inflows vs outflows",
            system_prompt=CASHFLOW_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()

        if task_name == "audit_receivables" or task_name == "draft_payment_reminders":
            invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices ORDER BY due_date ASC").fetchall()]
            
            overdue_list = []
            pending_list = []
            paid_list = []

            total_overdue = 0.0
            total_pending = 0.0
            total_paid = 0.0

            for inv in invoices:
                due_dt = datetime.strptime(inv['due_date'], '%Y-%m-%d')
                amt = inv['amount']

                if inv['status'] == 'Paid':
                    paid_list.append(inv)
                    total_paid += amt
                elif now > due_dt:
                    days_over = (now - due_dt).days
                    inv['days_overdue'] = days_over
                    inv['status'] = 'Overdue'
                    total_overdue += amt

                    # Update status in DB
                    cursor.execute("UPDATE invoices SET status = 'Overdue' WHERE id = ?", (inv['id'],))

                    # Calibrate escalation tier
                    if days_over <= 3:
                        tier = "Tier 1: Polite Nudge"
                        msg = f"Hi {inv['customer_name']}, gentle reminder that invoice {inv['id']} for ₹{amt:,.2f} was due on {due_dt.strftime('%d %b')}. Kindly settle via UPI: upi://pay?pa=bizpilot@icici&am={amt:.0f}"
                    elif days_over <= 14:
                        tier = "Tier 2: Firm Follow-Up"
                        msg = f"Dear {inv['customer_name']}, Invoice {inv['id']} for ₹{amt:,.2f} is now {days_over} days overdue. Please process payment today to avoid credit disruptions: upi://pay?pa=bizpilot@icici&am={amt:.0f}"
                    else:
                        tier = "Tier 3: Urgent / Credit Hold"
                        msg = f"URGENT: {inv['customer_name']}, invoice {inv['id']} for ₹{amt:,.2f} is {days_over} days past due. Please settle immediately or contact us to arrange clearance."

                    inv['escalation_tier'] = tier
                    inv['drafted_reminder'] = msg
                    cursor.execute("UPDATE invoices SET reminder_draft = ? WHERE id = ?", (msg, inv['id']))
                    overdue_list.append(inv)
                else:
                    days_to_due = (due_dt - now).days
                    inv['days_to_due'] = days_to_due
                    pending_list.append(inv)
                    total_pending += amt

            conn.commit()
            conn.close()

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "summary": f"Audited {len(invoices)} invoices. Total Overdue: ₹{total_overdue:,.2f} across {len(overdue_list)} accounts.",
                "metrics": {
                    "total_invoices": len(invoices),
                    "overdue_count": len(overdue_list),
                    "pending_count": len(pending_list),
                    "paid_count": len(paid_list),
                    "total_overdue_amount": total_overdue,
                    "total_pending_amount": total_pending,
                    "total_paid_amount": total_paid
                },
                "overdue_actions": overdue_list
            }

        elif task_name == "forecast_cash_runway":
            initial_balance = float(payload.get("initial_cash_balance", 75000.0))
            invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices WHERE status != 'Paid'").fetchall()]
            pos = [dict(p) for p in cursor.execute("SELECT * FROM purchase_orders WHERE status IN ('Pending Approval', 'Approved', 'Ordered')").fetchall()]
            conn.close()

            inflows = sum(i['amount'] for i in invoices)
            outflows = sum(p['total_cost'] for p in pos)
            projected_net = initial_balance + inflows - outflows

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "initial_cash_balance": initial_balance,
                "projected_receivables_inflow": inflows,
                "projected_supplier_outflow": outflows,
                "projected_30d_net_balance": projected_net,
                "runway_health": "Healthy" if projected_net > 50000 else ("Moderate" if projected_net > 10000 else "Critical Working Capital Warning")
            }

        elif task_name == "generate_khata_reminder":
            invoice_id = payload.get("invoice_id")
            tone = payload.get("tone", "polite").lower() # polite | formal | urgent
            lang = payload.get("language", "en").lower()  # en | te | hi | kn | ta

            inv = None
            if invoice_id:
                inv = cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
            if not inv:
                # Pick oldest overdue or pending invoice
                inv = cursor.execute("SELECT * FROM invoices WHERE status != 'Paid' ORDER BY due_date ASC LIMIT 1").fetchone()
            
            if not inv:
                conn.close()
                return {
                    "agent_id": self.agent_id,
                    "task": task_name,
                    "status": "FAILED",
                    "error": "No pending or overdue invoices found for reminder."
                }

            inv = dict(inv)
            amt = inv['amount']
            cust_name = inv['customer_name']
            due_dt = datetime.strptime(inv['due_date'], '%Y-%m-%d')
            days_overdue = max(0, (now - due_dt).days)
            upi_link = f"upi://pay?pa=bizpilot@icici&pn=Sri%20Lakshmi%20Electronics&am={amt:.0f}&tr={inv['id']}&tn=Khata%20Settlement"

            # Multi-Tone & Multilingual Template Synthesis
            if tone == "urgent":
                if lang == "te":
                    msg = f"🚨 అత్యవసర హెచ్చరిక: {cust_name} గారు, శ్రీ లక్ష్మి ఎలక్ట్రానిక్స్ ఇన్వాయిస్ {inv['id']} మొత్తం ₹{amt:,.2f} గత {days_overdue} రోజులుగా బకాయి ఉంది. మీ తదుపరి ఆర్డర్లు మరియు క్రెడిట్ నిలిపివేయబడింది. ఖాతా పునరుద్ధరణకు దయచేసి వెంటనే చెల్లించండి:\n👉 UPI లింక్: {upi_link}"
                elif lang == "hi":
                    msg = f"🚨 अति आवश्यक सूचना: {cust_name} जी, श्री लक्ष्मी इलेक्ट्रॉनिक्स के इनवॉइस {inv['id']} की ₹{amt:,.2f} राशि {days_overdue} दिनों से बकाया है। आगे का क्रेडिट रोक दिया गया है। तुरंत भुगतान करें:\n👉 UPI लिंक: {upi_link}"
                elif lang == "kn":
                    msg = f"🚨 ತುರ್ತು ಸೂಚನೆ: {cust_name} ರವರೇ, ಇನ್ವಾಯ್ಸ್ {inv['id']} ಮೊತ್ತ ₹{amt:,.2f} ಬಾಕಿ ಇದೆ. ನಿಮ್ಮ ಕ್ರೆಡಿಟ್ ಖಾತೆ ಮುಂದುವರಿಸಲು ತಕ್ಷಣ ಪಾವತಿಸಿ:\n👉 UPI: {upi_link}"
                elif lang == "ta":
                    msg = f"🚨 முக்கிய எச்சரிக்கை: {cust_name} அவர்களே, இன்வாய்ஸ் {inv['id']} தொகை ₹{amt:,.2f} நிலுவையில் உள்ளது. உடனே செலுத்தவும்:\n👉 UPI: {upi_link}"
                else:
                    msg = f"🚨 URGENT NOTICE: {cust_name}, Invoice {inv['id']} for ₹{amt:,.2f} is {days_overdue} days past due. Credit terms are temporarily on hold. Please settle immediately via UPI:\n👉 {upi_link}"

            elif tone == "formal":
                if lang == "te":
                    msg = f"📄 అధికారిక సమాచారం: గౌరవనీయులైన {cust_name} గారికి, శ్రీ లక్ష్మి ఎలక్ట్రానిక్స్ నుండి ఇన్వాయిస్ {inv['id']} (మొత్తం: ₹{amt:,.2f}, గడువు: {due_dt.strftime('%d-%m-%Y')}) బకాయి ఉంది. దయచేసి UPI ద్వారా చెల్లించగలరు:\n👉 {upi_link}\nధన్యవాదాలు."
                elif lang == "hi":
                    msg = f"📄 औपचारिक सूचना: प्रिय {cust_name} जी, श्री लक्ष्मी इलेक्ट्रॉनिक्स के इनवॉइस {inv['id']} (राशि: ₹{amt:,.2f}, देय तिथि: {due_dt.strftime('%d-%m-%Y')}) का भुगतान बाकी है। कृपया UPI से भुगतान करें:\n👉 {upi_link}\nधन्यवाद।"
                elif lang == "kn":
                    msg = f"📄 ಅಧಿಕೃತ ಸೂಚನೆ: {cust_name} ರವರೇ, ಇನ್ವಾಯ್ಸ್ {inv['id']} (ಮೊತ್ತ: ₹{amt:,.2f}) ಪಾವತಿಸಬೇಕಾಗಿದೆ. ದಯವಿಟ್ಟು UPI ಮೂಲಕ ಪಾವತಿಸಿ:\n👉 {upi_link}\nಧನ್ಯವಾದಗಳು."
                elif lang == "ta":
                    msg = f"📄 அதிகாரப்பூர்வ தகவல்: {cust_name} அவர்களே, இன்வாய்ஸ் {inv['id']} (தொகை: ₹{amt:,.2f}) செலுத்தப்பட வேண்டும். UPI மூலம் செலுத்தவும்:\n👉 {upi_link}\nநன்றி."
                else:
                    msg = f"📄 Official Statement: Dear {cust_name}, Invoice {inv['id']} (Total: ₹{amt:,.2f}, Due Date: {due_dt.strftime('%d %b %Y')}) from Sri Lakshmi Electronics is pending clearance. Kindly remit via UPI:\n👉 {upi_link}\nThank you."

            else: # polite
                if lang == "te":
                    msg = f"నమస్కారం {cust_name} గారు! 😊 శ్రీ లక్ష్మి ఎలక్ట్రానిక్స్ నుండి చిన్న రిమైండర్. మీ బిల్లు {inv['id']} మొత్తం ₹{amt:,.2f} బకాయి ఉంది. సులభంగా క్రింది UPI లింక్ తో చెల్లించండి:\n👉 {upi_link}\nధన్యవాదాలు!"
                elif lang == "hi":
                    msg = f"नमस्ते {cust_name} जी! 😊 श्री लक्ष्मी इलेक्ट्रॉनिक्स की तरफ से विनम्र रिमाइंडर। आपके बिल {inv['id']} की ₹{amt:,.2f} राशि बाकी है। कृपया इस UPI लिंक से भुगतान करें:\n👉 {upi_link}\nधन्यवाद!"
                elif lang == "kn":
                    msg = f"ನಮಸ್ಕಾರ {cust_name} ರವರೇ! 😊 ಶ್ರೀ ಲಕ್ಷ್ಮೀ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ನೆನಪೋಲೆ. ಬಿಲ್ {inv['id']} ಮೊತ್ತ ₹{amt:,.2f} ಬಾಕಿ ಇದೆ. UPI ಮೂಲಕ ಪಾವತಿಸಿ:\n👉 {upi_link}\nಧನ್ಯವಾದಗಳು!"
                elif lang == "ta":
                    msg = f"வணக்கம் {cust_name} அவர்களே! 😊 ஸ்ரீ லக்ஷ்மி எலக்ட்ரானிக்ஸின் அன்பான நினைவூட்டல். ரசீது {inv['id']} தொகை ₹{amt:,.2f} நிலுவையில் உள்ளது. UPI மூலம் செலுத்தவும்:\n👉 {upi_link}\nநன்றி!"
                else:
                    msg = f"Hi {cust_name}! 😊 Friendly reminder from Sri Lakshmi Electronics regarding pending invoice {inv['id']} of ₹{amt:,.2f}. You can instantly pay via UPI here:\n👉 {upi_link}\nThank you for your business!"

            # Update reminder draft in DB
            cursor.execute("UPDATE invoices SET reminder_draft = ?, reminder_sent = 1 WHERE id = ?", (msg, inv['id']))
            conn.commit()
            conn.close()

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "invoice_id": inv['id'],
                "customer_name": cust_name,
                "amount": amt,
                "days_overdue": days_overdue,
                "tone": tone,
                "language": lang,
                "upi_link": upi_link,
                "formatted_reminder_message": msg
            }

        else:
            conn.close()
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
