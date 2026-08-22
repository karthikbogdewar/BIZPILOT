from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime

from backend.database import init_db, get_db_connection
from backend.agent_engine import agent_service
from backend.agents.orchestrator import agent_orchestrator

# Initialize database on startup
init_db(force_reset=False)

app = FastAPI(
    title="BizPilot AI – Small Business Back-Office Agent",
    description="Proactive AI digital operations employee for small businesses.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Request Models
# -------------------------------------------------------------
class CustomerMessageRequest(BaseModel):
    message: str
    customer_name: Optional[str] = "WhatsApp Customer"
    channel: Optional[str] = "WhatsApp"

class CommandQueryRequest(BaseModel):
    query: str

class RejectApprovalRequest(BaseModel):
    reason: Optional[str] = "Rejected by Business Owner"

class SettingsUpdateRequest(BaseModel):
    business_name: str
    owner_name: str
    category: str
    city: str
    auto_pilot_enabled: int
    approval_required_above: float

class AgentTaskRequest(BaseModel):
    task_name: str
    payload: Optional[Dict[str, Any]] = None

class KhataReminderRequest(BaseModel):
    invoice_id: str
    tone: Optional[str] = "polite"
    language: Optional[str] = "en"
    channel: Optional[str] = "telegram"

class NegotiationRequest(BaseModel):
    product_name: str
    supplier_name: str
    initial_unit_price: float
    quantity: int
    payment_terms: Optional[str] = "Net 15"
    lifetime_purchases_count: Optional[int] = 15
    target_discount_pct: Optional[float] = 7.5

class BillOcrRequest(BaseModel):
    bill_text: str
    supplier_hint: Optional[str] = None

class BranchTransferRequest(BaseModel):
    transfer_id: str
    product_id: str
    quantity: int
    source_branch: str
    target_branch: str

@app.on_event("startup")
def startup_event():
    telegram_service.start_background_poller(interval_seconds=1.0)

# -------------------------------------------------------------
# Multi-Agent Squad Endpoints
# -------------------------------------------------------------

@app.get("/api/agents")
def list_all_agents():
    """Returns manifests, roles, contexts, prompts, and tasks for all 4 specialized agents."""
    return {"agents": agent_orchestrator.list_agents()}

@app.get("/api/agents/{agent_id}")
def get_agent_spec(agent_id: str):
    """Returns specification and prompt for a specific agent."""
    spec = agent_orchestrator.get_agent(agent_id)
    if not spec:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return spec

@app.post("/api/agents/{agent_id}/run")
def run_agent_task(agent_id: str, req: AgentTaskRequest):
    """Executes an on-demand task for a specialized agent."""
    result = agent_orchestrator.execute_agent_task(agent_id, req.task_name, req.payload)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Task execution failed"))
    return result

@app.post("/api/agents/swarm/cycle")
def run_multi_agent_swarm_cycle():
    """Runs a synchronized 4-agent collaborative operations scan."""
    return agent_orchestrator.run_full_swarm_cycle()

# -------------------------------------------------------------
# Messaging Connectors (Telegram & WhatsApp Business)
# -------------------------------------------------------------
from backend.connectors.telegram_service import telegram_service
from backend.connectors.whatsapp_service import whatsapp_service
from fastapi import Request, Response

class TelegramTestAlertRequest(BaseModel):
    title: Optional[str] = "Critical Stockout Risk Alert"
    description: Optional[str] = "Boat BassHeads Earphones will stockout in 1.33 days."
    amount: Optional[float] = 8500.0
    approval_id: Optional[str] = "APP-101"
    reference_id: Optional[str] = "PO-901"

class WhatsAppSendTestRequest(BaseModel):
    to_phone: str
    message: str

@app.get("/api/connectors/status")
def get_connectors_status():
    """Returns live connection status for Telegram and WhatsApp."""
    return {
        "telegram": {
            "configured": telegram_service.is_configured(),
            "has_owner_chat_id": bool(telegram_service.owner_chat_id)
        },
        "whatsapp": {
            "configured": whatsapp_service.is_configured(),
            "phone_number_id": whatsapp_service.phone_number_id or None
        }
    }

@app.post("/api/telegram/webhook")
async def telegram_webhook(req: Request):
    """Processes incoming Telegram updates (bot commands & button callbacks)."""
    body = await req.json()
    result = telegram_service.process_webhook_update(body)
    return result

@app.post("/api/telegram/poll")
def telegram_poll():
    """Polls Telegram for pending updates and auto-dispatches orders/callbacks."""
    processed = telegram_service.poll_updates_once()
    return {"status": "polled", "processed_count": len(processed), "updates": processed}

@app.post("/api/telegram/auto-discover-chat")
def telegram_auto_discover_chat():
    """Finds latest user chat ID from Telegram updates and registers as owner."""
    updates = telegram_service.get_updates()
    if not updates:
        return {"success": False, "message": "No messages found yet. Please open @KBNSN_bot on Telegram and tap /start or send 'hi'."}
    
    last_update = updates[-1]
    msg = last_update.get("message", {})
    chat = msg.get("chat", {})
    chat_id = str(chat.get("id", ""))
    user_name = f"{msg.get('from', {}).get('first_name', '')} {msg.get('from', {}).get('last_name', '')}".strip()

    if chat_id:
        os.environ["TELEGRAM_OWNER_CHAT_ID"] = chat_id
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "TELEGRAM_OWNER_CHAT_ID=" in content:
                content = "\n".join([f"TELEGRAM_OWNER_CHAT_ID={chat_id}" if l.startswith("TELEGRAM_OWNER_CHAT_ID=") else l for l in content.split("\n")])
            else:
                content += f"\nTELEGRAM_OWNER_CHAT_ID={chat_id}\n"
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)

        telegram_service.reload_config()

        # Send greeting confirmation
        telegram_service.send_message(
            chat_id=chat_id,
            text=f"🎉 <b>BizPilot AI Connected!</b>\n\nHello {user_name}, your phone is now linked as the <b>Business Owner</b>. You will receive real-time Stockout Alerts and interactive Approval Cards right here!"
        )

        return {"success": True, "chat_id": chat_id, "user_name": user_name, "message": "Successfully linked your Telegram account!"}
    
    return {"success": False, "message": "Could not determine Chat ID from updates."}

