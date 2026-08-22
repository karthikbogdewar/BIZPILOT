import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import (
    get_dashboard,
    get_products,
    update_product_stock,
    create_manual_order,
    update_order_status,
    get_approvals,
    request_changes_approval,
    get_product_supplier_comparison,
    get_activity_logs,
    ai_command_center,
    simulate_what_if_scenario,
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    UpdateStockRequest,
    RequestChangesApprovalRequest,
    WhatIfSimulationRequest,
    CommandQueryRequest
)
from backend.database import init_db

class TestFastApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db(force_reset=True)

    def test_01_dashboard_endpoint(self):
        data = get_dashboard()
        self.assertIn("stats", data)
        self.assertIn("priority", data)
        self.assertIn("daily_summary", data)

    def test_02_products_and_stock_update(self):
        products = get_products()
        self.assertGreater(len(products), 0)
        
        # Test stock adjustment
        prod_id = products[0]["id"]
        res_patch = update_product_stock(prod_id, UpdateStockRequest(new_stock=25))
        self.assertTrue(res_patch["success"])
        self.assertEqual(res_patch["new_stock"], 25)

    def test_03_create_order_and_update_status(self):
        order_req = CreateOrderRequest(
            customer_name="Test Customer",
            customer_phone="+91 9988776655",
            channel="In-Store",
            payment_status="Paid",
            status="Confirmed",
            items=[
                {"product_id": "PRD-101", "name": "Boat BassHeads Earphones", "qty": 2, "price": 499.0}
            ],
            total_amount=998.0
        )
        data = create_manual_order(order_req)
        self.assertTrue(data["success"])
        order_id = data["order_id"]

        # Test status update
        res_status = update_order_status(order_id, UpdateOrderStatusRequest(status="Delivered", payment_status="Paid"))
        self.assertTrue(res_status["success"])

    def test_04_approvals_request_changes(self):
        approvals = get_approvals()
        if approvals:
            app_id = approvals[0]["id"]
            res_req = request_changes_approval(app_id, RequestChangesApprovalRequest(feedback="Negotiate 10% first"))
            self.assertTrue(res_req["success"])

    def test_05_supplier_comparison_and_activity_logs(self):
        res_comp = get_product_supplier_comparison("PRD-101")
        self.assertIsNotNone(res_comp)
        
        res_logs = get_activity_logs()
        self.assertIsInstance(res_logs, list)

    def test_06_what_if_simulation(self):
        sim_req = WhatIfSimulationRequest(
            demand_multiplier=2.5,
            lead_time_added_days=3
        )
        data = simulate_what_if_scenario(sim_req)
        self.assertIn("skus_at_risk", data)
        self.assertIn("estimated_festive_revenue", data)

    def test_07_ai_command_query(self):
        cmd_req = CommandQueryRequest(query="Which products are low on stock?")
        data = ai_command_center(cmd_req)
        self.assertIn("answer", data)

if __name__ == "__main__":
    unittest.main()
