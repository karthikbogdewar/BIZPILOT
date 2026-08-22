"""
BizPilot AI - Multi-Agent System Unit & Integration Tests
Tests all 4 specialized agents:
1. Inventory Sentinel Agent
2. WhatsApp Customer & Sales Agent
3. Cash Flow & Accounts Receivable Agent
4. Supplier Negotiation & Procurement Agent
5. Multi-Agent Orchestrator Swarm
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import init_db
from backend.agents.inventory_agent import InventoryAgent
from backend.agents.sales_agent import SalesAgent
from backend.agents.cashflow_agent import CashflowAgent
from backend.agents.procurement_agent import ProcurementAgent
from backend.agents.orchestrator import agent_orchestrator

class TestMultiAgentSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db(force_reset=True)

    def test_01_agent_specifications(self):
        """Verify all 4 agents have valid Roles, Context, Prompts, and Tasks."""
        agents = agent_orchestrator.list_agents()
        self.assertEqual(len(agents), 4)

        agent_ids = [a["agent_id"] for a in agents]
        self.assertIn("agent_inventory", agent_ids)
        self.assertIn("agent_sales", agent_ids)
        self.assertIn("agent_cashflow", agent_ids)
        self.assertIn("agent_procurement", agent_ids)

        for a in agents:
            self.assertTrue(len(a["role"]) > 10, f"Role too short for {a['agent_id']}")
            self.assertTrue(len(a["context"]) > 10, f"Context too short for {a['agent_id']}")
            self.assertTrue("ROLE:" in a["system_prompt"] or "You are" in a["system_prompt"], f"Prompt missing role definition for {a['agent_id']}")
            self.assertTrue(len(a["supported_tasks"]) >= 2, f"Expected at least 2 tasks for {a['agent_id']}")
            self.assertEqual(a["status"], "ONLINE")

    def test_02_inventory_agent_tasks(self):
        """Test Inventory Sentinel Agent scanning and depletion forecast."""
        inv_agent = InventoryAgent()
        
        # Task 1: Scan stockout risks
        res = inv_agent.execute_task("scan_stockout_risks")
        self.assertEqual(res["status"], "COMPLETED")
        self.assertIn("metrics", res)
        self.assertTrue(res["metrics"]["total_skus"] >= 6)

        # Task 2: Single SKU depletion curve
        dep_res = inv_agent.execute_task("forecast_sku_depletion", {"product_id": "PRD-101"})
        self.assertEqual(dep_res["status"], "COMPLETED")
        self.assertEqual(len(dep_res["data"]["depletion_curve"]), 14)

    def test_03_sales_agent_tasks(self):
        """Test WhatsApp Customer & Sales Agent natural language order parsing and reply."""
        sales_agent = SalesAgent()
        
        # Task: Parse message
        msg = "Hi, send 2 Boat earphones and 3 chargers to my store"
        res = sales_agent.execute_task("parse_and_fulfill_message", {
            "message": msg,
            "customer_name": "Test Customer",
            "channel": "WhatsApp"
        })
        self.assertEqual(res["status"], "COMPLETED")
        self.assertTrue(res["total_amount"] > 0)
        self.assertTrue(len(res["items_parsed"]) >= 1)
        self.assertIn("upi://pay", res["drafted_reply"])

    def test_04_cashflow_agent_tasks(self):
        """Test Cash Flow Agent invoice audit, staging, and 30-day runway projection."""
        cash_agent = CashflowAgent()

        # Task 1: Audit receivables
        res = cash_agent.execute_task("audit_receivables")
        self.assertEqual(res["status"], "COMPLETED")
        self.assertIn("metrics", res)
        self.assertTrue(res["metrics"]["total_invoices"] >= 5)

        # Task 2: Forecast cash runway
        runway_res = cash_agent.execute_task("forecast_cash_runway", {"initial_cash_balance": 100000.0})
        self.assertEqual(runway_res["status"], "COMPLETED")
        self.assertIn("projected_30d_net_balance", runway_res)

    def test_05_procurement_agent_tasks(self):
        """Test Supplier Procurement Agent multi-criteria scoring and PO generation."""
        proc_agent = ProcurementAgent()

        # Task 1: Evaluate suppliers
        res = proc_agent.execute_task("evaluate_suppliers_for_sku", {"product_id": "PRD-101"})
        self.assertEqual(res["status"], "COMPLETED")
        self.assertTrue(len(res["comparison_matrix"]) >= 2)
        self.assertIn("winning_supplier", res)

        # Task 2: Draft PO & Approval
        po_res = proc_agent.execute_task("draft_purchase_order", {"product_id": "PRD-101"})
        self.assertEqual(po_res["status"], "COMPLETED")
        self.assertIn("po_id", po_res["po_draft"])

    def test_06_orchestrator_swarm_cycle(self):
        """Test end-to-end coordinated Multi-Agent Swarm cycle."""
        swarm_res = agent_orchestrator.run_full_swarm_cycle()
        self.assertEqual(swarm_res["status"], "SUCCESS")
        self.assertEqual(swarm_res["agents_engaged"], 4)
        self.assertIn("inventory_sentinel", swarm_res)
        self.assertIn("procurement_agent", swarm_res)
        self.assertIn("cashflow_agent", swarm_res)

if __name__ == "__main__":
    unittest.main()
