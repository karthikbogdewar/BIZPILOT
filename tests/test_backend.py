import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import init_db, get_db_connection
from backend.agent_engine import agent_service

def run_tests():
    print("Testing 1: Database Initialization & Seeding...")
    init_db(force_reset=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    prod_count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    supplier_count = cursor.execute("SELECT COUNT(*) FROM suppliers").fetchone()[0]
    conn.close()
    assert prod_count >= 6, f"Expected at least 6 products, got {prod_count}"
    assert supplier_count >= 4, f"Expected at least 4 suppliers, got {supplier_count}"
    print(f"[PASS] DB initialized with {prod_count} products and {supplier_count} suppliers.")

    print("\nTesting 2: Inventory Stockout Risk Forecasting...")
    risks = agent_service.analyze_inventory_risks()
    boat_risk = next((r for r in risks if r['id'] == 'PRD-101'), None)
    assert boat_risk is not None, "Boat BassHeads Earphones should be flagged as stockout risk!"
    assert boat_risk['days_remaining'] == 1.33, f"Expected 1.33 days remaining, got {boat_risk['days_remaining']}"
    print(f"[PASS] Correctly predicted stockout: {boat_risk['name']} ({boat_risk['days_remaining']} days remaining < {boat_risk['lead_time_days']} days lead).")

    print("\nTesting 3: Multi-Supplier Comparative Evaluation...")
    comp = agent_service.compare_suppliers_for_product('PRD-101')
    assert comp is not None
    assert comp['best_supplier']['id'] == 'SUP-001', f"Expected ABC Electronics (SUP-001) to be chosen, got {comp['best_supplier']['id']}"
    assert comp['recommended_qty'] == 20 or comp['recommended_qty'] >= 10
    print(f"[PASS] Supplier algorithm selected: {comp['best_supplier']['name']} (Est Cost: Rs. {comp['estimated_cost']}).")

    print("\nTesting 4: Natural Language WhatsApp Order Ingestion...")
    msg = "I need 2 65W chargers and 3 type c cables"
    res = agent_service.parse_and_process_customer_message(msg, customer_name="Rohan Sharma")
    assert res['success'] is True, f"Order parsing failed: {res}"
    assert len(res['items']) == 2, f"Expected 2 parsed items, got {len(res['items'])}"
    print(f"[PASS] Auto-processed customer message into order {res['order_id']} for Rs. {res['total_amount']}.")

    print("\nTesting 5: Human-in-the-Loop Approvals...")
    pending = agent_service.get_dashboard_data()['priority']['needs_approval']
    assert len(pending) > 0, "Expected at least 1 pending approval"
    app_id = pending[0]['id']
    app_res = agent_service.approve_action(app_id)
    assert app_res['success'] is True
    print(f"[PASS] Owner approved action {app_id} -> status updated to Approved.")

    print("\nTesting 6: AI Command Center Grounded Query...")
    ans = agent_service.answer_command_query("Which products are at risk?")
    assert "Boat BassHeads Earphones" in ans or "PRD-101" in ans
    print(f"[PASS] AI Command Center response verified.")

    print("\n>>> ALL BACKEND UNIT & LOGIC TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()
