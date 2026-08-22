"""
BizPilot AI - Telegram Bot Connector & Live Alert Service
Handles:
1. Instant Owner Approval Push Alerts with Interactive Inline Buttons (Approve / Reject)
2. Customer conversational sales & ordering via Telegram
3. Background polling / webhook processing
"""

import os
import json
import logging
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger("telegram_service")

class TelegramService:
    def __init__(self):
        self.last_update_id = 0
        self._poller_thread = None
        self._is_polling = False
        self.reload_config()

    def reload_config(self):
        # Load from .env if present
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line and not line.startswith("#"):
                        k, v = line.strip().split("=", 1)
                        if k.strip() == "TELEGRAM_BOT_TOKEN" and v.strip():
                            os.environ["TELEGRAM_BOT_TOKEN"] = v.strip()
                        elif k.strip() == "TELEGRAM_OWNER_CHAT_ID" and v.strip():
                            os.environ["TELEGRAM_OWNER_CHAT_ID"] = v.strip()

        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.owner_chat_id = os.getenv("TELEGRAM_OWNER_CHAT_ID", "").strip()
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    def is_configured(self) -> bool:
        self.reload_config()
        return bool(self.bot_token and len(self.bot_token) > 10)

    def get_updates(self, offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Fetches pending updates from Telegram API."""
        if not self.is_configured():
            return []
        url = f"{self.base_url}/getUpdates"
        current_offset = offset if offset is not None else (self.last_update_id + 1 if self.last_update_id > 0 else None)
        if current_offset:
            url += f"?offset={current_offset}&timeout=5"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "BizPilotAI/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))
                return data.get("result", [])
        except Exception as e:
            logger.error(f"Error fetching Telegram updates: {e}")
            return []

    def poll_updates_once(self) -> List[Dict[str, Any]]:
        """Processes all pending updates once, advancing the update_id offset."""
        updates = self.get_updates()
        processed = []
        for u in updates:
            u_id = u.get("update_id", 0)
            if u_id > self.last_update_id:
                self.last_update_id = u_id
            res = self.process_webhook_update(u)
            processed.append({"update_id": u_id, "result": res})
        return processed

    def start_background_poller(self, interval_seconds: float = 1.5):
        """Starts a background daemon thread that polls for Telegram messages continuously."""
        import threading
        import time

        if self._is_polling:
            return

        self._is_polling = True

        def _poll_loop():
            logger.info("Telegram background poller started.")
            while self._is_polling:
                try:
                    if self.is_configured():
                        self.poll_updates_once()
                except Exception as e:
                    logger.error(f"Error in Telegram poller loop: {e}")
                time.sleep(interval_seconds)

        self._poller_thread = threading.Thread(target=_poll_loop, daemon=True)
        self._poller_thread.start()

    def stop_background_poller(self):
        self._is_polling = False

    def send_message(self, chat_id: str, text: str, reply_markup: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Sends a message to any Telegram chat."""
        if not self.is_configured():
            return {"success": False, "error": "TELEGRAM_BOT_TOKEN not configured in .env"}

        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        if reply_markup:
            payload["reply_markup"] = json.dumps(reply_markup)

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return {"success": True, "result": res_data}
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return {"success": False, "error": str(e)}

    def send_owner_approval_alert(self, title: str, description: str, amount: float, approval_id: str, reference_id: str) -> Dict[str, Any]:
        """
        Sends an instant interactive approval card to the business owner's Telegram with inline buttons.
        """
        if not self.owner_chat_id:
            chat_id = os.getenv("TELEGRAM_OWNER_CHAT_ID", "").strip()
        else:
            chat_id = self.owner_chat_id

        if not chat_id:
            return {"success": False, "error": "TELEGRAM_OWNER_CHAT_ID not configured"}

        text = (
            f"🚨 <b>BizPilot AI - Action Required</b>\n\n"
            f"<b>{title}</b>\n"
            f"<i>{description}</i>\n\n"
            f"💰 <b>Amount:</b> ₹{amount:,.2f}\n"
            f"🆔 <b>Ref:</b> {reference_id} (Approval: <code>{approval_id}</code>)\n"
            f"⏰ <i>Tap an option below to authorize:</i>"
        )

        inline_keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅ Approve Action", "callback_data": f"approve:{approval_id}"},
                    {"text": "❌ Reject", "callback_data": f"reject:{approval_id}"}
                ]
            ]
        }

        return self.send_message(chat_id=chat_id, text=text, reply_markup=inline_keyboard)

    def process_webhook_update(self, update: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes incoming Telegram updates (messages or inline callback button clicks).
        """
        from backend.agents.orchestrator import agent_orchestrator
        from backend.agent_engine import agent_service

        # 1. Handle Inline Button Clicks (Callback Queries)
        if "callback_query" in update:
            cb = update["callback_query"]
            data = cb.get("data", "")
            msg = cb.get("message", {})
            chat_id = msg.get("chat", {}).get("id")
            cb_id = cb.get("id")

            if data.startswith("approve:"):
                app_id = data.split(":", 1)[1]
                res = agent_service.approve_action(app_id)
                reply_text = f"✅ Approval <b>{app_id}</b> has been AUTHORIZED by Business Owner."
                self.send_message(chat_id=str(chat_id), text=reply_text)
                return {"status": "approved", "approval_id": app_id}

            elif data.startswith("reject:"):
                app_id = data.split(":", 1)[1]
                res = agent_service.reject_action(app_id, reason="Rejected via Telegram Bot")
                reply_text = f"❌ Approval <b>{app_id}</b> was REJECTED via Telegram."
                self.send_message(chat_id=str(chat_id), text=reply_text)
                return {"status": "rejected", "approval_id": app_id}

        # 2. Handle Inbound Customer Messages
        elif "message" in update:
            msg = update["message"]
            text = msg.get("text", "")
            chat_id = str(msg.get("chat", {}).get("id", ""))
            user = msg.get("from", {})
            user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Telegram User"

            if text.startswith("/start"):
                welcome = (
                    f"👋 Hello {user_name}! Welcome to <b>BizPilot AI Store Assistant</b>.\n\n"
                    f"You can type your order in natural language (e.g. <i>'I need 2 chargers and 3 earphones'</i>), "
                    f"and I will check live stock and prepare your invoice instantly."
                )
                self.send_message(chat_id, welcome)
                return {"status": "welcome_sent"}

            # Process order via Sales Agent
            res = agent_orchestrator.execute_agent_task(
                agent_id="agent_sales",
                task_name="parse_and_fulfill_message",
                payload={"message": text, "customer_name": user_name, "channel": "Telegram"}
            )

            if res.get("success"):
                draft = res["result"].get("drafted_reply", "Order received!")
                self.send_message(chat_id, draft)
                return {"status": "order_processed", "details": res["result"]}
            else:
                self.send_message(chat_id, "Sorry, I had trouble processing your order. Our team will contact you shortly.")
                return {"status": "error"}

        return {"status": "ignored"}

telegram_service = TelegramService()
