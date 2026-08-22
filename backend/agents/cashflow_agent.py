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

        else:
            conn.close()
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
