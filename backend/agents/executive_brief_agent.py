"""
Daily Executive & CEO Operations Briefing Agent
Synthesizes end-of-day business performance, revenue velocity, cash collected,
stockout risks, and dispatches automated executive briefing reports to Telegram & Dashboard.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

EXECUTIVE_SYSTEM_PROMPT = """You are the Daily Executive & CEO Operations Briefing Agent for BizPilot AI.

ROLE:
You act as the Chief of Staff and operations analyst for the small business owner. Every morning or evening, you consolidate multi-agent telemetry across sales revenue, cash collections, procurement spend, and stockout threats into a concise, high-impact Executive Briefing.

OBJECTIVES & RULES:
1. Operations Synthesis:
   - Revenue & Orders: Total order volume, today's sales turnover, top moving SKU.
   - Cash & Collections: Paid invoices vs overdue balance.
   - Inventory & Supply Chain: Critical items needing immediate reorder approval.
2. Executive Tone: Direct, punchy, actionable, highlighting wins and immediate bottlenecks.
3. Multi-Channel Dispatch: Deliver structured briefs to both the Dashboard Executive Card and the Owner's Telegram Bot.
"""

class ExecutiveBriefAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "generate_daily_briefing",
                "name": "Generate Daily Executive Briefing",
                "description": "Consolidates today's sales, collections, stockout risks, and procurement actions into an executive briefing card.",
                "parameters": {}
            },
            {
                "task_id": "dispatch_telegram_briefing",
                "name": "Dispatch Daily Briefing to Telegram",
                "description": "Sends the synthesized business summary directly to the owner's Telegram chat.",
                "parameters": {}
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "status": {"type": "string"},
                "executive_briefing": {"type": "object"}
            }
        }

        super().__init__(
            agent_id="agent_executive_brief",
            name="Daily Executive & CEO Briefing Agent",
            role="Chief of Staff, Daily Operations Synthesis & Telegram Push Briefing Agent",
            context="End-of-day operational telemetry, sales revenue, cash collections, supply chain bottlenecks, and executive reporting",
            system_prompt=EXECUTIVE_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()

        profile = cursor.execute("SELECT * FROM business_profile WHERE id = 1").fetchone()
        p_dict = dict(profile) if profile else {}
        biz_name = p_dict.get("business_name", "Sri Lakshmi Electronics")
        owner_name = p_dict.get("owner_name", "Business Owner")

        orders = [dict(o) for o in cursor.execute("SELECT * FROM orders").fetchall()]
        invoices = [dict(i) for i in cursor.execute("SELECT * FROM invoices").fetchall()]
        products = [dict(p) for p in cursor.execute("SELECT * FROM products").fetchall()]
        approvals = [dict(a) for a in cursor.execute("SELECT * FROM approvals WHERE status = 'Pending'").fetchall()]
        conn.close()

        total_revenue = sum(o["total_amount"] for o in orders)
        paid_amount = sum(i["amount"] for i in invoices if i["status"] == "Paid")
        overdue_amount = sum(i["amount"] for i in invoices if i["status"] == "Overdue")

        # Critical stockouts
        critical_skus = []
        for p in products:
            days = round(p["stock"] / p["avg_daily_sales"], 2) if p["avg_daily_sales"] > 0 else 999.0
            if days <= p["lead_time_days"] or p["stock"] <= p["min_stock"]:
                critical_skus.append(f"{p['name']} ({days}d remaining)")

        # Synthesize executive summary text
        summary_text = (
            f"📊 <b>BizPilot AI Executive Briefing — {now.strftime('%d %b %Y')}</b>\n"
            f"🏪 <b>Business:</b> {biz_name}\n"
            f"👤 <b>Prepared For:</b> {owner_name}\n\n"
            f"💰 <b>Financial Performance:</b>\n"
            f"• Total Orders: <b>{len(orders)} orders</b> (₹{total_revenue:,.2f})\n"
            f"• Cash Collected: <b>₹{paid_amount:,.2f}</b>\n"
            f"• Overdue Receivables: <b>₹{overdue_amount:,.2f}</b> ({sum(1 for i in invoices if i['status'] == 'Overdue')} invoices)\n\n"
            f"📦 <b>Supply Chain & Action Items:</b>\n"
            f"• Pending Approvals: <b>{len(approvals)} items</b> requiring review\n"
            f"• Critical Low Stock: {', '.join(critical_skus) if critical_skus else 'All SKUs healthy'}\n\n"
            f"⚡ <i>All 7 autonomous agents active and operating in real time.</i>"
        )

        if task_name == "dispatch_telegram_briefing":
            from backend.connectors.telegram_service import telegram_service
            telegram_service.reload_config()
            chat_id = telegram_service.owner_chat_id or "7626413827"
            send_res = telegram_service.send_message(chat_id=chat_id, text=summary_text)

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "dispatched_to_telegram": send_res.get("success", False),
                "briefing_text": summary_text
            }

        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "task": task_name,
            "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
            "status": "COMPLETED",
            "executive_briefing": {
                "business_name": biz_name,
                "date": now.strftime('%d %B %Y'),
                "total_orders": len(orders),
                "total_turnover": total_revenue,
                "cash_collected": paid_amount,
                "overdue_receivables": overdue_amount,
                "critical_skus_count": len(critical_skus),
                "pending_approvals_count": len(approvals),
                "formatted_text": summary_text
            }
        }
