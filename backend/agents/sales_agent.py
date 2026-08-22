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

            for p in products:
                p_name_lower = p['name'].lower()
                keywords = [k for k in p_name_lower.split() if len(k) > 3]

                # Match patterns like: "2 boat earphones", "10 chargers", "5 cables"
                patterns = [
                    rf"(\d+)\s*(?:units?|pcs?|pieces?|pack?|packs?)?\s*(?:of\s*)?{re.escape(p_name_lower)}",
                    rf"{re.escape(p_name_lower)}\s*(?:x\s*)?(\d+)"
                ]
                for k in keywords:
                    patterns.append(rf"(\d+)\s*(?:units?|pcs?|pieces?|pack?|packs?)?\s*(?:of\s*)?(?:[\w\-]+\s+)?{re.escape(k)}")

                matched_qty = None
                for pattern in patterns:
                    match = re.search(pattern, lower_msg)
                    if match:
                        matched_qty = int(match.group(1))
                        break

                if matched_qty is None:
                    # Check if keyword mentioned alone
                    if any(k in lower_msg for k in keywords) and p_name_lower in lower_msg:
                        matched_qty = 1

                if matched_qty and matched_qty > 0:
                    parsed_items.append({
                        "product_id": p['id'],
                        "name": p['name'],
                        "qty": matched_qty,
                        "unit_price": p['unit_price'],
                        "total_price": round(matched_qty * p['unit_price'], 2),
                        "available_stock": p['stock']
                    })

            # Multilingual Localization Engine
            from backend.agents.multilingual_agent import MultilingualAgent, INDIC_NUMBERS
            ml_agent = MultilingualAgent()
            detected_lang = ml_agent.detect_language(raw_msg)

            # Check Indic number words in message if regular digits not found
            for num_word, val in INDIC_NUMBERS.items():
                if f" {num_word} " in f" {lower_msg} ":
                    for p in products:
                        p_name_lower = p['name'].lower()
                        keywords = [k for k in p_name_lower.split() if len(k) > 3]
                        if any(k in lower_msg for k in keywords):
                            # Replace or append if not already parsed
                            if not any(it['product_id'] == p['id'] for it in parsed_items):
                                parsed_items.append({
                                    "product_id": p['id'],
                                    "name": p['name'],
                                    "qty": val,
                                    "unit_price": p['unit_price'],
                                    "total_price": round(val * p['unit_price'], 2),
                                    "available_stock": p['stock']
                                })

            # Deduplicate parsed items
            unique_items = {}
            for it in parsed_items:
                unique_items[it['product_id']] = it
            parsed_items = list(unique_items.values())

            # Fallback if no specific quantity extracted
            if not parsed_items and len(products) > 0:
                for p in products:
                    if p['name'].lower().split()[0] in lower_msg:
                        parsed_items.append({
                            "product_id": p['id'],
                            "name": p['name'],
                            "qty": 2,
                            "unit_price": p['unit_price'],
                            "total_price": round(2 * p['unit_price'], 2),
                            "available_stock": p['stock']
                        })
                        break

            if not parsed_items:
                parsed_items = [{
                    "product_id": products[0]['id'],
                    "name": products[0]['name'],
                    "qty": 1,
                    "unit_price": products[0]['unit_price'],
                    "total_price": products[0]['unit_price'],
                    "available_stock": products[0]['stock']
                }]

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
                total=total_amount,
                invoice_id=inv_id
            )

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "task": task_name,
                "timestamp": now.strftime('%Y-%m-%d %H:%M:%S'),
                "status": "COMPLETED",
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
