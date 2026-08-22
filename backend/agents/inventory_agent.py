"""
Inventory Sentinel & Demand Forecasting Agent
Monitors stock levels, calculates sales velocity, forecasts days-to-stockout,
and computes optimal safety buffer reorder points.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import math
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

INVENTORY_SYSTEM_PROMPT = """You are the Inventory Sentinel & Demand Forecasting Agent for BizPilot AI.

ROLE:
You are responsible for 24/7 autonomous stock monitoring, sales velocity calculation, days-to-stockout prediction, and automated safety stock optimization.

OPERATIONAL CONTEXT:
Small business retail & wholesale operations where delayed stock reorders cause lost revenue and cash lock-in from overstock hurts working capital. You monitor all active SKUs, their real-time warehouse count, daily sales velocity (units/day), minimum safety thresholds, and supplier lead times (days).

OBJECTIVES & RULES:
1. Calculate Days-to-Stockout: days_remaining = current_stock / avg_daily_sales.
2. Flag Critical Stockout Risks: Whenever days_remaining <= supplier_lead_time_days OR current_stock <= min_stock.
3. Compute Optimal Reorder Quantity (EOQ/Buffer): Target reorder quantity must cover 15 to 20 days of average demand plus lead-time buffer.
4. Output structured analysis with actionable urgency ratings (CRITICAL, WARNING, OPTIMAL).

OUTPUT SPECIFICATION:
Return a JSON object containing:
- analysis_timestamp: ISO timestamp
- total_skus_scanned: Integer
- critical_risks_count: Integer
- warnings_count: Integer
- items: List of evaluated products with days_remaining, risk_status, stockout_date, recommended_reorder_qty, and justification.
"""

class InventoryAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "scan_stockout_risks",
                "name": "Scan Stockout & Lead Time Risks",
                "description": "Scans all SKUs to detect imminent stockouts where days remaining is less than or equal to delivery lead time.",
                "parameters": {}
            },
            {
                "task_id": "calculate_reorder_quantities",
                "name": "Calculate Buffer & Reorder Quantities",
                "description": "Calculates optimal replenishment batch sizes based on safety buffer targets and supplier lead times.",
                "parameters": {"target_days_buffer": "Optional integer (default: 15)"}
            },
            {
                "task_id": "forecast_sku_depletion",
                "name": "Forecast Single SKU Depletion",
                "description": "Generates a day-by-day depletion curve and projected stockout date for a given product ID.",
                "parameters": {"product_id": "Required string (e.g. PRD-101)"}
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "timestamp": {"type": "string"},
                "status": {"type": "string"},
                "summary": {"type": "string"},
                "metrics": {
                    "type": "object",
                    "properties": {
                        "total_skus": {"type": "integer"},
                        "critical_alerts": {"type": "integer"},
                        "warning_alerts": {"type": "integer"},
                        "healthy_count": {"type": "integer"}
                    }
                },
                "data": {"type": "array"}
            }
        }

        super().__init__(
            agent_id="agent_inventory",
            name="Inventory Sentinel Agent",
            role="Autonomous Inventory Health & Stockout Forecasting Agent",
            context="Real-time warehouse telemetry, SKU sales velocities, safety stock buffers, days-to-stockout calculations",
            system_prompt=INVENTORY_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()

        if task_name == "scan_stockout_risks" or task_name == "calculate_reorder_quantities":
            target_buffer = int(payload.get("target_days_buffer", 15))
            products = [dict(p) for p in cursor.execute("SELECT * FROM products").fetchall()]
            conn.close()

            analyzed = []
            critical_count = 0
            warning_count = 0
            healthy_count = 0

            for p in products:
                stock = p["stock"]
                daily_sales = p["avg_daily_sales"]
                lead_days = p["lead_time_days"]
                min_stock = p["min_stock"]

                days_rem = round(stock / daily_sales, 2) if daily_sales > 0 else 999.0
                is_critical = days_rem <= lead_days
                is_warning = not is_critical and (stock <= min_stock or days_rem <= (lead_days + 3))

                if is_critical:
                    critical_count += 1
                    status = "CRITICAL"
                elif is_warning:
                    warning_count += 1
                    status = "WARNING"
                else:
                    healthy_count += 1
                    status = "OPTIMAL"

                # Optimal reorder calculation: (target_days + lead_time) * daily_sales - current_stock
                recommended_qty = max(0, math.ceil(((target_buffer + lead_days) * daily_sales) - stock))
                if recommended_qty > 0:
                    recommended_qty = math.ceil(recommended_qty / 5) * 5  # round up to multiple of 5

                analyzed.append({
                    "product_id": p["id"],
                    "name": p["name"],
                    "category": p["category"],
                    "current_stock": stock,
                    "avg_daily_sales": daily_sales,
                    "lead_time_days": lead_days,
                    "days_remaining": days_rem,
                    "status": status,
                    "recommended_reorder_qty": recommended_qty,
                    "projected_stockout_date": (datetime.now() + timedelta(days=days_rem)).strftime('%Y-%m-%d'),
                    "risk_analysis": (
                        f"Will stockout in {days_rem} days before {lead_days}-day supplier shipment arrives!"
                        if is_critical else
                        (f"Stock approaching minimum threshold ({stock}/{min_stock})." if is_warning else "Inventory levels optimal.")
                    )
                })

            # Sort by urgency
            analyzed.sort(key=lambda x: (0 if x["status"] == "CRITICAL" else (1 if x["status"] == "WARNING" else 2), x["days_remaining"]))

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "summary": f"Scanned {len(products)} SKUs. Found {critical_count} critical stockout risks and {warning_count} warning items.",
                "metrics": {
                    "total_skus": len(products),
                    "critical_alerts": critical_count,
                    "warning_alerts": warning_count,
                    "healthy_count": healthy_count
                },
                "data": analyzed
            }

        elif task_name == "forecast_sku_depletion":
            product_id = payload.get("product_id", "PRD-101")
            product = cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
            conn.close()

            if not product:
                return {
                    "agent_id": self.agent_id,
                    "task": task_name,
                    "status": "FAILED",
                    "error": f"Product '{product_id}' not found."
                }

            p = dict(product)
            stock = p["stock"]
            sales = p["avg_daily_sales"]
            curve = []
            curr_stock = stock
            for day in range(1, 15):
                curr_stock = max(0, round(curr_stock - sales, 1))
                curve.append({
                    "day": day,
                    "date": (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d'),
                    "estimated_stock": curr_stock,
                    "stockout": curr_stock == 0
                })

            days_rem = round(stock / sales, 2) if sales > 0 else 999.0
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "summary": f"Generated 14-day stock depletion curve for '{p['name']}'.",
                "data": {
                    "product": p,
                    "days_remaining": days_rem,
                    "stockout_date": (datetime.now() + timedelta(days=days_rem)).strftime('%Y-%m-%d'),
                    "depletion_curve": curve
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
