import urllib.request
import json
import time
import subprocess
import sys
import os

def test_live_app():
    print("Testing End-to-End Live Application APIs...")
    # 1. Start uvicorn server in background subprocess
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    )

    try:
        # Give server 2 seconds to start
        time.sleep(2)

        # 2. Test GET /
        req = urllib.request.urlopen("http://127.0.0.1:8000/")
        assert req.status == 200, f"Expected 200, got {req.status}"
        html = req.read().decode('utf-8')
        assert "BizPilot AI" in html
        assert "Sri Lakshmi Electronics" in html
        print("[PASS] Static UI index.html loaded successfully.")

        # 3. Test GET /api/dashboard
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/dashboard")
        assert req.status == 200
        dash = json.loads(req.read().decode('utf-8'))
        assert "stats" in dash
        assert "priority" in dash
        assert len(dash["priority"]["urgent"]) > 0
        print(f"[PASS] /api/dashboard loaded with {dash['stats']['total_orders']} orders, {dash['stats']['low_stock_count']} low stock SKUs.")

        # 4. Test GET /api/products
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/products")
        products = json.loads(req.read().decode('utf-8'))
        assert len(products) >= 6
        boat = next((p for p in products if p['id'] == 'PRD-101'), None)
        assert boat is not None
        assert boat['days_remaining'] == 1.33
        print(f"[PASS] /api/products: Boat Earphones days_remaining = {boat['days_remaining']}.")

        # 5. Test POST /api/orders/simulate-message (Simulated WhatsApp Ingestion)
        post_data = json.dumps({
            "message": "Send 2 65W chargers and 3 Type-C cables",
            "customer_name": "Karthik Demo Customer",
            "channel": "WhatsApp"
        }).encode('utf-8')
        req = urllib.request.Request("http://127.0.0.1:8000/api/orders/simulate-message", data=post_data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req)
        order_res = json.loads(resp.read().decode('utf-8'))
        assert order_res['success'] is True
        print(f"[PASS] /api/orders/simulate-message: Auto-created order {order_res['order_id']} for Rs. {order_res['total_amount']}.")

        # 6. Test POST /api/agent/command (Grounded Q&A)
        cmd_data = json.dumps({"query": "Which products are at risk?"}).encode('utf-8')
        req = urllib.request.Request("http://127.0.0.1:8000/api/agent/command", data=cmd_data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req)
        cmd_res = json.loads(resp.read().decode('utf-8'))
        assert "Boat BassHeads Earphones" in cmd_res['answer'] or "PRD-101" in cmd_res['answer']
        print("[PASS] /api/agent/command: Natural language query answered from database.")

        # 7. Test POST /api/demo/hackathon-scenario
        req = urllib.request.Request("http://127.0.0.1:8000/api/demo/hackathon-scenario", data=b"{}", headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req)
        demo_res = json.loads(resp.read().decode('utf-8'))
        assert demo_res['success'] is True
        print("[PASS] /api/demo/hackathon-scenario executed successfully.")

        print("\n>>> ALL LIVE SERVER ENDPOINTS PASSED VERIFICATION! <<<")

    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    test_live_app()
