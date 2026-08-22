"""
BizPilot AI - Wow & Winning Features Unit Tests
Tests:
1. Voice Query API (Speech-to-Text & localized TTS synthesis)
2. What-If Digital Twin Simulator (Festive demand surges & resilience score)
3. Simulated UPI Instant Payment Reconciliation (Auto-marks Paid, creates audit log)
"""

import sys
import os
import unittest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import init_db, get_db_connection
from backend.main import (
    ai_voice_query,
    simulate_what_if_scenario,
    simulate_invoice_payment,
    VoiceQueryRequest,
    WhatIfSimulationRequest
)

class TestWowFeatures(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db(force_reset=True)

    def test_01_voice_query_endpoint(self):
        """Verify Voice Query processing with Telugu and Hindi."""
        # Telugu Voice query
        req_te = VoiceQueryRequest(transcript="Naku 2 chargers kavali", language="te")
        res_te = ai_voice_query(req_te)
        self.assertEqual(res_te.get("detected_language"), "te")
        self.assertTrue(len(res_te.get("voice_script", "")) > 5)

        # Hindi Voice query
        req_hi = VoiceQueryRequest(transcript="Dukaan pe kitna stock bacha hai", language="hi")
        res_hi = ai_voice_query(req_hi)
        self.assertEqual(res_hi.get("detected_language"), "hi")

    def test_02_what_if_digital_twin_simulator(self):
        """Verify What-If festive demand surge simulation."""
        req_sim = WhatIfSimulationRequest(
            demand_multiplier=3.0, # Diwali +200% surge
            lead_time_added_days=4,
            collection_delay_days=10
        )
        data = simulate_what_if_scenario(req_sim)
        summary = data.get("summary", {})
        self.assertIn("resilience_score", summary)
        self.assertIn("critical_stockout_skus", summary)
        self.assertIn("projected_cash_runway_days", summary)
        self.assertGreater(len(data.get("skus", [])), 0)

    def test_03_upi_payment_reconciliation(self):
        """Verify 1-click instant UPI payment simulation."""
        conn = get_db_connection()
        inv = conn.cursor().execute("SELECT id FROM invoices WHERE status != 'Paid' LIMIT 1").fetchone()
        conn.close()
        
        if inv:
            inv_id = inv[0]
            data = simulate_invoice_payment(inv_id)
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("status"), "Paid")

            # Verify DB updated
            conn = get_db_connection()
            updated = conn.cursor().execute("SELECT status FROM invoices WHERE id = ?", (inv_id,)).fetchone()
            conn.close()
            self.assertEqual(updated[0], "Paid")

    def test_04_accurate_product_matching_and_inquiry(self):
        """Verify 'i need phone' matches phone/mobile and unstocked items do not create fake headphone orders."""
        from backend.agents.sales_agent import SalesAgent
        sales = SalesAgent()

        # 1. 'i need 1 phone' -> should match Redmi Note 13 5G Smartphone
        res_phone = sales.execute_task("parse_and_fulfill_message", {
            "message": "i need 1 phone",
            "customer_name": "Ravi Teja"
        })
        self.assertEqual(res_phone.get("status"), "COMPLETED")
        items = res_phone.get("items_parsed", [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["product_id"], "PRD-107") # Redmi 5G Phone!

        # 2. 'i want pizza' -> unstocked product, should NOT create order or headphones!
        res_unstocked = sales.execute_task("parse_and_fulfill_message", {
            "message": "i want 2 pizza",
            "customer_name": "John Doe"
        })
        self.assertEqual(res_unstocked.get("status"), "INQUIRY_REPLIED")
        self.assertFalse(res_unstocked.get("order_created"))
        self.assertEqual(len(res_unstocked.get("items_parsed", [])), 0)
        self.assertIn("Sri Lakshmi Electronics", res_unstocked.get("drafted_reply", ""))

    def test_05_khata_reminders_and_ledger(self):
        """Verify Customer Khata ledger calculation and multi-tone reminder dispatch."""
        from backend.main import get_khata_ledger, send_khata_reminder, KhataReminderRequest
        
        # Test ledger
        ledger_res = get_khata_ledger()
        summary = ledger_res.get("summary", {})
        self.assertIn("total_khata_outstanding", summary)
        self.assertGreater(len(ledger_res.get("ledger", [])), 0)

        # Test reminder in Telugu with Urgent tone
        req_te = KhataReminderRequest(
            invoice_id="INV-1002",
            tone="urgent",
            language="te",
            channel="telegram"
        )
        res_te = send_khata_reminder(req_te)
        self.assertEqual(res_te.get("status"), "COMPLETED")
        self.assertIn("అత్యవసర", res_te.get("formatted_reminder_message", ""))
        self.assertIn("upi://pay", res_te.get("formatted_reminder_message", ""))

if __name__ == "__main__":
    unittest.main()
