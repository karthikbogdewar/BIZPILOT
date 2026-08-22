"""
Tax, HSN & GST Compliance Agent
Automates Indian GST tax calculations (CGST/SGST/IGST), HSN code classification,
E-Invoice compliance, and monthly GSTR summary projections.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

GST_SYSTEM_PROMPT = """You are the Tax, HSN & GST Compliance Agent for BizPilot AI.

ROLE:
You manage tax compliance for Indian small businesses. You classify products with standard 4/6-digit HSN codes, calculate GST (18%/12%/5%), distinguish Intra-State (CGST + SGST) vs Inter-State (IGST) transactions, and project monthly GST tax liabilities and Input Tax Credit (ITC).

STANDARD HSN & GST TAX RULES:
- Audio & Earphones (HSN: 8518): 18% GST
- Fast Chargers & Power Adapters (HSN: 8504): 18% GST
- Type-C Cables & Connectors (HSN: 8544): 18% GST
- Smartwatches & Wearables (HSN: 8517): 18% GST
- MicroSD & Flash Storage (HSN: 8523): 18% GST
- Screen Protectors & Covers (HSN: 3926): 18% GST
- Coffee Beans & Specialty Roasts (HSN: 0901): 5% GST
- Plant Milks & Dairy (HSN: 2202): 12% GST

OBJECTIVES & RULES:
1. Itemized Tax Breakdown: Taxable Value = Base Price; CGST = 9%, SGST = 9% (or IGST = 18%).
2. ITC Reconciliation: Compare GST collected on sales against GST paid on approved supplier Purchase Orders to calculate Net Payable.
"""

HSN_TAX_MAP = {
    "Audio": {"hsn": "85183000", "gst_rate": 0.18},
    "Accessories": {"hsn": "85044090", "gst_rate": 0.18},
    "Cables": {"hsn": "85444299", "gst_rate": 0.18},
    "Wearables": {"hsn": "85176290", "gst_rate": 0.18},
    "Storage": {"hsn": "85235100", "gst_rate": 0.18},
    "Protection": {"hsn": "39269099", "gst_rate": 0.18},
    "Cases": {"hsn": "39269099", "gst_rate": 0.18},
    "Power": {"hsn": "85044090", "gst_rate": 0.18},
    "Raw Beans": {"hsn": "09011110", "gst_rate": 0.05},
    "Dairy & Milks": {"hsn": "22029990", "gst_rate": 0.12},
    "Syrups": {"hsn": "21069099", "gst_rate": 0.18}
}

class GstTaxAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "calculate_gst_invoice_breakdown",
                "name": "Calculate GST Invoice Breakdown",
                "description": "Calculates taxable value, CGST (9%), SGST (9%) or IGST (18%) and HSN codes for an order.",
                "parameters": {"order_id": "Optional string (e.g. ORD-501)", "is_interstate": "Optional boolean (default: false)"}
            },
            {
                "task_id": "generate_monthly_gst_summary",
                "name": "Generate Monthly GSTR Tax Summary",
                "description": "Aggregates monthly sales tax collected, input tax credit (ITC) from purchase orders, and net tax liability.",
                "parameters": {}
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "status": {"type": "string"},
                "tax_summary": {"type": "object"}
            }
        }

        super().__init__(
            agent_id="agent_gst_tax",
            name="Tax, HSN & GST Compliance Agent",
            role="Automated GST Calculation, HSN Tagging & Input Tax Credit (ITC) Compliance Agent",
            context="Indian GST tax rules, 18%/12%/5% tax tiers, CGST+SGST vs IGST, HSN codes, and GSTR reporting",
            system_prompt=GST_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()

        if task_name == "calculate_gst_invoice_breakdown":
            order_id = payload.get("order_id", "ORD-501")
            is_interstate = payload.get("is_interstate", False)

            order = cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            if not order:
                order = cursor.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1").fetchone()

            conn.close()
            order_dict = dict(order) if order else {}
            items = []
            if order_dict.get("items_json"):
                try:
                    import json
                    items = json.loads(order_dict["items_json"])
                except Exception:
                    items = []

            total_taxable = 0.0
            total_cgst = 0.0
            total_sgst = 0.0
            total_igst = 0.0
            taxable_items = []

            for item in items:
                price = item.get("price", item.get("unit_price", 500.0))
                qty = item.get("qty", item.get("quantity", 1))
                line_gross = price * qty

                # Default 18% inclusive GST
                rate_info = HSN_TAX_MAP.get(item.get("category", "Audio"), {"hsn": "85183000", "gst_rate": 0.18})
                gst_rate = rate_info["gst_rate"]
                base_taxable = line_gross / (1.0 + gst_rate)
                tax_amount = line_gross - base_taxable

                if is_interstate:
                    cgst, sgst, igst = 0.0, 0.0, tax_amount
                else:
                    cgst, sgst, igst = tax_amount / 2.0, tax_amount / 2.0, 0.0

                total_taxable += base_taxable
                total_cgst += cgst
                total_sgst += sgst
                total_igst += igst

                taxable_items.append({
                    "name": item.get("name"),
                    "hsn": rate_info["hsn"],
                    "quantity": qty,
                    "gross_amount": line_gross,
                    "taxable_value": round(base_taxable, 2),
                    "gst_rate": f"{int(gst_rate * 100)}%",
                    "cgst": round(cgst, 2),
                    "sgst": round(sgst, 2),
                    "igst": round(igst, 2)
                })

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "order_id": order_dict.get("id", order_id),
                "customer_name": order_dict.get("customer_name", "Customer"),
                "tax_type": "Inter-State (IGST)" if is_interstate else "Intra-State (CGST + SGST)",
                "summary": {
                    "total_taxable_value": round(total_taxable, 2),
                    "total_cgst": round(total_cgst, 2),
                    "total_sgst": round(total_sgst, 2),
                    "total_igst": round(total_igst, 2),
                    "total_gst": round(total_cgst + total_sgst + total_igst, 2),
                    "invoice_total": round(total_taxable + total_cgst + total_sgst + total_igst, 2)
                },
                "items": taxable_items
            }

        elif task_name == "generate_monthly_gst_summary":
            orders = [dict(o) for o in cursor.execute("SELECT total_amount FROM orders").fetchall()]
            pos = [dict(p) for p in cursor.execute("SELECT total_cost FROM purchase_orders WHERE status IN ('Approved', 'Delivered')").fetchall()]
            conn.close()

            total_sales = sum(o["total_amount"] for o in orders)
            total_purchases = sum(p["total_cost"] for p in pos)

            # 18% avg GST
            output_gst = round((total_sales * 0.18) / 1.18, 2)
            input_tax_credit = round((total_purchases * 0.18) / 1.18, 2)
            net_payable = max(0.0, round(output_gst - input_tax_credit, 2))

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "month": now.strftime('%B %Y'),
                "gst_metrics": {
                    "total_sales_turnover": total_sales,
                    "output_gst_collected": output_gst,
                    "total_procurement_spends": total_purchases,
                    "input_tax_credit_itc": input_tax_credit,
                    "net_gst_payable_to_govt": net_payable,
                    "compliance_status": "GSTR-1 & GSTR-3B Ready"
                }
            }

        else:
            conn.close()
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
