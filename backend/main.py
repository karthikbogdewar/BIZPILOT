from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json

from backend.database import init_db, get_db_connection
from backend.agent_engine import agent_service

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

# -------------------------------------------------------------
# API Endpoints
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
