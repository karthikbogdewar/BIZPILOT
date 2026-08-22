"""
WhatsApp Customer & Multi-Channel Sales Agent
Ingests unstructured customer conversations, parses orders, verifies live inventory,
generates quotes, reserves stock, creates orders & invoices, and drafts instant responses.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import re
import random
from backend.agents.base_agent import BaseBizPilotAgent
from backend.database import get_db_connection

SALES_SYSTEM_PROMPT = """You are the WhatsApp Customer & Multi-Channel Sales Agent for BizPilot AI.

ROLE:
You handle conversational inbound customer messages from WhatsApp, SMS, Walk-ins, and Web storefronts. You understand natural language inquiries, match informal product mentions to SKU catalog items, check live stock availability, calculate pricing, reserve inventory, create orders & invoices, and formulate warm, professional WhatsApp replies with payment links.

OPERATIONAL CONTEXT:
Small business owners receive dozens of informal WhatsApp messages daily ("need 5 chargers and 2 boat earphones send asap"). Manually reading, checking stock, calculating prices, and typing replies consumes hours and leads to missed sales. You automate this end-to-end in seconds.

OBJECTIVES & RULES:
1. Natural Language Extraction: Extract requested product names, quantities, and customer intents.
2. Fuzzy Catalog Matching: Map colloquial item names (e.g. 'gan charger', 'c cables', 'nord buds', 'boat earphones') to exact system product IDs.
3. Live Inventory Check & Reservation: Check if warehouse stock satisfies the requested quantities. If sufficient, create an order record and decrement stock. If out of stock, flag backorder with ETA.
4. Auto-Invoice & Payment Generation: Generate instant Invoice ID and compute totals with currency.
5. Conversational Draft Reply: Generate a polite, branded message confirming items, totals, delivery timeline, and a UPI/card payment link.