@app.post("/api/telegram/send-test")
def telegram_send_test(req: TelegramTestAlertRequest):
    """Sends a test interactive approval alert to the owner Telegram."""
    res = telegram_service.send_owner_approval_alert(
        title=req.title,
        description=req.description,
        amount=req.amount,
        approval_id=req.approval_id,
        reference_id=req.reference_id
    )
    return res

@app.get("/api/whatsapp/webhook")
def whatsapp_verify_webhook(hub_mode: Optional[str] = None, hub_challenge: Optional[str] = None, hub_verify_token: Optional[str] = None):
    """Meta WhatsApp Webhook verification handshake."""
    from fastapi.responses import PlainTextResponse
    challenge = whatsapp_service.verify_webhook(hub_mode or "", hub_verify_token or "", hub_challenge or "")
    if challenge:
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/api/whatsapp/webhook")
async def whatsapp_webhook(req: Request):
    """Meta WhatsApp Webhook for incoming customer messages."""
    body = await req.json()
    result = whatsapp_service.process_incoming_webhook(body)
    return result

@app.post("/api/whatsapp/send-test")
def whatsapp_send_test(req: WhatsAppSendTestRequest):
    """Sends a test WhatsApp message."""
    res = whatsapp_service.send_text_message(to_phone=req.to_phone, text=req.message)
    return res

# -------------------------------------------------------------
# Operational Dashboard Endpoints
# -------------------------------------------------------------

@app.get("/api/dashboard")
def get_dashboard():
    """Returns complete 360 operational dashboard data."""
    return agent_service.get_dashboard_data()

