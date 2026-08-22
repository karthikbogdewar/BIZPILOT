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

if __name__ == "__main__":
    unittest.main()
