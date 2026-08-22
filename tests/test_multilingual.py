"""
BizPilot AI - Multilingual & Multi-Agent Swarm Integration Tests
Tests:
1. Language detection (Hindi, Hinglish, Telugu, Kannada, Tamil, English)
2. Transliterated numeral and product quantity extraction
3. Localized customer receipts and UPI payment links
4. GST Tax & HSN compliance agent
5. Executive CEO operations briefing agent
6. Orchestrator coordinating all 7 specialized agents
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.agents.multilingual_agent import MultilingualAgent
from backend.agents.gst_tax_agent import GstTaxAgent
from backend.agents.executive_brief_agent import ExecutiveBriefAgent
from backend.agents.orchestrator import agent_orchestrator
from backend.database import init_db

class TestMultilingualAndMultiAgent(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db(force_reset=True)

    def test_01_language_detection(self):
        """Test accuracy of Indic and English language detection."""
        agent = MultilingualAgent()
        
        # Hindi / Hinglish
        self.assertEqual(agent.detect_language("Bhaiya 2 boat earphones bhej do dukaan pe"), "hi")
        self.assertEqual(agent.detect_language("मुझे 2 चार्जर चाहिए"), "hi")
        
        # Telugu
        self.assertEqual(agent.detect_language("Naku 2 boat earphones mariyu 3 chargers pampandi"), "te")
        self.assertEqual(agent.detect_language("నాకు 2 ఇయర్‌ఫోన్లు కావాలి"), "te")
        
        # Kannada
        self.assertEqual(agent.detect_language("Namage 2 boat earphones mathu 3 type c cables beku"), "kn")
        self.assertEqual(agent.detect_language("ನಮಗೆ 2 ಚಾರ್ಜರ್ ಬೇಕು"), "kn")
        
        # Tamil
        self.assertEqual(agent.detect_language("Enaku 2 boat earphones and 3 chargers anupunga"), "ta")
        self.assertEqual(agent.detect_language("எனக்கு 2 இயர்போன்கள் வேண்டும்"), "ta")
        
        # English
        self.assertEqual(agent.detect_language("Please deliver 2 boat earphones to my store"), "en")

    def test_02_multilingual_order_parsing(self):
        """Test SalesAgent order creation with Indic language and transliterated number parsing."""
        res = agent_orchestrator.execute_agent_task(
            agent_id="agent_sales",
            task_name="parse_and_fulfill_message",
            payload={
                "message": "Bhaiya do boat earphones aur teen charger bhej do dukaan pe",
                "customer_name": "Rajesh Kumar",
                "channel": "WhatsApp"
            }
        )
        self.assertTrue(res.get("success"))
        result = res.get("result", {})
        self.assertEqual(result.get("detected_language"), "hi")
        self.assertGreater(result.get("total_amount", 0), 0)
        self.assertIn("नमस्ते", result.get("drafted_reply", ""))

    def test_03_gst_tax_compliance_agent(self):
        """Test GST breakdown and monthly summary."""
        tax_agent = GstTaxAgent()
        breakdown = tax_agent.execute_task("calculate_gst_invoice_breakdown", {"order_id": "ORD-501", "is_interstate": False})
        self.assertEqual(breakdown.get("status"), "COMPLETED")
        self.assertIn("summary", breakdown)
        self.assertIn("total_gst", breakdown["summary"])

        monthly = tax_agent.execute_task("generate_monthly_gst_summary")
        self.assertEqual(monthly.get("status"), "COMPLETED")
        self.assertIn("net_gst_payable_to_govt", monthly["gst_metrics"])

    def test_04_executive_briefing_agent(self):
        """Test executive CEO operations synthesis."""
        brief_agent = ExecutiveBriefAgent()
        brief = brief_agent.execute_task("generate_daily_briefing")
        self.assertEqual(brief.get("status"), "COMPLETED")
        self.assertIn("formatted_text", brief["executive_briefing"])
        self.assertIn("Sri Lakshmi Electronics", brief["executive_briefing"]["formatted_text"])

    def test_05_seven_agent_swarm_orchestration(self):
        """Test that all 7 agents are registered and participate in the swarm cycle."""
        agents = agent_orchestrator.list_agents()
        self.assertEqual(len(agents), 7)
        agent_ids = [a["agent_id"] for a in agents]
        self.assertIn("agent_inventory", agent_ids)
        self.assertIn("agent_sales", agent_ids)
        self.assertIn("agent_cashflow", agent_ids)
        self.assertIn("agent_procurement", agent_ids)
        self.assertIn("agent_multilingual", agent_ids)
        self.assertIn("agent_gst_tax", agent_ids)
        self.assertIn("agent_executive_brief", agent_ids)

        # Run synchronized swarm cycle
        swarm = agent_orchestrator.run_full_swarm_cycle()
        self.assertEqual(swarm.get("status"), "SUCCESS")
        self.assertEqual(swarm.get("agents_engaged"), 7)

if __name__ == '__main__':
    unittest.main()