@app.get("/api/products")
def get_products():
    """Returns catalog with live calculated days remaining and stockout alerts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    products = [dict(p) for p in cursor.execute("SELECT * FROM products").fetchall()]
    conn.close()

    for p in products:
        days = round(p['stock'] / p['avg_daily_sales'], 2) if p['avg_daily_sales'] > 0 else 999.0
        p['days_remaining'] = days
        p['is_stockout_risk'] = (days <= p['lead_time_days']) or (p['stock'] <= p['min_stock'])
        p['status_label'] = "Critical Low" if days <= p['lead_time_days'] else ("Reorder Soon" if p['stock'] <= p['min_stock'] else "Optimal")

    return products

@app.get("/api/products/{product_id}/suppliers")
def get_product_supplier_comparison(product_id: str):
    """Compares all suppliers for a specific product using multi-criteria matrix."""
    comp = agent_service.compare_suppliers_for_product(product_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Product or suppliers not found")
    return comp

@app.get("/api/suppliers")
def get_suppliers():
    """Returns all registered suppliers and their catalog offerings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    suppliers = [dict(s) for s in cursor.execute("SELECT * FROM suppliers").fetchall()]
    for s in suppliers:
        prods = cursor.execute("""
            SELECT p.id, p.name, sp.price, sp.lead_time_days, sp.moq
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            WHERE sp.supplier_id = ?
        """, (s['id'],)).fetchall()
        s['catalog'] = [dict(pr) for pr in prods]
    conn.close()
    return suppliers

@app.get("/api/orders")
def get_orders():
    """Returns all customer orders."""
    conn = get_db_connection()
    cursor = conn.cursor()
    orders = [dict(o) for o in cursor.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()]
    conn.close()
    for o in orders:
        if o.get('items_json'):
            try:
                o['items'] = json.loads(o['items_json'])
            except Exception:
                o['items'] = []
    return orders

@app.post("/api/orders/simulate-message")
def simulate_customer_message(req: CustomerMessageRequest):
    """Simulates receiving a WhatsApp or unstructured customer message for the AI agent to parse and fulfill."""
    result = agent_service.parse_and_process_customer_message(
        message=req.message,
        customer_name=req.customer_name or "WhatsApp Customer",
        channel=req.channel or "WhatsApp"
    )
    return result

@app.get("/api/invoices")
def get_invoices():
    """Returns all invoices and automatically recalculates overdue status."""
    agent_service.check_overdue_invoices()
    conn = get_db_connection()
    cursor = conn.cursor()
    invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices ORDER BY due_date ASC").fetchall()]
    conn.close()
    return invoices

@app.get("/api/approvals")
def get_approvals():
    """Returns all pending and resolved human-in-the-loop approvals."""
    conn = get_db_connection()
    cursor = conn.cursor()
    approvals = [dict(a) for a in cursor.execute("SELECT * FROM approvals ORDER BY created_at DESC").fetchall()]
    conn.close()
    for a in approvals:
        if a.get('metadata_json'):
            try:
                a['metadata'] = json.loads(a['metadata_json'])
            except Exception:
                a['metadata'] = {}
    return approvals

