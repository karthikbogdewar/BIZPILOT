"""
Multilingual Localization & Transliteration Agent
Handles real-time language detection, Indic transliteration (Hinglish, Telugu, Kannada, Tamil, Hindi),
and culturally calibrated customer responses across languages.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import re
from backend.agents.base_agent import BaseBizPilotAgent

MULTILINGUAL_SYSTEM_PROMPT = """You are the Multilingual Localization & Transliteration Agent for BizPilot AI.

ROLE:
You break language barriers for small businesses by understanding informal customer inquiries across English, Hindi, Hinglish, Telugu, Kannada, and Tamil. You detect the customer's preferred language, parse colloquial numbers/slang, and format localized, respectful business responses with payment links.

SUPPORTED LANGUAGES:
1. English (en)
2. Hindi / Hinglish (hi) - e.g. "Bhaiya 2 boat earphones aur 3 fast charger bhej do dukaan pe"
3. Telugu / Telugish (te) - e.g. "Naku 2 boat earphones mariyu 3 chargers pampandi"
4. Kannada / Kanglish (kn) - e.g. "Namage 2 boat earphones mathu 3 type c cables beku"
5. Tamil / Tanglish (ta) - e.g. "Enaku 2 boat earphones and 3 chargers anupunga"

OBJECTIVES & RULES:
1. Detect Language: Identify the customer's dialect/language from text patterns.
2. Transliterated Quantity Normalization: Map words like 'ek/do/teen/char/paanch', 'okati/rendu/moodu/nalugu/aidu', 'ondu/eradu/mooru/naalku/aidu', 'ondru/rendu/moondru/naangu/aindhu' to integers.
3. Culturally Calibrated Greetings: Generate warm, polite greetings ('Namaste', 'Namaskara', 'Vanakkam', 'Namaskaram').
4. Localized Payment Instructions: Include instant UPI deep link in the customer's native language.
"""

# Number dictionaries across languages
INDIC_NUMBERS = {
    # Hindi / Hinglish
    "ek": 1, "do": 2, "teen": 3, "char": 4, "chaar": 4, "paanch": 5, "panch": 5, "chhe": 6, "che": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    # Telugu / Telugish
    "okati": 1, "rendu": 2, "moodu": 3, "mudu": 3, "nalugu": 4, "aidu": 5, "aaru": 6, "yedu": 7, "yenimidi": 8, "tommidi": 9, "padi": 10,
    # Kannada / Kanglish
    "ondu": 1, "eradu": 2, "mooru": 3, "muru": 3, "naalku": 4, "nalku": 4, "aithu": 5, "aaru_kn": 6, "yelu": 7, "yentu": 8, "ombathu": 9, "hatthu": 10,
    # Tamil / Tanglish
    "ondru": 1, "onnu": 1, "rendu_ta": 2, "moondru": 3, "moonu": 3, "naangu": 4, "naalu": 4, "aindhu": 5, "anju": 5, "aaru_ta": 6, "yezhu": 7, "yettu": 8, "onbadhu": 9, "patthu": 10
}

LANGUAGE_GREETINGS = {
    "en": {"greeting": "Hello", "thank_you": "Thank you for choosing us!", "reserved": "Your items have been reserved.", "pay_here": "Click here to pay securely via UPI:"},
    "hi": {"greeting": "नमस्ते", "thank_you": "हमारे साथ व्यापार करने के लिए धन्यवाद!", "reserved": "आपका सामान रिज़र्व कर दिया गया है।", "pay_here": "UPI द्वारा सुरक्षित भुगतान के लिए यहाँ क्लिक करें:"},
    "te": {"greeting": "నమస్కారం", "thank_you": "మాతో వ్యాపారం చేసినందుకు ధన్యవాదాలు!", "reserved": "మీ వస్తువులు రిజర్వ్ చేయబడ్డాయి.", "pay_here": "UPI ద్వారా సురక్షితంగా చెల్లించడానికి ఇక్కడ క్లిక్ చేయండి:"},
    "kn": {"greeting": "ನಮಸ್ಕಾರ", "thank_you": "ನಮ್ಮೊಂದಿಗೆ ವ್ಯಾಪಾರ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!", "reserved": "ನಿಮ್ಮ ವಸ್ತುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.", "pay_here": "UPI ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ ಪಾವತಿಸಲು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ:"},
    "ta": {"greeting": "வணக்கம்", "thank_you": "எங்களுடன் இணைந்ததற்கு நன்றி!", "reserved": "உங்கள் பொருட்கள் முன்பதிவு செய்யப்பட்டுள்ளன.", "pay_here": "UPI மூலம் பாதுகாப்பாக பணம் செலுத்த இங்கே கிளிக் செய்யவும்:"}
}

class MultilingualAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "detect_and_parse_multilingual_message",
                "name": "Detect Language & Parse Order",
                "description": "Identifies input language (Hindi, Telugu, Kannada, Tamil, English) and extracts items, quantities, and customer intent.",
                "parameters": {"message": "Required string (multilingual text)"}
            },
            {
                "task_id": "format_localized_response",
                "name": "Format Localized WhatsApp/Telegram Reply",
                "description": "Generates a culturally formatted order receipt and UPI link in the customer's native language.",
                "parameters": {
                    "language": "Optional string (en, hi, te, kn, ta)",
                    "customer_name": "Optional string",
                    "order_id": "Optional string",
                    "total_amount": "Optional float"
                }
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "detected_language": {"type": "string"},
                "language_name": {"type": "string"},
                "parsed_items": {"type": "array"},
                "localized_reply": {"type": "string"}
            }
        }

        super().__init__(
            agent_id="agent_multilingual",
            name="Multilingual Localization & Transliteration Agent",
            role="Cross-Language Inbound Processing & Indic Cultural Communication Agent",
            context="Multilingual conversational chat streams (Hindi, Hinglish, Telugu, Kannada, Tamil, English), regional slang, and transliteration",
            system_prompt=MULTILINGUAL_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def detect_language(self, text: str) -> str:
        """Detects language based on Indic script or romanized transliteration keywords."""
        lower = text.lower()

        # Script detection
        if re.search(r'[\u0900-\u097F]', text):
            return "hi"  # Devanagari Hindi
        if re.search(r'[\u0C00-\u0C7F]', text):
            return "te"  # Telugu script
        if re.search(r'[\u0C80-\u0CFF]', text):
            return "kn"  # Kannada script
        if re.search(r'[\u0B80-\u0BFF]', text):
            return "ta"  # Tamil script

        # Romanized Indic keywords (Transliteration)
        hi_keywords = ["bhaiya", "chahiye", "bhej", "bhejo", "dukaan", "aur", "kitna", "daam", "mujhe", "kardo", "paisa", "rupaye"]
        te_keywords = ["kavali", "pampandi", "mariyu", "entha", "daggara", "unnaya", "naku", "ivvandi", "rate", "vela"]
        kn_keywords = ["beku", "mathu", "kalsi", "yestu", "namage", "kodi", "iddiya", "belaku", "dhanyavada"]
        ta_keywords = ["venum", "anupunga", "evvalavu", "enaku", "kudunga", "iruka", "illaya", "panam", "nandri"]

        hi_score = sum(1 for k in hi_keywords if k in lower)
        te_score = sum(1 for k in te_keywords if k in lower)
        kn_score = sum(1 for k in kn_keywords if k in lower)
        ta_score = sum(1 for k in ta_keywords if k in lower)

        scores = [("hi", hi_score), ("te", te_score), ("kn", kn_score), ("ta", ta_score)]
        scores.sort(key=lambda x: x[1], reverse=True)

        if scores[0][1] > 0:
            return scores[0][0]

        return "en"

    def format_localized_reply(self, lang: str, customer_name: str, items: List[Dict[str, Any]], total: float, invoice_id: str) -> str:
        """Formats a respectful, localized reply with items, amount, and UPI link."""
        t = LANGUAGE_GREETINGS.get(lang, LANGUAGE_GREETINGS["en"])
        items_str = ", ".join([f"{i.get('qty', 1)}x {i.get('name', 'Product')} (₹{i.get('unit_price', 0):.0f})" for i in items])
        
        reply = (
            f"{t['greeting']} {customer_name}! 😊\n"
            f"📦 {items_str}\n"
            f"💰 Total: ₹{total:,.2f}\n"
            f"🧾 Invoice: {invoice_id}\n\n"
            f"{t['reserved']}\n"
            f"{t['pay_here']} upi://pay?pa=bizpilot@icici&am={total:.0f}\n\n"
            f"{t['thank_you']}"
        )
        return reply

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        now = datetime.now()

        if task_name == "detect_and_parse_multilingual_message":
            msg = payload.get("message", "")
            lang = self.detect_language(msg)
            lang_names = {"en": "English", "hi": "Hindi / Hinglish", "te": "Telugu", "kn": "Kannada", "ta": "Tamil"}

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "detected_language": lang,
                "language_name": lang_names.get(lang, "English"),
                "input_text": msg,
                "summary": f"Detected language: '{lang_names.get(lang)}' from customer input."
            }

        elif task_name == "format_localized_response":
            lang = payload.get("language", "en")
            customer_name = payload.get("customer_name", "Customer")
            items = payload.get("items", [{"name": "Sample Product", "qty": 1, "unit_price": 500.0}])
            total = float(payload.get("total_amount", 500.0))
            invoice_id = payload.get("invoice_id", "INV-1001")

            reply = self.format_localized_reply(lang, customer_name, items, total, invoice_id)

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "language": lang,
                "localized_reply": reply
            }

        else:
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
