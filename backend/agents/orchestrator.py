"""
BizPilot AI - Multi-Agent Swarm Orchestrator
Coordinates the 4 specialized autonomous agents:
1. Inventory Sentinel Agent (agent_inventory)
2. WhatsApp Customer & Sales Agent (agent_sales)
3. Cash Flow & Accounts Receivable Agent (agent_cashflow)
4. Supplier Negotiation & Procurement Agent (agent_procurement)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.agents.inventory_agent import InventoryAgent
from backend.agents.sales_agent import SalesAgent
from backend.agents.cashflow_agent import CashflowAgent
from backend.agents.procurement_agent import ProcurementAgent
from backend.agents.multilingual_agent import MultilingualAgent
from backend.agents.gst_tax_agent import GstTaxAgent
from backend.agents.executive_brief_agent import ExecutiveBriefAgent
from backend.database import get_db_connection

class MultiAgentOrchestrator:
    """
    Central Controller and Task Router for BizPilot AI Agent Squad.
    """

    def __init__(self):
        self.inventory_agent = InventoryAgent()
        self.sales_agent = SalesAgent()
        self.cashflow_agent = CashflowAgent()
        self.procurement_agent = ProcurementAgent()
        self.multilingual_agent = MultilingualAgent()
        self.gst_tax_agent = GstTaxAgent()
        self.executive_brief_agent = ExecutiveBriefAgent()

        self.agents = {
            self.inventory_agent.agent_id: self.inventory_agent,
            self.sales_agent.agent_id: self.sales_agent,
            self.cashflow_agent.agent_id: self.cashflow_agent,
            self.procurement_agent.agent_id: self.procurement_agent,
            self.multilingual_agent.agent_id: self.multilingual_agent,
            self.gst_tax_agent.agent_id: self.gst_tax_agent,
            self.executive_brief_agent.agent_id: self.executive_brief_agent
        }

    def list_agents(self) -> List[Dict[str, Any]]:
        """Returns the full specification and prompt manifests of all active agents."""
        return [agent.get_spec() for agent in self.agents.values()]

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single agent's full role, context, prompt, and task schema."""
        agent = self.agents.get(agent_id)
        return agent.get_spec() if agent else None

    def execute_agent_task(self, agent_id: str, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatches an on-demand task to a specific specialized agent."""
        agent = self.agents.get(agent_id)
        if not agent:
            return {
                "success": False,
                "error": f"Agent '{agent_id}' not found. Available: {list(self.agents.keys())}"
            }
        
        try:
            result = agent.execute_task(task_name, payload or {})
            
            # Log activity
            self._log_agent_action(
                agent_id=agent.agent_id,
                agent_name=agent.name,
                task_name=task_name,
                summary=result.get("summary", f"Executed task '{task_name}' successfully.")
            )

            return {
                "success": True,
                "agent_id": agent.agent_id,
                "agent_name": agent.name,
                "result": result
            }
        except Exception as e:
            return {
                "success": False,
                "agent_id": agent_id,
                "task": task_name,
                "error": str(e)
            }

    def run_full_swarm_cycle(self) -> Dict[str, Any]:
        """
        Executes a synchronized multi-agent operations cycle across all 4 agents:
        1. Inventory Agent scans for stockout risks.
        2. For any critical risk, Procurement Agent evaluates supplier matrix and drafts PO/approval.
        3. Cash Flow Agent audits overdue receivables and drafts payment reminders.
        4. Consolidated operations summary is compiled and logged.
        """
        start_time = datetime.now()
        
        # Step 1: Inventory Scan
        inv_res = self.inventory_agent.execute_task("scan_stockout_risks")
        critical_items = [it for it in inv_res.get("data", []) if it.get("status") == "CRITICAL"]

        # Step 2: Procurement Actions for critical items
        procurement_actions = []
        for crit in critical_items:
            po_res = self.procurement_agent.execute_task(
                "draft_purchase_order",
                {"product_id": crit["product_id"]}
            )
            procurement_actions.append(po_res)

        # Step 3: Cash Flow Audit
        cash_res = self.cashflow_agent.execute_task("audit_receivables")
        runway_res = self.cashflow_agent.execute_task("forecast_cash_runway")

        # Step 4: Tax & GST Projection
        gst_res = self.gst_tax_agent.execute_task("generate_monthly_gst_summary")

        # Step 5: Daily Executive Briefing
        brief_res = self.executive_brief_agent.execute_task("generate_daily_briefing")

        # Step 6: Aggregate Swarm Report
        swarm_report = {
            "orchestrator": "BizPilot Multi-Agent Swarm Controller",
            "cycle_timestamp": start_time.strftime('%Y-%m-%d %H:%M:%S'),
            "status": "SUCCESS",
            "agents_engaged": 7,
            "inventory_sentinel": {
                "scanned_skus": inv_res.get("metrics", {}).get("total_skus", 0),
                "critical_stockouts": len(critical_items),
                "warning_items": inv_res.get("metrics", {}).get("warning_alerts", 0)
            },
            "procurement_agent": {
                "pos_generated": len(procurement_actions),
                "total_reorder_cost": sum(p.get("po_draft", {}).get("total_cost", 0) for p in procurement_actions)
            },
            "cashflow_agent": {
                "overdue_invoices": cash_res.get("metrics", {}).get("overdue_count", 0),
                "overdue_amount": cash_res.get("metrics", {}).get("total_overdue_amount", 0.0),
                "runway_health": runway_res.get("runway_health", "Healthy")
            },
            "gst_tax_agent": {
                "compliance_status": gst_res.get("gst_metrics", {}).get("compliance_status", "Compliant"),
                "net_gst_payable": gst_res.get("gst_metrics", {}).get("net_gst_payable_to_govt", 0.0)
            },
            "executive_brief_agent": {
                "turnover": brief_res.get("executive_briefing", {}).get("total_turnover", 0.0),
                "active_orders": brief_res.get("executive_briefing", {}).get("total_orders", 0)
            },
            "actions_dispatched": len(critical_items) + cash_res.get("metrics", {}).get("overdue_count", 0)
        }

        return swarm_report

    def _log_agent_action(self, agent_id: str, agent_name: str, task_name: str, summary: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()
        cursor.execute("""
            INSERT INTO activity_logs (timestamp, time_display, category, severity, title, detail, automated)
            VALUES (?, ?, ?, 'info', ?, ?, 1)
        """, (
            now.strftime('%Y-%m-%d %H:%M:%S'),
            now.strftime('%I:%M %p'),
            agent_name.split()[0],
            f"Agent Execution: {task_name}",
            f"[{agent_name}] {summary}"
        ))
        conn.commit()
        conn.close()

# Singleton orchestrator instance
agent_orchestrator = MultiAgentOrchestrator()