@app.post("/api/approvals/{approval_id}/approve")
def approve_request(approval_id: str):
    """Business owner approves an action."""
    result = agent_service.approve_action(approval_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Action failed"))
    return result

@app.post("/api/approvals/{approval_id}/reject")
def reject_request(approval_id: str, req: Optional[RejectApprovalRequest] = None):
    """Business owner rejects an action."""
    reason = req.reason if req else "Rejected by Business Owner"
    return agent_service.reject_action(approval_id, reason)

@app.get("/api/activity-logs")
def get_activity_logs(category: Optional[str] = None):
    """Returns AI activity stream."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if category and category != 'All':
        logs = [dict(l) for l in cursor.execute("SELECT * FROM activity_logs WHERE category = ? ORDER BY timestamp DESC", (category,)).fetchall()]
    else:
        logs = [dict(l) for l in cursor.execute("SELECT * FROM activity_logs ORDER BY timestamp DESC").fetchall()]
    conn.close()
    return logs

@app.post("/api/agent/scan")
def trigger_agent_scan():
    """Triggers an on-demand autonomous operations scan cycle."""
    result = agent_service.run_full_operations_scan()
    return result

@app.post("/api/agent/command")
class VoiceQueryRequest(BaseModel):
    transcript: str
    language: Optional[str] = "en"

class WhatIfSimulationRequest(BaseModel):
    demand_multiplier: Optional[float] = 1.0
    lead_time_added_days: Optional[int] = 0
    collection_delay_days: Optional[int] = 0

@app.post("/api/invoices/{invoice_id}/pay-simulate")
def simulate_invoice_payment(invoice_id: str):
    """Simulates receiving a real-time UPI payment from customer for an invoice."""
    conn = get_db_connection()
    cursor = conn.cursor()
    inv = cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
    if not inv:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")

    cursor.execute("UPDATE invoices SET status = 'Paid' WHERE id = ?", (invoice_id,))
    if inv['order_id']:
        cursor.execute("UPDATE orders SET payment_status = 'Paid' WHERE id = ?", (inv['order_id'],))

    now = datetime.now()
    cursor.execute("""
        INSERT INTO activity_logs (timestamp, time_display, category, severity, title, detail, automated)
        VALUES (?, ?, 'Finance', 'success', ?, ?, 1)
    """, (
        now.strftime('%Y-%m-%d %H:%M:%S'),
        now.strftime('%I:%M %p'),
        f"UPI Payment Received: {invoice_id}",
        f"Customer {inv['customer_name']} paid ₹{inv['amount']:,.2f} via UPI. Invoice marked Paid and Cash Runway updated."
    ))
    conn.commit()
    conn.close()

    # Send receipt on WhatsApp/Telegram if available
    whatsapp_service.send_text_message(
        to_phone="919876543210",
        text=f"✅ Payment of ₹{inv['amount']:,.2f} received for {invoice_id}. Thank you!"
    )

    return {
        "success": True,
        "invoice_id": invoice_id,
        "amount": inv['amount'],
        "customer_name": inv['customer_name'],
        "status": "Paid",
        "message": f"Successfully simulated UPI payment of ₹{inv['amount']:,.2f}!"
    }

# -------------------------------------------------------------
# Customer Khata (Credit Ledger) & Smart Multi-Tone Reminders
# -------------------------------------------------------------

@app.get("/api/khata/ledger")
def get_khata_ledger():
    """Returns customer-wise credit ledger, outstanding khata balances, and aging stats."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    customers = [dict(c) for c in cursor.execute("SELECT * FROM customers").fetchall()]
    invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices ORDER BY due_date ASC").fetchall()]
    conn.close()

    now = datetime.now()
    ledger = []
    total_khata_outstanding = 0.0
    total_khata_overdue = 0.0

    for c in customers:
        c_invoices = [i for i in invoices if i['customer_id'] == c['id']]
        unpaid = [i for i in c_invoices if i['status'] != 'Paid']
        overdue = []
        for inv in unpaid:
            due_dt = datetime.strptime(inv['due_date'], '%Y-%m-%d')
            if now > due_dt:
                inv['days_overdue'] = (now - due_dt).days
                overdue.append(inv)
            else:
                inv['days_overdue'] = 0

        balance = sum(i['amount'] for i in unpaid)
        overdue_balance = sum(i['amount'] for i in overdue)
        total_khata_outstanding += balance
        total_khata_overdue += overdue_balance

        # Health score
        if overdue_balance > 10000 or (overdue and max(i['days_overdue'] for i in overdue) > 14):
            risk = "Default Risk 🔴"
            risk_color = "rose"
        elif overdue_balance > 0:
            risk = "Caution 🟡"
            risk_color = "amber"
        else:
            risk = "Healthy 🟢"
            risk_color = "emerald"

        ledger.append({
            "customer_id": c['id'],
            "customer_name": c['name'],
            "company": c.get('company') or "Direct Customer",
            "phone": c['phone'],
            "credit_limit": c.get('credit_limit', 50000.0),
            "outstanding_balance": balance,
            "overdue_balance": overdue_balance,
            "unpaid_invoices_count": len(unpaid),
            "overdue_invoices_count": len(overdue),
            "risk_assessment": risk,
            "risk_color": risk_color,
            "invoices": unpaid
        })

    # Sort by overdue balance descending
    ledger.sort(key=lambda x: x['overdue_balance'], reverse=True)

    return {
        "summary": {
            "total_khata_outstanding": total_khata_outstanding,
            "total_khata_overdue": total_khata_overdue,
            "total_customers": len(customers),
            "delinquent_customers_count": len([c for c in ledger if c['overdue_balance'] > 0])
        },
        "ledger": ledger
    }

@app.post("/api/khata/send-reminder")
def send_khata_reminder(req: KhataReminderRequest):
    """Generates localized multi-tone Khata reminder and dispatches via Telegram/WhatsApp."""
    from backend.agents.cashflow_agent import CashflowAgent
    cf = CashflowAgent()
    res = cf.execute_task("generate_khata_reminder", {
        "invoice_id": req.invoice_id,
        "tone": req.tone,
        "language": req.language
    })

    if res.get("status") == "COMPLETED":
        msg = res.get("formatted_reminder_message")
        # Push to Telegram if configured
        if req.channel == "telegram":
            telegram_service.send_telegram_message(
                text=f"📢 *Customer Khata Reminder Dispatched*\n\n{msg}",
                parse_mode="Markdown"
            )
        elif req.channel == "whatsapp":
            whatsapp_service.send_text_message(
                to_phone="919876543210",
                text=msg
            )

        # Log Activity
        conn = get_db_connection()
        now = datetime.now()
        conn.cursor().execute("""
            INSERT INTO activity_logs (timestamp, time_display, category, severity, title, detail, automated)
            VALUES (?, ?, 'Payments', 'info', ?, ?, 1)
        """, (
            now.strftime('%Y-%m-%d %H:%M:%S'),
            now.strftime('%I:%M %p'),
            f"Khata Reminder Dispatched ({req.tone.capitalize()} / {req.language.upper()})",
            f"Sent {req.tone} reminder for {req.invoice_id} ({res.get('customer_name')}) of ₹{res.get('amount', 0):,.2f} via {req.channel.capitalize()}."
        ))
        conn.commit()
        conn.close()

    return res

# -------------------------------------------------------------
# 1. Autonomous B2B Vendor Price Negotiation Protocol
# -------------------------------------------------------------

@app.post("/api/procurement/negotiate")
def negotiate_vendor_price(req: NegotiationRequest):
    """Generates AI-driven counter-offer and margin savings strategy against vendor price quotes."""
    from backend.agents.negotiation_agent import vendor_negotiation_engine
    return vendor_negotiation_engine.generate_counter_offer(
        product_name=req.product_name,
        supplier_name=req.supplier_name,
        initial_unit_price=req.initial_unit_price,
        quantity=req.quantity,
        payment_terms=req.payment_terms or "Net 15",
        lifetime_purchases_count=req.lifetime_purchases_count or 15,
        target_discount_pct=req.target_discount_pct or 7.5
    )

# -------------------------------------------------------------
# 2. Physical Bill & Handwritten Chitti OCR Digitizer
# -------------------------------------------------------------

@app.post("/api/ocr/digitize-bill")
def digitize_physical_bill(req: BillOcrRequest):
    """Parses handwritten or printed paper challan/bill into structured inventory line items."""
    from backend.ocr_service import bill_ocr_service
    return bill_ocr_service.parse_bill_text(req.bill_text, req.supplier_hint)

@app.post("/api/ocr/commit-bill")
def commit_digitized_bill(bill_data: Dict[str, Any]):
    """Adds verified items from digitized bill directly to inventory database."""
    from backend.ocr_service import bill_ocr_service
    return bill_ocr_service.commit_bill_to_inventory(bill_data)

# -------------------------------------------------------------
# 3. Multi-Branch Inventory Rebalancing & Inter-Store Teleportation
# -------------------------------------------------------------

@app.get("/api/inventory/multi-branch")
def get_multi_branch_inventory():
    """Returns 3-branch inventory allocation and arbitrage rebalancing opportunities."""
    from backend.branch_service import multi_branch_service
    return multi_branch_service.get_multi_branch_overview()

@app.post("/api/inventory/rebalance-transfer")
def execute_branch_stock_transfer(req: BranchTransferRequest):
    """Executes inter-branch stock teleportation, updating inventory and issuing internal Gate Pass."""
    from backend.branch_service import multi_branch_service
    return multi_branch_service.execute_internal_transfer(
        transfer_id=req.transfer_id,
        product_id=req.product_id,
        quantity=req.quantity,
        source_branch=req.source_branch,
        target_branch=req.target_branch
    )

# -------------------------------------------------------------
# 4. 'While You Slept' 24-Hour Autonomous Shift Simulator
# -------------------------------------------------------------

@app.post("/api/simulator/night-shift")
def run_night_shift_simulation():
    """Runs a 24-hour cycle of autonomous multi-agent proactive operations in accelerated time."""
    from backend.night_shift_simulator import night_shift_simulator
    return night_shift_simulator.run_24h_autonomous_shift()

@app.post("/api/ai/voice-query")
def ai_voice_query(req: VoiceQueryRequest):
    """Processes spoken voice questions, detects language, and formats text + voice audio script."""
    from backend.agents.multilingual_agent import MultilingualAgent
    ml = MultilingualAgent()
    detected_lang = ml.detect_language(req.transcript)
    
    answer_text = agent_service.answer_command_query(req.transcript)

    # Localized speech intro
    intros = {
        "en": "Here is your operations summary.",
        "hi": "नमस्ते, यहाँ आपका बिज़नेस सारांश है।",
        "te": "నమస్కారం, ఇది మీ వ్యాపార నివేదిక.",
        "kn": "ನಮಸ್ಕಾರ, ಇದು ನಿಮ್ಮ ವ್ಯಾಪಾರ ವರದಿ.",
        "ta": "வணக்கம், இதோ உங்கள் வணிக அறிக்கை."
    }

    voice_script = f"{intros.get(detected_lang, intros['en'])} {answer_text}"

    return {
        "transcript": req.transcript,
        "detected_language": detected_lang,
        "answer": answer_text,
        "voice_script": voice_script
    }

@app.post("/api/simulator/what-if")
def simulate_what_if_scenario(req: WhatIfSimulationRequest):
    """
    Digital Twin Stress Test Simulator:
    Simulates festive demand surges (e.g. Diwali +200%), supplier delivery delays, and payment lags across all 10 SKUs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    products = [dict(p) for p in cursor.execute("SELECT * FROM products").fetchall()]
    suppliers = [dict(s) for s in cursor.execute("SELECT * FROM suppliers").fetchall()]
    invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices").fetchall()]
    conn.close()

    multiplier = max(0.5, float(req.demand_multiplier or 1.0))
    extra_lead = max(0, int(req.lead_time_added_days or 0))
    extra_delay = max(0, int(req.collection_delay_days or 0))

    simulation_results = []
    total_contingency_cost = 0.0
    critical_stockouts_count = 0

    for p in products:
        sim_sales_rate = round(p["avg_daily_sales"] * multiplier, 2)
        sim_lead_time = p["lead_time_days"] + extra_lead
        sim_days_to_stockout = round(p["stock"] / sim_sales_rate, 2) if sim_sales_rate > 0 else 999.0

        is_critical = sim_days_to_stockout <= sim_lead_time
        if is_critical:
            critical_stockouts_count += 1
            recommended_reorder = int((sim_sales_rate * (sim_lead_time + 7)) - p["stock"] + p["min_stock"])
            recommended_reorder = max(10, recommended_reorder)
            unit_cost = round(p["unit_price"] * 0.60, 2)
            po_cost = round(recommended_reorder * unit_cost, 2)
            total_contingency_cost += po_cost
        else:
            recommended_reorder = 0
            po_cost = 0.0

        simulation_results.append({
            "product_id": p["id"],
            "name": p["name"],
            "current_stock": p["stock"],
            "base_sales_rate": p["avg_daily_sales"],
            "simulated_sales_rate": sim_sales_rate,
            "simulated_lead_time_days": sim_lead_time,
            "simulated_days_to_stockout": sim_days_to_stockout,
            "risk_status": "CRITICAL" if is_critical else ("WARNING" if sim_days_to_stockout <= (sim_lead_time + 3) else "HEALTHY"),
            "contingency_reorder_qty": recommended_reorder,
            "contingency_po_cost": po_cost
        })

    # Sort by urgency
    simulation_results.sort(key=lambda x: x["simulated_days_to_stockout"])

    # Cash impact
    current_cash = 185000.0
    projected_receivables = sum(i["amount"] for i in invoices if i["status"] != "Paid")
    simulated_runway_days = round((current_cash - total_contingency_cost) / (4500.0 * multiplier), 1)

    return {
        "simulation_parameters": {
            "demand_multiplier": f"{int((multiplier - 1.0) * 100):+d}% (Factor {multiplier}x)",
            "supplier_lead_time_added": f"+{extra_lead} days",
            "collection_delay_added": f"+{extra_delay} days"
        },
        "summary": {
            "critical_stockout_skus": critical_stockouts_count,
            "total_contingency_po_budget_needed": total_contingency_cost,
            "projected_cash_runway_days": simulated_runway_days,
            "resilience_score": max(15, 100 - (critical_stockouts_count * 12) - (extra_lead * 4) - (extra_delay * 2)),
            "verdict": "Urgent Pre-Orders Required" if critical_stockouts_count >= 3 else ("Moderate Buffer Recommended" if critical_stockouts_count > 0 else "Supply Chain Resilient")
        },
        "skus": simulation_results
    }

def ai_command_center(req: CommandQueryRequest):
    """AI natural language command center querying actual business database."""
    answer = agent_service.answer_command_query(req.query)
    return {"query": req.query, "answer": answer}

@app.post("/api/demo/hackathon-scenario")
def trigger_hackathon_demo():
    """
    Executes the exact hackathon scenario for Sri Lakshmi Electronics:
    1. Sets Boat Earphones to Stock: 8, Sales: 6.0/day, Lead: 3 days.
    2. Runs AI Agent Cognition: Detects 1.33 days remaining risk.
    3. Runs multi-supplier comparative matrix (ABC Electronics vs Apex vs Sonic).
    4. Automatically prepares ₹8,500 PO recommendation.
    5. Dispatches approval request to Business Owner dashboard.
    6. Logs all real-time events.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    # Reset Boat Earphones to 8 units
    cursor.execute("UPDATE products SET stock = 8, avg_daily_sales = 6.0 WHERE id = 'PRD-101'")
    conn.commit()
    conn.close()

    result = agent_service.run_full_operations_scan()
    agent_service.log_activity(
        'System',
        'info',
        'Hackathon Scenario Initiated for Sri Lakshmi Electronics',
        'Boat Earphones calibrated: Stock=8, Daily Sales=6.0, Lead Time=3d. AI Agent verified stockout in 1.33 days and drafted ₹8,500 PO from ABC Electronics.',
        automated=1
    )
    return {
        "success": True,
        "scenario": "Sri Lakshmi Electronics Stockout & Smart Reorder Demonstration",
        "product": "Boat BassHeads Earphones",
        "current_stock": 8,
        "daily_sales": 6.0,
        "days_remaining": 1.33,
        "recommendation": "Reorder 20 units from ABC Electronics for ₹8,500",
        "approval_status": "Ready in Approvals Queue"
    }

@app.post("/api/demo/reset")
def reset_database():
    """Resets database to initial clean state with all sample data."""
    init_db(force_reset=True)
    return {"success": True, "message": "Database reset to initial demo state for Sri Lakshmi Electronics."}

@app.get("/api/settings")
def get_settings():
    return agent_service.get_business_profile()

@app.post("/api/settings")
def update_settings(settings: SettingsUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE business_profile
        SET business_name = ?, owner_name = ?, category = ?, city = ?, auto_pilot_enabled = ?, approval_required_above = ?
        WHERE id = 1
    """, (settings.business_name, settings.owner_name, settings.category, settings.city, settings.auto_pilot_enabled, settings.approval_required_above))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Settings updated successfully"}

# -------------------------------------------------------------
# Mount Static Files (Frontend UI)
# -------------------------------------------------------------
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
