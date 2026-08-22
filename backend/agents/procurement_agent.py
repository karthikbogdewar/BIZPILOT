"""
Supplier Negotiation & Procurement Agent
Compares vendor pricing, lead time SLAs, MOQ constraints, and reliability scores.
Builds optimal purchase orders and generates supplier RFQ purchase requests.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import math
import random
import json
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

PROCUREMENT_SYSTEM_PROMPT = """You are the Supplier Negotiation & Procurement Agent for BizPilot AI.

ROLE:
You manage the small business supplier ecosystem, evaluate multi-vendor price matrices, calculate total landed costs, negotiate terms, prepare Purchase Orders (POs), and dispatch formal RFQs (Request for Quotations).

OPERATIONAL CONTEXT:
Multiple suppliers often carry identical or substitute SKUs with varying trade-offs (e.g. Supplier A is cheaper by 5% but takes 5 days; Supplier B is slightly pricier but delivers in 24 hours with 98% reliability). When stockout is imminent, speed must be prioritized; when restocking routine safety stock, unit margin is prioritized.

OBJECTIVES & RULES:
1. Multi-Criteria Scoring Algorithm:
   - Price Weight (40%): Higher score for lower unit price.
   - Lead Time SLA (35%): Critical when days-remaining < lead-time.
   - Reliability History (25%): Vendor on-time delivery score (0-100%).
2. Automatic PO Drafting: Construct structured Purchase Orders with product ID, supplier ID, quantity, negotiated cost, estimated delivery, and approval status.
3. Vendor RFQ Generation: Compose professional supplier purchase communications ready for WhatsApp or Email.

