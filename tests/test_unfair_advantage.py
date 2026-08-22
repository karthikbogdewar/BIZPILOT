"""
Unit Tests for BizPilot AI Unfair Advantage Innovation Suite:
1. Autonomous B2B Vendor Price Negotiation
2. Physical Handwritten Bill & Chitti OCR Digitizer
3. Multi-Branch Stock Rebalancing & Inter-Store Teleportation
4. 'While You Slept' 24-Hour Autonomous Shift Simulator
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import init_db
from backend.agents.negotiation_agent import vendor_negotiation_engine
from backend.ocr_service import bill_ocr_service
from backend.branch_service import multi_branch_service
from backend.night_shift_simulator import night_shift_simulator

class TestUnfairAdvantageSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_vendor_price_negotiation_engine(self):
        """Verify AI counter-offer calculation with volume, history, and UPI cashflow leverage."""
        res = vendor_negotiation_engine.generate_counter_offer(
            product_name="Boat BassHeads Earphones",
            supplier_name="ABC Electronics Distributors",
            initial_unit_price=425.0,
            quantity=20,
            payment_terms="Immediate UPI Settlement",
            lifetime_purchases_count=15
        )
        self.assertEqual(res["status"], "NEGOTIATION_DRAFTED")
        self.assertLess(res["counter_unit_price"], 425.0)
        self.assertGreater(res["margin_saved"], 0)
        self.assertGreaterEqual(len(res["leverage_points"]), 2)
        self.assertIn("Immediate 100% advance UPI settlement", " ".join(res["leverage_points"]))
        self.assertIn("₹", res["proposal_message"])

    def test_02_physical_bill_ocr_digitizer(self):
        """Verify handwritten paper slip text parsing, item extraction, and GST Input Tax Credit (ITC)."""
        slip_text = """
        Charni Road Wholesale Electronics Hub
        Challan Date: 22-Aug-2026
        Items:
        20 pcs Boat BassHeads Earphones @ 410.00
        10 pcs 65W GaN Fast Charger @ 810.00
        Tax: CGST 9% SGST 9%
        """
        parsed = bill_ocr_service.parse_bill_text(slip_text)
        self.assertGreaterEqual(parsed["items_count"], 2)
        self.assertGreater(parsed["taxable_amount"], 0)
        self.assertGreater(parsed["input_tax_credit_claimable"], 0)

        # Test committing bill to inventory
        commit_res = bill_ocr_service.commit_bill_to_inventory(parsed)
        self.assertTrue(commit_res["success"])
        self.assertGreater(commit_res["items_restocked_count"], 0)

    def test_03_multi_branch_inventory_rebalancing(self):
        """Verify multi-branch stock tracking and internal transfer gate pass generation."""
        overview = multi_branch_service.get_multi_branch_overview()
        self.assertEqual(overview["total_branches"], 3)
        self.assertIn("branch_inventory", overview)
        
        # Test executing internal stock transfer
        transfer_res = multi_branch_service.execute_internal_transfer(
            transfer_id="TRF-PRD-101-01",
            product_id="PRD-101",
            quantity=15,
            source_branch="Jayanagar Wholesale Branch",
            target_branch="Indiranagar Flagship Outlet"
        )
        self.assertTrue(transfer_res["success"])
        self.assertIn("GP-", transfer_res["gate_pass_id"])
        self.assertEqual(transfer_res["quantity_transferred"], 15)

    def test_04_night_shift_autonomous_simulator(self):
        """Verify 24-hour autonomous shift execution across sales, sentinel, negotiation, Khata & CEO brief."""
        shift = night_shift_simulator.run_24h_autonomous_shift()
        self.assertEqual(shift["status"], "COMPLETED")
        self.assertIn("summary_scorecard", shift)
        self.assertGreater(shift["summary_scorecard"]["total_revenue_captured"], 0)
        self.assertGreater(shift["summary_scorecard"]["cash_reconciled"], 0)
        self.assertGreater(shift["summary_scorecard"]["margin_and_capital_saved"], 0)
        self.assertEqual(len(shift["timeline"]), 8)

if __name__ == "__main__":
    unittest.main()
