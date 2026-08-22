"""
BizPilot AI - Messaging Connectors Unit Tests
Tests Telegram and WhatsApp service simulation and webhook handling.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.connectors.telegram_service import telegram_service
from backend.connectors.whatsapp_service import whatsapp_service
from backend.database import init_db

class TestConnectors(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db(force_reset=True)

    def test_01_telegram_service_unconfigured_fallback(self):
        """Verify telegram service handles missing token gracefully."""
        res = telegram_service.send_message("123456", "Test message")
        self.assertFalse(res["success"])
        self.assertIn("TELEGRAM_BOT_TOKEN", res["error"])

    def test_02_whatsapp_service_simulation(self):
        """Verify whatsapp service handles simulation mode gracefully."""
        res = whatsapp_service.send_text_message("919876543210", "Hello customer!")
        self.assertTrue(res["success"])
        self.assertTrue(res.get("simulated", False) or "result" in res)

    def test_03_whatsapp_webhook_verification(self):
        """Verify Meta webhook challenge verification."""
        challenge = whatsapp_service.verify_webhook("subscribe", "bizpilot_secret_verify_2026", "115599")
        self.assertEqual(challenge, "115599")

        # Invalid token fails
        invalid = whatsapp_service.verify_webhook("subscribe", "wrong_token", "115599")
        self.assertIsNone(invalid)

    def test_04_telegram_incoming_message_flow(self):
        """Verify telegram incoming message passes through Sales Agent."""
        mock_update = {
            "message": {
                "chat": {"id": 998877},
                "from": {"first_name": "Karthik", "last_name": "User"},
                "text": "I need 2 chargers and 3 cables"
            }
        }
        res = telegram_service.process_webhook_update(mock_update)
        self.assertEqual(res["status"], "order_processed")
        self.assertIn("details", res)
        self.assertTrue(res["details"]["total_amount"] > 0)

    def test_05_whatsapp_incoming_webhook_flow(self):
        """Verify WhatsApp incoming webhook passes through Sales Agent."""
        mock_webhook = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "919845012345",
                            "type": "text",
                            "text": {"body": "Need 5 boat earphones and 2 chargers"}
                        }],
                        "contacts": [{
                            "profile": {"name": "Priya Sharma"}
                        }]
                    }
                }]
            }]
        }
        res = whatsapp_service.process_incoming_webhook(mock_webhook)
        self.assertEqual(res["status"], "processed")
        self.assertIn("order_id", res)

if __name__ == "__main__":
    unittest.main()