OUTPUT SPECIFICATION:
Return a JSON object containing:
- product_evaluated: Product name & SKU
- winning_supplier: Best vendor selected by multi-criteria optimization
- full_comparison_matrix: Ranked list of all vendors with scores & rationale
- po_draft: Structured Purchase Order ready for Owner Approval
- vendor_communication: Ready-to-send WhatsApp / Email purchase order draft
"""

class ProcurementAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "evaluate_suppliers_for_sku",
                "name": "Evaluate & Rank Suppliers for SKU",
                "description": "Runs multi-criteria scoring across all registered vendors for a product to determine the optimal supplier.",
                "parameters": {"product_id": "Required string (e.g. PRD-101)"}
            },
            {
                "task_id": "draft_purchase_order",
                "name": "Draft Purchase Order & Approval",
                "description": "Generates a formal PO record and queues a high-priority approval card on the owner dashboard.",
                "parameters": {
                    "product_id": "Required string",
                    "quantity": "Optional integer",
                    "supplier_id": "Optional string"
                }
            },
            {
                "task_id": "generate_vendor_rfq",
                "name": "Generate Vendor RFQ Purchase Request",
                "description": "Composes a formal purchase order email / WhatsApp message to be dispatched to the supplier contact.",
                "parameters": {"po_id": "Required string (e.g. PO-901)"}
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "timestamp": {"type": "string"},
                "status": {"type": "string"},
                "product_id": {"type": "string"},
                "winning_supplier": {"type": "object"},
                "comparison_matrix": {"type": "array"},
                "po_draft": {"type": "object"}
            }
        }

        super().__init__(
            agent_id="agent_procurement",
            name="Supplier Negotiation & Procurement Agent",
            role="Supplier SLA Evaluation, Landed Cost Optimization & Automated PO Agent",
            context="Supplier catalogs, historical fulfillment SLAs, reliability scores, price tiers, MOQs (Minimum Order Quantities)",
            system_prompt=PROCUREMENT_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()

        if task_name == "evaluate_suppliers_for_sku" or task_name == "draft_purchase_order":
            product_id = payload.get("product_id", "PRD-101")
            product = cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()

            if not product:
                conn.close()
                return {
                    "agent_id": self.agent_id,
                    "task": task_name,
                    "status": "FAILED",
                    "error": f"Product '{product_id}' not found."
                }

            p = dict(product)
            suppliers_data = cursor.execute("""
                SELECT s.id, s.name, s.contact_name, s.phone, s.reliability_score, s.payment_terms,
                       sp.price, sp.lead_time_days, sp.moq
                FROM suppliers s
                JOIN supplier_products sp ON s.id = sp.supplier_id
                WHERE sp.product_id = ?
            """, (product_id,)).fetchall()

            if not suppliers_data:
                conn.close()
                return {
                    "agent_id": self.agent_id,
                    "task": task_name,
                    "status": "FAILED",
                    "error": f"No suppliers found for product '{product_id}'."
                }

            days_remaining = round(p['stock'] / p['avg_daily_sales'], 2) if p['avg_daily_sales'] > 0 else 999.0
            comparisons = []
            
            # Find min price and min lead time for normalization
            prices = [s['price'] for s in suppliers_data]
            min_price = min(prices) if prices else 1.0

            for s in suppliers_data:
                s_dict = dict(s)
                price = s_dict['price']
                lead = s_dict['lead_time_days']
                rel = s_dict['reliability_score']

                # Price score (0-40)
                price_score = (min_price / price) * 40.0

                # Lead time score (0-35)
                # If lead time > days_remaining, severe penalty
                if lead > days_remaining:
                    lead_score = 5.0
                    reason_penalty = "Delivery lead time exceeds stockout buffer!"
                else:
                    lead_score = 35.0 - (lead * 3.0)
                    reason_penalty = None

                # Reliability score (0-25)
                rel_score = (rel / 100.0) * 25.0

                composite_score = round(price_score + lead_score + rel_score, 1)

                comparisons.append({
                    "supplier_id": s_dict['id'],
                    "name": s_dict['name'],
                    "contact_name": s_dict['contact_name'],
                    "phone": s_dict['phone'],
                    "unit_price": price,
                    "lead_time_days": lead,
                    "reliability_score": rel,
                    "payment_terms": s_dict['payment_terms'],
                    "moq": s_dict['moq'],
                    "composite_score": composite_score,
                    "penalty_warning": reason_penalty
                })

            comparisons.sort(key=lambda x: x['composite_score'], reverse=True)
            best_supplier = comparisons[0]

            # Reorder quantity
            reorder_qty = payload.get("quantity")
            if not reorder_qty:
                reorder_qty = max(best_supplier['moq'], math.ceil((15 + best_supplier['lead_time_days']) * p['avg_daily_sales'] - p['stock']))
                reorder_qty = math.ceil(reorder_qty / 5) * 5

            total_cost = round(reorder_qty * best_supplier['unit_price'], 2)

            po_id = f"PO-{random.randint(100, 999)}"
            po_record = {
                "po_id": po_id,
                "product_id": p['id'],
                "product_name": p['name'],
                "supplier_id": best_supplier['supplier_id'],
                "supplier_name": best_supplier['name'],
                "quantity": reorder_qty,
                "unit_cost": best_supplier['unit_price'],
                "total_cost": total_cost,
                "estimated_delivery_days": best_supplier['lead_time_days'],
                "status": "Pending Approval",
                "created_at": now.strftime('%Y-%m-%d %H:%M')
            }

            if task_name == "draft_purchase_order":
                # Insert PO and Approval card
                cursor.execute("""
                    INSERT INTO purchase_orders (id, product_id, product_name, supplier_id, supplier_name, quantity, unit_cost, total_cost, estimated_delivery_days, status, created_at, approved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Approval', ?, NULL)
                """, (
                    po_id,
                    p['id'],
                    p['name'],
                    best_supplier['supplier_id'],
                    best_supplier['name'],
                    reorder_qty,
                    best_supplier['unit_price'],
                    total_cost,
                    best_supplier['lead_time_days'],
                    now.strftime('%Y-%m-%d %H:%M')
                ))

                app_id = f"APP-{random.randint(100, 999)}"
                cursor.execute("""
                    INSERT INTO approvals (id, type, priority, title, description, recommendation, amount, reference_id, status, metadata_json, created_at, resolved_at)
                    VALUES (?, 'Purchase Order', 'High', ?, ?, ?, ?, ?, 'Pending', ?, ?, NULL)
                """, (
                    app_id,
                    f"Reorder PO: {p['name']} ({reorder_qty} units)",
                    f"Stock is {p['stock']} units (exhausts in {days_remaining}d). Procurement agent recommends {best_supplier['name']}.",
                    f"Approve purchase of {reorder_qty} units from {best_supplier['name']} at ₹{best_supplier['unit_price']}/unit (Total: ₹{total_cost:,.2f}).",
                    total_cost,
                    po_id,
                    json.dumps(po_record),
                    now.strftime('%Y-%m-%d %H:%M')
                ))
                conn.commit()

            conn.close()

            # Vendor RFQ draft
            vendor_msg = (
                f"Purchase Order Notice: {best_supplier['name']}\n"
                f"Attention: {best_supplier['contact_name']}\n"
                f"Please dispatch: {reorder_qty} units of '{p['name']}' @ ₹{best_supplier['unit_price']}/unit.\n"
                f"Total Value: ₹{total_cost:,.2f} | Terms: {best_supplier['payment_terms']}\n"
                f"Expected SLA: {best_supplier['lead_time_days']} Days Delivery."
            )

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "product_evaluated": p['name'],
                "winning_supplier": best_supplier,
                "comparison_matrix": comparisons,
                "po_draft": po_record,
                "vendor_rfq_draft": vendor_msg
            }

        else:
            conn.close()
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
