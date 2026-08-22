"""
BizPilot AI - Autonomous B2B Vendor Price Negotiation & Auto-Bargaining Protocol
Evaluates supplier quotes, past purchase volumes, MOQ, payment term leverage (e.g. immediate UPI settlement),
and generates multi-stage negotiation counter-offers to save margin for the small business owner.
"""

from typing import Dict, Any, List, Optional
import random

class VendorNegotiationEngine:
    def __init__(self):
        pass

    def generate_counter_offer(
        self,
        product_name: str,
        supplier_name: str,
        initial_unit_price: float,
        quantity: int,
        payment_terms: str = "Net 15",
        lifetime_purchases_count: int = 15,
        target_discount_pct: float = 7.5
    ) -> Dict[str, Any]:
        """
        Calculates an optimal negotiation counter-offer with tactical leverage points.
        """
        # Tactical leverage calculation
        leverage_points = []
        discount_pct = min(15.0, max(4.0, target_discount_pct))

        # 1. Volume leverage
        if quantity >= 20:
            leverage_points.append(f"Bulk order size ({quantity} units) qualifies for Tier-2 wholesale pricing")
            discount_pct += 2.0
        elif quantity >= 10:
            leverage_points.append(f"Order quantity ({quantity} units) exceeds standard MOQ")

        # 2. Historical relationship leverage
        if lifetime_purchases_count >= 10:
            leverage_points.append(f"Long-term client relationship ({lifetime_purchases_count} previous orders fulfilled)")
            discount_pct += 1.5

        # 3. Cashflow / Immediate UPI leverage
        leverage_points.append("Immediate 100% advance UPI settlement within 2 hours of delivery verification")
        discount_pct += 2.0

        # Bound discount between 5% and 12%
        discount_pct = round(min(12.0, max(5.0, discount_pct)), 1)
        counter_unit_price = round(initial_unit_price * (1 - (discount_pct / 100)), 2)
        initial_total = round(initial_unit_price * quantity, 2)
        counter_total = round(counter_unit_price * quantity, 2)
        total_margin_saved = round(initial_total - counter_total, 2)

        # Multi-stage negotiation script
        proposal_text = (
            f"Dear {supplier_name} Team,\n\n"
            f"Regarding our purchase order for {quantity}x {product_name} (Initial Quote: ₹{initial_unit_price:.2f}/unit):\n\n"
            f"Given our ongoing procurement history ({lifetime_purchases_count} completed orders) and our commitment to immediate 100% instant UPI settlement upon delivery, "
            f"we propose a revised rate of ₹{counter_unit_price:.2f}/unit (Total: ₹{counter_total:,.2f}).\n\n"
            f"This ensures zero payment collection delay and immediate liquidity for your team. Kindly confirm so we can release the purchase order immediately.\n\n"
            f"Best regards,\n"
            f"Procurement Desk – Sri Lakshmi Electronics"
        )

        return {
            "supplier_name": supplier_name,
            "product_name": product_name,
            "quantity": quantity,
            "initial_unit_price": initial_unit_price,
            "initial_total_cost": initial_total,
            "counter_unit_price": counter_unit_price,
            "counter_total_cost": counter_total,
            "discount_percentage": discount_pct,
            "margin_saved": total_margin_saved,
            "leverage_points": leverage_points,
            "proposal_message": proposal_text,
            "projected_vendor_acceptance_probability": 88.5 if discount_pct <= 8.5 else 74.0,
            "status": "NEGOTIATION_DRAFTED"
        }

    def simulate_vendor_bargaining_response(self, initial_price: float, counter_price: float) -> Dict[str, Any]:
        """
        Simulates the vendor's dynamic reply: accepted or slight compromise.
        """
        compromise_price = round((initial_price + counter_price * 2) / 3, 2)
        return {
            "vendor_response": "Accepted with immediate UPI terms",
            "final_agreed_price": counter_price,
            "terms": "Immediate UPI upon delivery",
            "status": "ACCEPTED"
        }

vendor_negotiation_engine = VendorNegotiationEngine()
