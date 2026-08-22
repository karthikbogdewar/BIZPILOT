import sqlite3
import json
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "bizpilot.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reset=False):
    if force_reset and os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS business_profile (
        id INTEGER PRIMARY KEY,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        currency TEXT DEFAULT '₹',
        auto_pilot_enabled INTEGER DEFAULT 1,
        auto_order_threshold REAL DEFAULT 5000.0,
        approval_required_above REAL DEFAULT 5000.0
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER NOT NULL,
        avg_daily_sales REAL NOT NULL,
        min_stock INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL,
        default_supplier_id TEXT,
        lead_time_days INTEGER NOT NULL,
        image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        city TEXT NOT NULL,
        reliability_score REAL NOT NULL,
        payment_terms TEXT NOT NULL,
        order_history_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS supplier_products (
        supplier_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        price REAL NOT NULL,
        lead_time_days INTEGER NOT NULL,
        moq INTEGER DEFAULT 5,
        PRIMARY KEY (supplier_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        city TEXT,
        credit_limit REAL DEFAULT 50000.0,
        total_purchases REAL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT NOT NULL, -- 'Paid', 'Pending', 'Overdue'
        order_status TEXT NOT NULL,   -- 'Completed', 'Processing', 'Pending Approval', 'Cancelled'
        channel TEXT NOT NULL,        -- 'WhatsApp', 'Walk-in', 'Online Store', 'Phone'
        raw_message TEXT,
        created_at TEXT NOT NULL,
        items_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        created_date TEXT NOT NULL,
        status TEXT NOT NULL,         -- 'Paid', 'Pending', 'Overdue'
        reminder_sent INTEGER DEFAULT 0,
        reminder_draft TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        supplier_id TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost REAL NOT NULL,
        total_cost REAL NOT NULL,
        estimated_delivery_days INTEGER NOT NULL,
        status TEXT NOT NULL,         -- 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Rejected'
        created_at TEXT NOT NULL,
        approved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,          -- 'Purchase Order', 'Payment Reminder', 'Price Override', 'Special Discount'
        priority TEXT NOT NULL,      -- 'High', 'Medium', 'Low'
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        amount REAL,
        reference_id TEXT,           -- PO id, Invoice id, etc.
        status TEXT NOT NULL,        -- 'Pending', 'Approved', 'Rejected'
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        time_display TEXT NOT NULL,
        category TEXT NOT NULL,      -- 'Inventory', 'Orders', 'Payments', 'Suppliers', 'Approvals', 'System'
        severity TEXT NOT NULL,      -- 'urgent', 'warning', 'success', 'info'
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        automated INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS agent_cognition (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        stage TEXT NOT NULL,         -- 'CAPTURE', 'UNDERSTAND', 'REMEMBER', 'ANALYZE', 'PLAN', 'EXECUTE', 'APPROVE', 'FOLLOW-UP'
        summary TEXT NOT NULL,
        details TEXT NOT NULL
    );
    """)

    conn.commit()

    # Check if database has products, if not seed demo data
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        seed_demo_data(conn)

    conn.close()

def seed_demo_data(conn):
    cursor = conn.cursor()

    # 1. Business Profile
    cursor.execute("""
    INSERT INTO business_profile (id, business_name, owner_name, category, city, currency, auto_pilot_enabled, auto_order_threshold, approval_required_above)
    VALUES (1, 'Sri Lakshmi Electronics', 'Karthik Sharma (Owner)', 'Consumer Electronics & Accessories', 'Bengaluru, India', '₹', 1, 5000.0, 5000.0)
    """)

    # 2. Suppliers
    suppliers = [
        ('SUP-001', 'ABC Electronics Distributors', 'Anand Kumar', '+91 98450 12345', 'anand@abcelectronics.in', 'Bengaluru', 96.5, 'Net 15', 38),
        ('SUP-002', 'Apex DigiTech Wholesale', 'Suresh Patel', '+91 98200 54321', 'sales@apexdigitech.com', 'Mumbai', 85.0, 'Net 30', 22),
        ('SUP-003', 'Sonic Sound & Cable Hub', 'Murali Nathan', '+91 94440 98765', 'orders@sonichub.in', 'Chennai', 90.5, 'Immediate / UPI', 15),
        ('SUP-004', 'Reliance Digital Trade Mart', 'Pooja Reddy', '+91 99000 11223', 'trade@reliancedigital.co', 'Hyderabad', 94.0, 'Net 7', 45)
    ]
    cursor.executemany("INSERT INTO suppliers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", suppliers)

    # 3. Products
    # Sri Lakshmi Electronics core hackathon scenario: Boat Earphones Stock: 8, Daily Sales: 6, Lead Time: 3 days => Days Remaining: 1.33 days!
    products = [
        ('PRD-101', 'Boat BassHeads Earphones', 'Audio', 8, 6.0, 20, 699.0, 425.0, 'SUP-001', 3, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150'),
        ('PRD-102', '65W Fast GaN Charger (Type-C)', 'Accessories', 28, 4.0, 15, 1299.0, 850.0, 'SUP-001', 2, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150'),
        ('PRD-103', '100W Braided Type-C Cable (1.5m)', 'Cables', 45, 7.5, 20, 399.0, 180.0, 'SUP-003', 2, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'),
        ('PRD-104', 'OnePlus Nord Buds 2 TWS', 'Audio', 4, 2.5, 10, 2499.0, 1750.0, 'SUP-002', 4, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150'),
        ('PRD-105', 'Fastrack Limitless Smartwatch', 'Wearables', 14, 2.0, 8, 1999.0, 1300.0, 'SUP-004', 3, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'),
        ('PRD-106', 'SanDisk 128GB High-Speed MicroSD', 'Storage', 36, 5.0, 15, 849.0, 520.0, 'SUP-004', 2, 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?w=150'),
        ('PRD-107', 'Redmi Note 13 5G Smartphone', 'Smartphones', 6, 1.5, 4, 15499.0, 13200.0, 'SUP-004', 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150'),
        ('PRD-108', 'Mi 20000mAh Fast Power Bank 3i', 'Accessories', 18, 3.0, 8, 1899.0, 1250.0, 'SUP-001', 2, 'https://images.unsplash.com/photo-1609592424368-809c951d38eb?w=150')
    ]
    cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", products)

    # 4. Supplier Products (Comparison Matrix)
    supplier_products = [
        # Boat Earphones comparison
        ('SUP-001', 'PRD-101', 425.0, 2, 10), # Best balance: Rs 425, 2 days, 96.5% reliability
        ('SUP-002', 'PRD-101', 410.0, 5, 20), # Cheapest but slow: 5 days lead (will stockout!), 85% reliability
        ('SUP-003', 'PRD-101', 450.0, 1, 5),  # Fastest 1 day, but Rs 450 (expensive)
        # Chargers
        ('SUP-001', 'PRD-102', 850.0, 2, 5),
        ('SUP-004', 'PRD-102', 870.0, 3, 5),
        # Cables
        ('SUP-003', 'PRD-103', 180.0, 2, 20),
        ('SUP-001', 'PRD-103', 195.0, 2, 10),
        # OnePlus Nord Buds
        ('SUP-002', 'PRD-104', 1750.0, 4, 5),
        ('SUP-001', 'PRD-104', 1820.0, 2, 5),
        # Smartwatch
        ('SUP-004', 'PRD-105', 1300.0, 3, 5),
        ('SUP-001', 'PRD-105', 1350.0, 2, 5),
        # MicroSD
        ('SUP-004', 'PRD-106', 520.0, 2, 10),
        ('SUP-003', 'PRD-106', 540.0, 1, 10)
    ]
    cursor.executemany("INSERT INTO supplier_products VALUES (?, ?, ?, ?, ?)", supplier_products)

    # 5. Customers
    customers = [
        ('CUST-001', 'Rahul Verma', 'Sharma Tech Solutions', '+91 98765 43210', 'rahul@sharmatech.in', 'Bengaluru', 50000.0, 48500.0),
        ('CUST-002', 'Priya Nair', 'Greenfield Cafe & Workhub', '+91 97654 32109', 'priya@greenfield.com', 'Bengaluru', 25000.0, 14200.0),
        ('CUST-003', 'Vikram Singh', 'Apex Digital Media', '+91 96543 21098', 'vikram@apexmedia.co', 'Mysuru', 60000.0, 89000.0),
        ('CUST-004', 'Rajesh Rao', 'Metro Retailers Pvt Ltd', '+91 95432 10987', 'rajesh@metroretail.in', 'Bengaluru', 40000.0, 32400.0),
        ('CUST-005', 'Sneha Patel', 'Self-Employed / Creator', '+91 94321 09876', 'sneha.p@gmail.com', 'Bengaluru', 15000.0, 9500.0)
    ]
    cursor.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?)", customers)

    # 6. Orders (10 columns)
    now = datetime.now()
    orders = [
        ('ORD-501', 'CUST-001', 'Rahul Verma', 12500.0, 'Overdue', 'Completed', 'WhatsApp', 'Hey Karthik, need 10 GaN fast chargers and 15 Type-C cables urgently.', (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-102", "name": "65W Fast GaN Charger", "qty": 8, "price": 1299.0}, {"product_id": "PRD-103", "name": "100W Braided Type-C Cable", "qty": 5, "price": 399.0}])),
        ('ORD-502', 'CUST-002', 'Priya Nair', 4800.0, 'Pending', 'Processing', 'WhatsApp', 'Need 2 Boat earphones and 3 SanDisk 128GB cards for our event staff.', (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-101", "name": "Boat BassHeads Earphones", "qty": 2, "price": 699.0}, {"product_id": "PRD-106", "name": "SanDisk 128GB MicroSD", "qty": 4, "price": 849.0}])),
        ('ORD-503', 'CUST-003', 'Vikram Singh', 18900.0, 'Paid', 'Completed', 'Online Store', 'Online store direct checkout', (now - timedelta(days=2)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-104", "name": "OnePlus Nord Buds 2 TWS", "qty": 6, "price": 2499.0}, {"product_id": "PRD-105", "name": "Fastrack Limitless Smartwatch", "qty": 2, "price": 1999.0}])),
        ('ORD-504', 'CUST-004', 'Rajesh Rao', 8200.0, 'Overdue', 'Completed', 'Phone Call', 'Phone order for replacement accessories', (now - timedelta(days=12)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-102", "name": "65W Fast GaN Charger", "qty": 5, "price": 1299.0}, {"product_id": "PRD-103", "name": "100W Braided Type-C Cable", "qty": 4, "price": 399.0}])),
        ('ORD-505', 'CUST-005', 'Sneha Patel', 3499.0, 'Paid', 'Completed', 'Walk-in', 'Walk-in customer sale', now.strftime('%Y-%m-%d 11:20'), json.dumps([{"product_id": "PRD-101", "name": "Boat BassHeads Earphones", "qty": 1, "price": 699.0}, {"product_id": "PRD-104", "name": "OnePlus Nord Buds 2 TWS", "qty": 1, "price": 2499.0}]))
    ]
    cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", orders)

    # 7. Invoices (10 columns)
    invoices = [
        ('INV-1024', 'ORD-501', 'CUST-001', 'Rahul Verma (Sharma Tech)', 12500.0, (now - timedelta(days=7)).strftime('%Y-%m-%d'), (now - timedelta(days=14)).strftime('%Y-%m-%d'), 'Overdue', 0, 'Dear Rahul, Invoice INV-1024 for ₹12,500 was due on ' + (now - timedelta(days=7)).strftime('%d %b') + ' (7 days overdue). Please settle at your earliest to maintain seamless ordering.'),
        ('INV-1025', 'ORD-502', 'CUST-002', 'Priya Nair (Greenfield Cafe)', 4800.0, (now + timedelta(days=2)).strftime('%Y-%m-%d'), (now - timedelta(days=1)).strftime('%Y-%m-%d'), 'Pending', 0, None),
        ('INV-1026', 'ORD-503', 'CUST-003', 'Vikram Singh (Apex Digital)', 18900.0, (now - timedelta(days=1)).strftime('%Y-%m-%d'), (now - timedelta(days=2)).strftime('%Y-%m-%d'), 'Paid', 0, None),
        ('INV-1027', 'ORD-504', 'CUST-004', 'Rajesh Rao (Metro Retailers)', 8200.0, (now - timedelta(days=12)).strftime('%Y-%m-%d'), (now - timedelta(days=20)).strftime('%Y-%m-%d'), 'Overdue', 0, 'Hi Rajesh, Gentle reminder that invoice INV-1027 for ₹8,200 is 12 days overdue. Kindly process via UPI/NEFT today.'),
        ('INV-1028', 'ORD-505', 'CUST-005', 'Sneha Patel', 3499.0, now.strftime('%Y-%m-%d'), now.strftime('%Y-%m-%d'), 'Paid', 0, None)
    ]
    cursor.executemany("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", invoices)

    # 8. Purchase Orders (12 columns)
    purchase_orders = [
        ('PO-901', 'PRD-101', 'Boat BassHeads Earphones', 'SUP-001', 'ABC Electronics Distributors', 20, 425.0, 8500.0, 2, 'Pending Approval', (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M'), None)
    ]
    cursor.executemany("INSERT INTO purchase_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", purchase_orders)

    # 9. Approvals Queue
    approvals = [
        (
            'APP-101',
            'Purchase Order',
            'High',
            'Stockout Imminent: Reorder Boat BassHeads Earphones',
            'Current stock is 8 units. Avg sales: 6.0/day. Stock remaining: 1.33 days. Supplier delivery is 2-3 days. Reordering 20 units is vital to prevent stockout.',
            'Recommended Supplier: ABC Electronics (₹425/unit, 2 days delivery, 96.5% reliability). Total cost: ₹8,500. Reject Apex DigiTech (₹410 but 5 days delivery would cause stockout).',
            8500.0,
            'PO-901',
            'Pending',
            json.dumps({
                "product_id": "PRD-101",
                "product_name": "Boat BassHeads Earphones",
                "supplier_id": "SUP-001",
                "supplier_name": "ABC Electronics Distributors",
                "quantity": 20,
                "unit_price": 425.0,
                "lead_time_days": 2,
                "days_stock_remaining": 1.33,
                "comparison": [
                    {"name": "ABC Electronics", "price": 425, "lead": "2 days", "reliability": "96.5%", "selected": True, "reason": "Fastest viable delivery before stockout"},
                    {"name": "Apex DigiTech", "price": 410, "lead": "5 days", "reliability": "85.0%", "selected": False, "reason": "Cheapest, but 5 days delivery guarantees stockout"},
                    {"name": "Sonic Distributors", "price": 450, "lead": "1 day", "reliability": "90.5%", "selected": False, "reason": "Higher unit cost (₹450)"}
                ]
            }),
            (now - timedelta(minutes=35)).strftime('%Y-%m-%d %H:%M'),
            None
        ),
        (
            'APP-102',
            'Payment Reminder',
            'Medium',
            'Send Overdue Reminder to Rahul Verma (₹12,500)',
            'Invoice INV-1024 is 7 days overdue. Automatic polite payment reminder drafted for WhatsApp/Email.',
            'Approve sending automated WhatsApp message with UPI payment link to Rahul Verma (+91 98765 43210).',
            12500.0,
            'INV-1024',
            'Pending',
            json.dumps({
                "invoice_id": "INV-1024",
                "customer_name": "Rahul Verma (Sharma Tech Solutions)",
                "amount": 12500.0,
                "days_overdue": 7,
                "phone": "+91 98765 43210",
                "message": "Dear Rahul, Invoice INV-1024 for ₹12,500 was due on " + (now - timedelta(days=7)).strftime('%d %b') + " (7 days overdue). Please click here to settle via UPI: upi://pay?pa=srilakshmi@icici&am=12500"
            }),
            (now - timedelta(minutes=25)).strftime('%Y-%m-%d %H:%M'),
            None
        )
    ]
    cursor.executemany("INSERT INTO approvals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", approvals)

    # 10. Activity Logs
    logs = [
        (None, (now - timedelta(minutes=55)).strftime('%Y-%m-%d %H:%M:%S'), '10:02 AM', 'Orders', 'info', 'New Customer Order Detected', 'Received WhatsApp inquiry from Sneha Patel for Boat Earphones and Nord Buds.', 1),
        (None, (now - timedelta(minutes=53)).strftime('%Y-%m-%d %H:%M:%S'), '10:03 AM', 'Inventory', 'success', 'Live Inventory Verification', 'Extracted 2 items from message. Checked live stock: Both available. Auto-reserved units.', 1),
        (None, (now - timedelta(minutes=50)).strftime('%Y-%m-%d %H:%M:%S'), '10:03 AM', 'Orders', 'success', 'Order Confirmed & Invoiced', 'Created Order ORD-505 (₹3,499) and generated Invoice INV-1028 automatically.', 1),
        (None, (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M:%S'), '10:04 AM', 'Inventory', 'urgent', 'Critical Stockout Risk Flagged', 'Boat BassHeads Earphones stock dropped to 8 units. With 6.0/day sales rate, stock will exhaust in 1.33 days!', 1),
        (None, (now - timedelta(minutes=40)).strftime('%Y-%m-%d %H:%M:%S'), '10:05 AM', 'Suppliers', 'info', 'Supplier Comparative Matrix Computed', 'Compared 3 approved suppliers for Boat Earphones. Selected ABC Electronics (₹425, 2 days, 96.5% score).', 1),
        (None, (now - timedelta(minutes=35)).strftime('%Y-%m-%d %H:%M:%S'), '10:05 AM', 'Approvals', 'warning', 'Reorder PO Prepared (₹8,500)', 'Drafted Purchase Order PO-901 for 20 units. Submitted to Owner Approval Queue (High Priority).', 1),
        (None, (now - timedelta(minutes=25)).strftime('%Y-%m-%d %H:%M:%S'), '10:06 AM', 'Payments', 'warning', 'Overdue Invoices Monitored', 'Identified 2 overdue invoices totalling ₹20,700. Drafted payment reminder for INV-1024.', 1)
    ]
    cursor.executemany("INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)", logs)

    # 11. Agent Cognition History
    cognition = [
        (None, (now - timedelta(minutes=46)).strftime('%Y-%m-%d %H:%M:%S'), 'CAPTURE', 'Ingested real-time inventory telemetry and sales velocity.', 'Scanned 6 active SKUs across warehouse and sales counter.'),
        (None, (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M:%S'), 'ANALYZE', 'Calculated Days-to-Stockout for all products.', 'Detected PRD-101 (Boat Earphones) stock=8, avg_sales=6.0/day => 1.33 days remaining. Supplier lead time is 2-3 days.'),
        (None, (now - timedelta(minutes=42)).strftime('%Y-%m-%d %H:%M:%S'), 'PLAN', 'Synthesized optimal replenishment plan.', 'Target reorder: 20 units to maintain 15-day safety buffer without over-allocating working capital.'),
        (None, (now - timedelta(minutes=40)).strftime('%Y-%m-%d %H:%M:%S'), 'EVALUATE', 'Evaluated multi-vendor trade-offs.', 'Ranked ABC Electronics #1 due to 2-day SLA which beats stockout threshold.'),
        (None, (now - timedelta(minutes=35)).strftime('%Y-%m-%d %H:%M:%S'), 'APPROVE', 'Awaiting Business Owner Authorization.', 'Prepared interactive approval card with cost projection and supplier matrix.')
    ]
    cursor.executemany("INSERT INTO agent_cognition VALUES (?, ?, ?, ?, ?)", cognition)

    conn.commit()
