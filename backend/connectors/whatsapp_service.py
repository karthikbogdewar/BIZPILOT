"""
BizPilot AI - WhatsApp Business Cloud API & Webhook Connector
Handles:
1. Meta WhatsApp Webhook handshake verification
2. Incoming customer WhatsApp message ingestion & sales fulfillment
3. Dispatching official WhatsApp template and text replies
"""

import os
import json
import logging
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

logger = logging.getLogger("whatsapp_service")

class WhatsAppService:
    def __init__(self):
        self.api_token = os.getenv("WHATSAPP_API_TOKEN", "").strip()
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
        self.verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "bizpilot_secret_verify_2026").strip()
        self.api_version = "v18.0"

    def is_configured(self) -> bool:
        return bool(self.api_token and self.phone_number_id)

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """
        Handles Meta webhook verification GET request.
        """
        if mode == "subscribe" and token == self.verify_token:
            return challenge
        return None

    def send_text_message(self, to_phone: str, text: str) -> Dict[str, Any]:
        """
        Sends an outbound WhatsApp text message via Meta Cloud API.
        """
        if not self.is_configured():
            logger.info(f"[WHATSAPP SIMULATED] To: {to_phone} | Message: {text}")
            return {
                "success": True,
                "simulated": True,
                "note": "WHATSAPP_API_TOKEN not configured; logged message in simulation mode."
            }

        url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone.replace("+", "").replace(" ", "").replace("-", ""),
            "type": "text",
            "text": {"preview_url": True, "body": text}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return {"success": True, "result": res_data}
        except Exception as e:
            logger.error(f"WhatsApp API dispatch error: {e}")
            return {"success": False, "error": str(e)}

    def process_incoming_webhook(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses incoming WhatsApp webhook payload from Meta Graph API.
        """
        from backend.agents.orchestrator import agent_orchestrator

        try:
            entry = body.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            if not messages:
                return {"status": "no_messages"}

            msg = messages[0]
            from_phone = msg.get("from", "")
            msg_type = msg.get("type", "")

            if msg_type == "text":
                text_body = msg.get("text", {}).get("body", "")
                contacts = value.get("contacts", [{}])[0]
                customer_name = contacts.get("profile", {}).get("name", f"WhatsApp Customer (+{from_phone})")

                # Process via WhatsApp Sales Agent
                res = agent_orchestrator.execute_agent_task(
                    agent_id="agent_sales",
                    task_name="parse_and_fulfill_message",
                    payload={
                        "message": text_body,
                        "customer_name": customer_name,
                        "channel": "WhatsApp (Live API)"
                    }
                )

                if res.get("success"):
                    reply_text = res["result"].get("drafted_reply", "Order received!")
                    self.send_text_message(to_phone=from_phone, text=reply_text)
                    return {"status": "processed", "order_id": res["result"].get("order_id")}

            return {"status": "unsupported_message_type"}
        except Exception as e:
            logger.error(f"Error handling WhatsApp webhook: {e}")
            return {"status": "error", "error": str(e)}

whatsapp_service = WhatsAppService()