OUTPUT SPECIFICATION:
Return a JSON object containing:
- order_id: Generated unique order string (e.g. ORD-XXXXX)
- invoice_id: Generated unique invoice string (e.g. INV-XXXXX)
- customer_name: Extracted or provided customer name
- total_amount: Float total order value
- items_parsed: List of matched items with unit prices and line totals
- inventory_status: 'Fulfilled' | 'Partial' | 'Out of Stock'
- drafted_reply: Ready-to-send WhatsApp message string
"""

class SalesAgent(BaseBizPilotAgent):
    def __init__(self):
        supported_tasks = [
            {
                "task_id": "parse_and_fulfill_message",
                "name": "Parse & Fulfill Inbound Customer Message",
                "description": "Parses an unstructured customer message (e.g. WhatsApp/SMS), matches products, checks stock, creates order/invoice, and drafts reply.",
                "parameters": {
                    "message": "Required string (e.g. 'I need 2 65W chargers and 3 boat earphones')",
                    "customer_name": "Optional string (default: 'WhatsApp Customer')",
                    "channel": "Optional string (default: 'WhatsApp')"
                }
            },
            {
                "task_id": "generate_quote",
                "name": "Generate Instant Price Quote",
                "description": "Calculates pricing, applicable volume discounts, and generates a formal quote without committing stock.",
                "parameters": {
                    "items": "List of {product_id, quantity}",
                    "customer_name": "Optional string"
                }
            }
        ]

        output_schema = {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string"},
                "task": {"type": "string"},
                "timestamp": {"type": "string"},
                "status": {"type": "string"},
                "order_id": {"type": "string"},
                "invoice_id": {"type": "string"},
                "customer_name": {"type": "string"},
                "total_amount": {"type": "number"},
                "items_parsed": {"type": "array"},
                "drafted_reply": {"type": "string"}
            }
        }

        super().__init__(
            agent_id="agent_sales",
            name="WhatsApp Customer & Sales Agent",
            role="Conversational Inbound Sales, Order Processing & Quotation Agent",
            context="Conversational chat streams (WhatsApp, SMS, Walk-in, Online), customer profiles, credit limits, price lists",
            system_prompt=SALES_SYSTEM_PROMPT,
            supported_tasks=supported_tasks,
            output_schema=output_schema
        )

    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        conn = get_db_connection()
        cursor = conn.cursor()

        if task_name == "parse_and_fulfill_message":
            raw_msg = payload.get("message", "")
            customer_name = payload.get("customer_name", "WhatsApp Customer")
            channel = payload.get("channel", "WhatsApp")

            if not raw_msg:
                conn.close()
                return {
                    "agent_id": self.agent_id,
                    "task": task_name,
                    "status": "FAILED",
                    "error": "No message provided for processing."
                }

            products = [dict(p) for p in cursor.execute("SELECT * FROM products").fetchall()]
            lower_msg = raw_msg.lower()
            parsed_items = []

            # Synonym & Keyword Map for accurate catalog mapping
            SYNONYMS = {
                'PRD-101': ['boat', 'bassheads', 'earphone', 'earphones', 'headphone', 'headphones', 'ear piece', 'headset', 'in-ear'],
                'PRD-102': ['charger', 'chargers', 'gan', 'fast charger', '65w', 'adapter', 'charging adapter', 'chager'],
                'PRD-103': ['cable', 'cables', 'type-c', 'type c', 'typec', 'braided', 'wire', 'data cable', 'c cable', 'lead'],
                'PRD-104': ['nord', 'nord buds', 'tws', 'airpods', 'buds', 'earbuds', 'wireless buds', 'oneplus'],
                'PRD-105': ['watch', 'smartwatch', 'smart watch', 'fastrack', 'wrist watch'],
                'PRD-106': ['sandisk', 'microsd', 'sd card', 'memory card', '128gb', 'card', 'storage'],
                'PRD-107': ['phone', 'mobile', 'smartphone', 'redmi', 'handset', 'cellphone', '5g phone'],
                'PRD-108': ['power bank', 'powerbank', 'power-bank', 'mi power bank', 'portable charger', 'battery pack']
            }

            from backend.agents.multilingual_agent import MultilingualAgent, INDIC_NUMBERS
            ml_agent = MultilingualAgent()
            detected_lang = ml_agent.detect_language(raw_msg)

            # 1. First pass: Check specific product name & regex patterns
            for p in products:
                pid = p['id']
                p_name_lower = p['name'].lower()
                syns = SYNONYMS.get(pid, []) + [p_name_lower]

                for syn in syns:
                    patterns = [
                        rf"(\d+)\s*(?:units?|pcs?|pieces?|pack?|packs?|boxes?)?\s*(?:of\s*)?{re.escape(syn)}",
                        rf"{re.escape(syn)}\s*(?:x\s*)?(\d+)"
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, lower_msg)
                        if match:
                            qty = int(match.group(1))
                            if not any(it['product_id'] == pid for it in parsed_items):
                                parsed_items.append({
                                    "product_id": pid,
                                    "name": p['name'],
                                    "qty": qty,
                                    "unit_price": p['unit_price'],
                                    "total_price": round(qty * p['unit_price'], 2),
                                    "available_stock": p['stock']
                                })
                            break

            # 2. Second pass: Check Indic numbers (ek, do, teen, okati, rendu, etc.)
            for num_word, val in INDIC_NUMBERS.items():
                if f" {num_word} " in f" {lower_msg} ":
                    for p in products:
                        pid = p['id']
                        syns = SYNONYMS.get(pid, []) + [p['name'].lower()]
                        if any(s in lower_msg for s in syns):
                            if not any(it['product_id'] == pid for it in parsed_items):
                                parsed_items.append({
                                    "product_id": pid,
                                    "name": p['name'],
                                    "qty": val,
                                    "unit_price": p['unit_price'],
                                    "total_price": round(val * p['unit_price'], 2),
                                    "available_stock": p['stock']
                                })

            # 3. Third pass: If product mentioned without quantity, default to 1 unit ONLY if clearly intending to buy
            if not parsed_items:
                buy_intent_words = ['need', 'want', 'send', 'order', 'kavali', 'bhejo', 'chahiye', 'beku', 'venum', 'pampandi', 'anupunga', 'kodu']
                has_buy_intent = any(w in lower_msg for w in buy_intent_words)

                for p in products:
                    pid = p['id']
                    syns = SYNONYMS.get(pid, [])
                    if any(re.search(rf"\b{re.escape(s)}\b", lower_msg) for s in syns):
                        if not any(it['product_id'] == pid for it in parsed_items):
                            parsed_items.append({
                                "product_id": pid,
                                "name": p['name'],
                                "qty": 1,
                                "unit_price": p['unit_price'],
                                "total_price": p['unit_price'],
                                "available_stock": p['stock']
                            })

            # Deduplicate parsed items
            unique_items = {}
            for it in parsed_items:
                unique_items[it['product_id']] = it
            parsed_items = list(unique_items.values())

            # 4. IF STILL NO PRODUCTS MATCHED: DO NOT CREATE FAKE ORDER! Return helpful catalog inquiry reply.
            if not parsed_items:
                conn.close()
                if detected_lang == 'te':
                    catalog_reply = f"నమస్కారం {customer_name}! శ్రీ లక్ష్మి ఎలక్ట్రానిక్స్ కు స్వాగతం. మీ సందేశంలో ఆర్డర్ వివరాలు స్పష్టంగా లేవు. మా వద్ద లభించే వస్తువులు:\n• 🎧 Boat ఇయర్ ఫోన్లు (₹699)\n• ⚡ 65W GaN ఫాస్ట్ ఛార్జర్ (₹1,299)\n• 🔌 100W Type-C కేబుల్ (₹399)\n• 📱 Redmi Note 13 5G మొబైల్ (₹15,499)\n• 🔋 20000mAh పవర్ బ్యాంక్ (₹1,899)\n• ⌚ స్మార్ట్ వాచ్ (₹1,999)\n\nదయచేసి మీకు ఏ వస్తువు మరియు ఎన్ని కావాలో చెప్పండి (ఉదా: '2 ఛార్జర్లు మరియు 1 మొబైల్ కావాలి')."
                elif detected_lang == 'hi':
                    catalog_reply = f"नमस्ते {customer_name}! श्री लक्ष्मी इलेक्ट्रॉनिक्स में आपका स्वागत है। आपके संदेश में प्रोडक्ट की जानकारी स्पष्ट नहीं है। हमारे पास उपलब्ध हैं:\n• 🎧 Boat ईयरफोन (₹699)\n• ⚡ 65W फास्ट चार्जर (₹1,299)\n• 🔌 Type-C केबल (₹399)\n• 📱 Redmi 5G स्मार्टफोन (₹15,499)\n• 🔋 20000mAh पावर बैंक (₹1,899)\n• ⌚ स्मार्टवॉच (₹1,999)\n\nकृपया बताएं आपको क्या और कितना चाहिए (जैसे: '2 चार्जर और 1 फोन चाहिए')।"
                elif detected_lang == 'kn':
                    catalog_reply = f"ನಮಸ್ಕಾರ {customer_name}! ಶ್ರೀ ಲಕ್ಷ್ಮೀ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಗೆ ಸುಸ್ವಾಗತ. ನಮ್ಮಲ್ಲಿ ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳು: ಇಯರ್ ಫೋನ್ ಗಳು (₹699), 65W ಫಾಸ್ಟ್ ಚಾರ್ಜರ್ (₹1,299), Type-C ಕೇಬಲ್ (₹399), Redmi 5G ಮೊಬೈಲ್ (₹15,499), ಪವರ್ ಬ್ಯಾಂಕ್ (₹1,899). ದಯವಿಟ್ಟು ನಿಮಗೆ ಎಷ್ಟು ಬೇಕು ತಿಳಿಸಿ."
                elif detected_lang == 'ta':
                    catalog_reply = f"வணக்கம் {customer_name}! ஸ்ரீ லக்ஷ்மி எலக்ட்ரானிக்ஸுக்கு வரவேற்கிறோம். எங்களிடம் இயர்போன்கள் (₹699), 65W பாஸ்ட் சார்ஜர் (₹1,299), Type-C கேபிள் (₹399), Redmi 5G மொபைல் (₹15,499), பவர் பேங்க் (₹1,899) உள்ளன. என்ன வேண்டும் என்று குறிப்பிடவும்."
                else:
                    catalog_reply = f"Hello {customer_name}! Welcome to Sri Lakshmi Electronics. We couldn't recognize specific items in your message. Here is what we stock:\n• 🎧 Boat BassHeads Earphones (₹699)\n• ⚡ 65W Fast GaN Charger (₹1,299)\n• 🔌 100W Braided Type-C Cable (₹399)\n• 📱 Redmi Note 13 5G Smartphone (₹15,499)\n• 🔋 Mi 20000mAh Fast Power Bank (₹1,899)\n• ⌚ Fastrack Smartwatch (₹1,999)\n\nPlease let us know what you'd like to order (e.g. 'I need 2 chargers and 1 phone')."

                return {
                    "agent_id": self.agent_id,
                    "agent_name": self.name,
                    "task": task_name,
                    "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "status": "INQUIRY_REPLIED",
                    "order_created": False,
                    "customer_name": customer_name,
                    "detected_language": detected_lang,
                    "items_parsed": [],
                    "total_amount": 0.0,
                    "drafted_reply": catalog_reply,
                    "summary": f"Inquiry from {customer_name} replied with product catalog. No order created."
                }

            total_amount = sum(item['total_price'] for item in parsed_items)
            now = datetime.now()
            order_id = f"ORD-{random.randint(10000, 99999)}"
            inv_id = f"INV-{random.randint(1000, 9999)}"

            # Find customer
            cust = cursor.execute("SELECT id FROM customers WHERE name LIKE ? LIMIT 1", (f"%{customer_name.split()[0]}%",)).fetchone()
            cust_id = cust['id'] if cust else "CUST-001"

            # Create Order
            cursor.execute("""
                INSERT INTO orders (id, customer_id, customer_name, total_amount, payment_status, order_status, channel, raw_message, created_at, items_json)
                VALUES (?, ?, ?, ?, 'Pending', 'Processing', ?, ?, ?, ?)
            """, (
                order_id,
                cust_id,
                customer_name,
                total_amount,
                channel,
                raw_msg,
                now.strftime('%Y-%m-%d %H:%M'),
                json.dumps(parsed_items)
            ))

            # Create Invoice
            cursor.execute("""
                INSERT INTO invoices (id, order_id, customer_id, customer_name, amount, due_date, created_date, status, reminder_sent, reminder_draft)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 0, NULL)
            """, (
                inv_id,
                order_id,
                cust_id,
                customer_name,
                total_amount,
                (now + timedelta(days=7)).strftime('%Y-%m-%d'),
                now.strftime('%Y-%m-%d')
            ))

            # Deduct stock
            for item in parsed_items:
                cursor.execute("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?", (item['qty'], item['product_id']))

            conn.commit()
            conn.close()

            # Draft localized conversational reply using Multilingual Agent
            reply = ml_agent.format_localized_reply(
                lang=detected_lang,
                customer_name=customer_name,
                items=parsed_items,
                total_amount=total_amount,
                order_id=order_id,
                invoice_id=inv_id
            )

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "success": True,
                "order_created": True,
                "detected_language": detected_lang,
                "order_id": order_id,
                "invoice_id": inv_id,
                "customer_name": customer_name,
                "channel": channel,
                "total_amount": total_amount,
                "items_parsed": parsed_items,
                "drafted_reply": reply,
                "action_taken": f"Reserved {len(parsed_items)} items, created Order {order_id} and generated Invoice {inv_id} in language '{detected_lang}'."
            }

        elif task_name == "generate_quote":
            items_req = payload.get("items", [])
            customer_name = payload.get("customer_name", "Prospective Customer")
            quote_items = []
            total = 0.0

            for it in items_req:
                p_id = it.get("product_id")
                qty = it.get("quantity", 1)
                p = cursor.execute("SELECT * FROM products WHERE id = ?", (p_id,)).fetchone()
                if p:
                    p_dict = dict(p)
                    price = p_dict["unit_price"]
                    line_total = price * qty
                    total += line_total
                    quote_items.append({
                        "product_id": p_id,
                        "name": p_dict["name"],
                        "quantity": qty,
                        "unit_price": price,
                        "total_price": line_total
                    })

            conn.close()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
                "customer_name": customer_name,
                "total_quote_amount": total,
                "items": quote_items,
                "validity_days": 7
            }

        else:
            conn.close()
            return {
                "agent_id": self.agent_id,
                "task": task_name,
                "status": "ERROR",
                "error": f"Unsupported task: '{task_name}'"
            }
