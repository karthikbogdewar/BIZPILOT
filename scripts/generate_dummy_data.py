"""
BizPilot AI - Dummy Test Data Generator
Generates comprehensive, realistic test datasets for multiple business types,
including products, supplier matrices, customers, multi-channel orders,
overdue invoices, purchase orders, approvals, and agent cognitive logs.
"""

import sys
import os
import sqlite3
import json
import random
from datetime import datetime, timedelta

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import DB_PATH, get_db_connection, init_db

# -----------------------------------------------------------------------------
# Preset Business Datasets
# -----------------------------------------------------------------------------

BUSINESS_PRESETS = {
    "electronics": {
        "profile": {
            "business_name": "Sri Lakshmi Electronics & Mobiles",
            "owner_name": "Karthik Sharma",
            "category": "Consumer Electronics & Mobile Accessories",
            "city": "Bengaluru, India",
            "currency": "₹",
            "auto_pilot_enabled": 1,
            "auto_order_threshold": 5000.0,
            "approval_required_above": 5000.0
        },
        "suppliers": [
            ("SUP-001", "ABC Electronics Distributors", "Anand Kumar", "+91 98450 12345", "anand@abcelectronics.in", "Bengaluru", 96.5, "Net 15", 38),
            ("SUP-002", "Apex DigiTech Wholesale", "Suresh Patel", "+91 98200 54321", "sales@apexdigitech.com", "Mumbai", 85.0, "Net 30", 22),
            ("SUP-003", "Sonic Sound & Cable Hub", "Murali Nathan", "+91 94440 98765", "orders@sonichub.in", "Chennai", 90.5, "Immediate / UPI", 15),
            ("SUP-004", "Reliance Digital Trade Mart", "Pooja Reddy", "+91 99000 11223", "trade@reliancedigital.co", "Hyderabad", 94.0, "Net 7", 45),
            ("SUP-005", "Vardhaman Components & Parts", "Dinesh Jain", "+91 97654 11223", "vardhaman.trade@gmail.com", "Delhi", 91.0, "Net 15", 29)
        ],
        "products": [
            ("PRD-101", "Boat BassHeads Earphones", "Audio", 8, 6.0, 20, 699.0, 425.0, "SUP-001", 3, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"),
            ("PRD-102", "65W Fast GaN Charger (Type-C)", "Accessories", 28, 4.0, 15, 1299.0, 850.0, "SUP-001", 2, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200"),
            ("PRD-103", "100W Braided Type-C Cable (1.5m)", "Cables", 45, 7.5, 20, 399.0, 180.0, "SUP-003", 2, "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200"),
            ("PRD-104", "OnePlus Nord Buds 2 TWS", "Audio", 4, 2.5, 10, 2499.0, 1750.0, "SUP-002", 4, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200"),
            ("PRD-105", "Fastrack Limitless Smartwatch", "Wearables", 14, 2.0, 8, 1999.0, 1300.0, "SUP-004", 3, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"),
            ("PRD-106", "SanDisk 128GB High-Speed MicroSD", "Storage", 36, 5.0, 15, 849.0, 520.0, "SUP-004", 2, "https://images.unsplash.com/photo-1628191010210-a59de33e5941?w=200"),
            ("PRD-107", "Portronics 20000mAh Power Bank", "Power", 6, 3.2, 12, 1699.0, 1100.0, "SUP-001", 2, "https://images.unsplash.com/photo-1609592807903-bb114620f4c3?w=200"),
            ("PRD-108", "Tempered Glass Screen Guard (Universal)", "Protection", 110, 12.0, 30, 199.0, 45.0, "SUP-005", 2, "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=200"),
            ("PRD-109", "JBL Go 3 Portable Bluetooth Speaker", "Audio", 5, 1.8, 8, 2999.0, 2100.0, "SUP-003", 3, "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200"),
            ("PRD-110", "Spigen Rugged Armor Phone Case", "Cases", 19, 2.8, 10, 899.0, 520.0, "SUP-002", 3, "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200")
        ],
        "supplier_matrix": [
            ("SUP-001", "PRD-101", 425.0, 2, 10),
            ("SUP-002", "PRD-101", 410.0, 5, 20),
            ("SUP-003", "PRD-101", 450.0, 1, 5),
            ("SUP-001", "PRD-102", 850.0, 2, 5),
            ("SUP-004", "PRD-102", 870.0, 3, 5),
            ("SUP-003", "PRD-103", 180.0, 2, 20),
            ("SUP-001", "PRD-103", 195.0, 2, 10),
            ("SUP-002", "PRD-104", 1750.0, 4, 5),
            ("SUP-001", "PRD-104", 1820.0, 2, 5),
            ("SUP-004", "PRD-105", 1300.0, 3, 5),
            ("SUP-001", "PRD-105", 1350.0, 2, 5),
            ("SUP-004", "PRD-106", 520.0, 2, 10),
            ("SUP-003", "PRD-106", 540.0, 1, 10),
            ("SUP-001", "PRD-107", 1100.0, 2, 5),
            ("SUP-002", "PRD-107", 1080.0, 4, 10),
            ("SUP-005", "PRD-108", 45.0, 2, 50),
            ("SUP-001", "PRD-108", 52.0, 1, 20),
            ("SUP-003", "PRD-109", 2100.0, 3, 4),
            ("SUP-004", "PRD-109", 2150.0, 2, 4),
            ("SUP-002", "PRD-110", 520.0, 3, 10),
            ("SUP-005", "PRD-110", 540.0, 2, 10)
        ],
        "customers": [
            ("CUST-001", "Rahul Verma", "Sharma Tech Solutions", "+91 98765 43210", "rahul@sharmatech.in", "Bengaluru", 50000.0, 48500.0),
            ("CUST-002", "Priya Nair", "Greenfield Cafe & Workhub", "+91 97654 32109", "priya@greenfield.com", "Bengaluru", 25000.0, 14200.0),
            ("CUST-003", "Vikram Singh", "Apex Digital Media", "+91 96543 21098", "vikram@apexmedia.co", "Mysuru", 60000.0, 89000.0),
            ("CUST-004", "Rajesh Rao", "Metro Retailers Pvt Ltd", "+91 95432 10987", "rajesh@metroretail.in", "Bengaluru", 40000.0, 32400.0),
            ("CUST-005", "Sneha Patel", "Creator Studio", "+91 94321 09876", "sneha.p@gmail.com", "Bengaluru", 15000.0, 9500.0),
            ("CUST-006", "Amit Deshmukh", "Zenith Coworking Hub", "+91 93210 98765", "amit@zenithhub.in", "Bengaluru", 35000.0, 27600.0),
            ("CUST-007", "Kavita Menon", "Menon IT Consultancy", "+91 92109 87654", "kavita@menonit.com", "Kochi", 45000.0, 18900.0),
            ("CUST-008", "Deepak Joshi", "Speedy Logistics Hub", "+91 91098 76543", "deepak@speedylogistics.in", "Hubballi", 30000.0, 12400.0)
        ]
    },
    "cafe": {
        "profile": {
            "business_name": "Artisan Bean Specialty Roastery",
            "owner_name": "Ananya Roy",
            "category": "Specialty Coffee Roastery & Cafe",
            "city": "Bengaluru, India",
            "currency": "₹",
            "auto_pilot_enabled": 1,
            "auto_order_threshold": 8000.0,
            "approval_required_above": 8000.0
        },
        "suppliers": [
            ("SUP-C01", "Chikmagalur Plantation Estates", "Harish Gowda", "+91 98440 22334", "orders@chikmagalurcoffee.in", "Chikmagalur", 98.0, "Net 15", 42),
            ("SUP-C02", "OatPure Dairy & Alt-Milks", "Meera Kulkarni", "+91 98220 33445", "supply@oatpure.com", "Pune", 93.5, "Net 7", 28),
            ("SUP-C03", "SweetArt Syrups & Bakery Essentials", "Farhan Khan", "+91 99000 44556", "sales@sweetart.in", "Mumbai", 89.0, "Immediate / UPI", 19)
        ],
        "products": [
            ("PRD-C01", "Arabica Specialty Green Beans (50kg)", "Raw Beans", 2, 0.8, 4, 18500.0, 14200.0, "SUP-C01", 3, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200"),
            ("PRD-C02", "Barista Oat Milk (1L Pack of 12)", "Dairy & Milks", 14, 3.5, 10, 2400.0, 1750.0, "SUP-C02", 2, "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200"),
            ("PRD-C03", "Madagascar Vanilla Syrup (750ml)", "Syrups", 6, 1.2, 5, 850.0, 520.0, "SUP-C03", 2, "https://images.unsplash.com/photo-1587080413959-06b859fb107d?w=200")
        ],
        "supplier_matrix": [
            ("SUP-C01", "PRD-C01", 14200.0, 3, 2),
            ("SUP-C02", "PRD-C02", 1750.0, 2, 5),
            ("SUP-C03", "PRD-C03", 520.0, 2, 6)
        ],
        "customers": [
            ("CUST-C01", "The Brew Collective", "Koramangala Branch", "+91 98888 11111", "brew@collective.in", "Bengaluru", 80000.0, 65000.0),
            ("CUST-C02", "Urban Roots Bistro", "Indiranagar", "+91 97777 22222", "manager@urbanroots.in", "Bengaluru", 45000.0, 38000.0)
        ]
    }
}

def generate_dummy_database(industry: str = "electronics"):
    """Populates the database with rich test data matching the selected industry."""
    print(f"Generating Dummy Test Data for Industry: '{industry}'...")
    
    # Reset and clear all tables cleanly
    init_db(force_reset=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    tables = ["agent_cognition", "activity_logs", "approvals", "purchase_orders", "invoices", "orders", "customers", "supplier_products", "products", "suppliers", "business_profile"]
    for t in tables:
        cursor.execute(f"DELETE FROM {t}")

    preset = BUSINESS_PRESETS.get(industry, BUSINESS_PRESETS["electronics"])
    now = datetime.now()

    # 1. Business Profile
    p = preset["profile"]
    cursor.execute("""
    INSERT INTO business_profile (id, business_name, owner_name, category, city, currency, auto_pilot_enabled, auto_order_threshold, approval_required_above)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (p["business_name"], p["owner_name"], p["category"], p["city"], p["currency"], p["auto_pilot_enabled"], p["auto_order_threshold"], p["approval_required_above"]))

    # 2. Suppliers
    cursor.executemany("INSERT INTO suppliers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", preset["suppliers"])

    # 3. Products
    cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", preset["products"])

    # 4. Supplier Product Comparison Matrix
    cursor.executemany("INSERT INTO supplier_products VALUES (?, ?, ?, ?, ?)", preset["supplier_matrix"])

    # 5. Customers
    cursor.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?)", preset["customers"])

    # 6. Orders
    orders = [
        ('ORD-501', 'CUST-001', 'Rahul Verma', 12500.0, 'Overdue', 'Completed', 'WhatsApp', 'Hey Karthik, need 8 GaN fast chargers and 5 Type-C cables urgently.', (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-102", "name": "65W Fast GaN Charger", "qty": 8, "price": 1299.0}, {"product_id": "PRD-103", "name": "100W Braided Type-C Cable", "qty": 5, "price": 399.0}])),
        ('ORD-502', 'CUST-002', 'Priya Nair', 4800.0, 'Pending', 'Processing', 'WhatsApp', 'Need 2 Boat earphones and 4 SanDisk 128GB cards for our event staff.', (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-101", "name": "Boat BassHeads Earphones", "qty": 2, "price": 699.0}, {"product_id": "PRD-106", "name": "SanDisk 128GB MicroSD", "qty": 4, "price": 849.0}])),
        ('ORD-503', 'CUST-003', 'Vikram Singh', 18900.0, 'Paid', 'Completed', 'Online Store', 'Online store direct checkout', (now - timedelta(days=2)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-104", "name": "OnePlus Nord Buds 2 TWS", "qty": 6, "price": 2499.0}, {"product_id": "PRD-105", "name": "Fastrack Limitless Smartwatch", "qty": 2, "price": 1999.0}])),
        ('ORD-504', 'CUST-004', 'Rajesh Rao', 8200.0, 'Overdue', 'Completed', 'Phone Call', 'Phone order for replacement accessories', (now - timedelta(days=12)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-102", "name": "65W Fast GaN Charger", "qty": 5, "price": 1299.0}, {"product_id": "PRD-103", "name": "100W Braided Type-C Cable", "qty": 4, "price": 399.0}])),
        ('ORD-505', 'CUST-005', 'Sneha Patel', 3499.0, 'Paid', 'Completed', 'Walk-in', 'Walk-in customer sale', (now - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-101", "name": "Boat BassHeads Earphones", "qty": 1, "price": 699.0}, {"product_id": "PRD-104", "name": "OnePlus Nord Buds 2 TWS", "qty": 1, "price": 2499.0}])),
        ('ORD-506', 'CUST-006', 'Amit Deshmukh', 9495.0, 'Paid', 'Completed', 'WhatsApp', 'Please send 5 power banks for our conference tomorrow.', (now - timedelta(days=3)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-107", "name": "Portronics 20000mAh Power Bank", "qty": 5, "price": 1699.0}, {"product_id": "PRD-103", "name": "100W Braided Type-C Cable", "qty": 2, "price": 399.0}])),
        ('ORD-507', 'CUST-007', 'Kavita Menon', 15990.0, 'Pending', 'Processing', 'Online Store', 'Web store order for office peripherals', (now - timedelta(hours=8)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-109", "name": "JBL Go 3 Portable Speaker", "qty": 3, "price": 2999.0}, {"product_id": "PRD-105", "name": "Fastrack Limitless Smartwatch", "qty": 3, "price": 1999.0}, {"product_id": "PRD-108", "name": "Tempered Glass Screen Guard", "qty": 5, "price": 199.0}])),
        ('ORD-508', 'CUST-008', 'Deepak Joshi', 5690.0, 'Overdue', 'Completed', 'WhatsApp', 'Need 10 screen protectors and 2 fast chargers for dispatch drivers.', (now - timedelta(days=15)).strftime('%Y-%m-%d %H:%M'), json.dumps([{"product_id": "PRD-108", "name": "Tempered Glass Screen Guard", "qty": 10, "price": 199.0}, {"product_id": "PRD-102", "name": "65W Fast GaN Charger", "qty": 2, "price": 1299.0}, {"product_id": "PRD-110", "name": "Spigen Rugged Armor Phone Case", "qty": 1, "price": 899.0}]))
    ]
    cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", orders)

    # 7. Invoices
    invoices = [
        ('INV-1024', 'ORD-501', 'CUST-001', 'Rahul Verma (Sharma Tech Solutions)', 12500.0, (now - timedelta(days=7)).strftime('%Y-%m-%d'), (now - timedelta(days=14)).strftime('%Y-%m-%d'), 'Overdue', 0, 'Dear Rahul, Invoice INV-1024 for ₹12,500 was due on ' + (now - timedelta(days=7)).strftime('%d %b') + ' (7 days overdue). Please settle at your earliest: upi://pay?pa=srilakshmi@icici&am=12500'),
        ('INV-1025', 'ORD-502', 'CUST-002', 'Priya Nair (Greenfield Cafe)', 4800.0, (now + timedelta(days=2)).strftime('%Y-%m-%d'), (now - timedelta(days=1)).strftime('%Y-%m-%d'), 'Pending', 0, None),
        ('INV-1026', 'ORD-503', 'CUST-003', 'Vikram Singh (Apex Digital)', 18900.0, (now - timedelta(days=1)).strftime('%Y-%m-%d'), (now - timedelta(days=2)).strftime('%Y-%m-%d'), 'Paid', 0, None),
        ('INV-1027', 'ORD-504', 'CUST-004', 'Rajesh Rao (Metro Retailers)', 8200.0, (now - timedelta(days=12)).strftime('%Y-%m-%d'), (now - timedelta(days=20)).strftime('%Y-%m-%d'), 'Overdue', 0, 'Hi Rajesh, Gentle reminder that invoice INV-1027 for ₹8,200 is 12 days overdue. Kindly process payment via UPI or NEFT today.'),
        ('INV-1028', 'ORD-505', 'CUST-005', 'Sneha Patel', 3499.0, now.strftime('%Y-%m-%d'), now.strftime('%Y-%m-%d'), 'Paid', 0, None),
        ('INV-1029', 'ORD-506', 'CUST-006', 'Amit Deshmukh (Zenith Coworking)', 9495.0, (now - timedelta(days=2)).strftime('%Y-%m-%d'), (now - timedelta(days=3)).strftime('%Y-%m-%d'), 'Paid', 0, None),
        ('INV-1030', 'ORD-507', 'CUST-007', 'Kavita Menon (Menon IT)', 15990.0, (now + timedelta(days=5)).strftime('%Y-%m-%d'), now.strftime('%Y-%m-%d'), 'Pending', 0, None),
        ('INV-1031', 'ORD-508', 'CUST-008', 'Deepak Joshi (Speedy Logistics)', 5690.0, (now - timedelta(days=15)).strftime('%Y-%m-%d'), (now - timedelta(days=25)).strftime('%Y-%m-%d'), 'Overdue', 0, 'Dear Deepak, Invoice INV-1031 for ₹5,690 is 15 days overdue. Please settle immediately to avoid credit hold.')
    ]
    cursor.executemany("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", invoices)

    # 8. Purchase Orders
    purchase_orders = [
        ('PO-901', 'PRD-101', 'Boat BassHeads Earphones', 'SUP-001', 'ABC Electronics Distributors', 20, 425.0, 8500.0, 2, 'Pending Approval', (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M'), None),
        ('PO-902', 'PRD-104', 'OnePlus Nord Buds 2 TWS', 'SUP-001', 'ABC Electronics Distributors', 10, 1820.0, 18200.0, 2, 'Pending Approval', (now - timedelta(minutes=20)).strftime('%Y-%m-%d %H:%M'), None),
        ('PO-899', 'PRD-106', 'SanDisk 128GB High-Speed MicroSD', 'SUP-004', 'Reliance Digital Trade Mart', 30, 520.0, 15600.0, 2, 'Delivered', (now - timedelta(days=4)).strftime('%Y-%m-%d %H:%M'), (now - timedelta(days=4)).strftime('%Y-%m-%d %H:%M')),
        ('PO-900', 'PRD-108', 'Tempered Glass Screen Guard', 'SUP-005', 'Vardhaman Components', 100, 45.0, 4500.0, 2, 'Approved', (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M'), (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M'))
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
            'Recommended Supplier: ABC Electronics (₹425/unit, 2 days delivery, 96.5% reliability). Total cost: ₹8,500. Reject Apex DigiTech (₹410 but 5 days delivery guarantees stockout).',
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
        ),
        (
            'APP-103',
            'Purchase Order',
            'High',
            'Critical Stock Alert: Reorder OnePlus Nord Buds 2 TWS',
            'Stock is down to 4 units. Daily demand is 2.5/day. Exhaustion in 1.6 days. Lead time is 2 days.',
            'Recommended Supplier: ABC Electronics (₹1,820/unit, 2 days delivery, 96.5% score). Total cost: ₹18,200.',
            18200.0,
            'PO-902',
            'Pending',
            json.dumps({
                "product_id": "PRD-104",
                "product_name": "OnePlus Nord Buds 2 TWS",
                "supplier_id": "SUP-001",
                "supplier_name": "ABC Electronics Distributors",
                "quantity": 10,
                "unit_price": 1820.0,
                "lead_time_days": 2,
                "days_stock_remaining": 1.6,
                "comparison": [
                    {"name": "ABC Electronics", "price": 1820, "lead": "2 days", "reliability": "96.5%", "selected": True, "reason": "Fast 2-day delivery prevents stockout"},
                    {"name": "Apex DigiTech", "price": 1750, "lead": "4 days", "reliability": "85.0%", "selected": False, "reason": "4 days lead time will exhaust stock"}
                ]
            }),
            (now - timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M'),
            None
        ),
        (
            'APP-104',
            'Payment Reminder',
            'High',
            'Escalate Overdue Invoice to Deepak Joshi (₹5,690)',
            'Invoice INV-1031 is 15 days overdue. Customer credit limit warning triggered.',
            'Approve sending firm payment notice and placing account on temporary credit hold until clearance.',
            5690.0,
            'INV-1031',
            'Pending',
            json.dumps({
                "invoice_id": "INV-1031",
                "customer_name": "Deepak Joshi (Speedy Logistics)",
                "amount": 5690.0,
                "days_overdue": 15,
                "phone": "+91 91098 76543"
            }),
            (now - timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M'),
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
        (None, (now - timedelta(minutes=25)).strftime('%Y-%m-%d %H:%M:%S'), '10:06 AM', 'Payments', 'warning', 'Overdue Invoices Monitored', 'Identified 3 overdue invoices totalling ₹26,390. Drafted payment reminders.', 1),
        (None, (now - timedelta(minutes=18)).strftime('%Y-%m-%d %H:%M:%S'), '10:12 AM', 'Inventory', 'urgent', 'OnePlus Nord Buds 2 TWS Low Stock Alert', 'Stock is 4 units (1.6 days buffer). Automatic PO-902 drafted for ₹18,200.', 1),
        (None, (now - timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S'), '10:20 AM', 'System', 'success', 'Autonomous Operations Cycle Completed', 'All 10 SKUs, 8 active customer accounts, and 5 supplier channels verified.', 1)
    ]
    cursor.executemany("INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)", logs)

    # 11. Agent Cognition History
    cognition = [
        (None, (now - timedelta(minutes=46)).strftime('%Y-%m-%d %H:%M:%S'), 'CAPTURE', 'Ingested real-time inventory telemetry and sales velocity.', 'Scanned 10 active SKUs across warehouse and sales counter.'),
        (None, (now - timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M:%S'), 'ANALYZE', 'Calculated Days-to-Stockout for all products.', 'Detected PRD-101 (Boat Earphones) stock=8, avg_sales=6.0/day => 1.33 days remaining. Detected PRD-104 (Nord Buds) stock=4, avg_sales=2.5/day => 1.6 days remaining.'),
        (None, (now - timedelta(minutes=42)).strftime('%Y-%m-%d %H:%M:%S'), 'PLAN', 'Synthesized optimal replenishment plans.', 'Target reorders: 20 units PRD-101 and 10 units PRD-104 to maintain 15-day safety buffer without working capital strain.'),
        (None, (now - timedelta(minutes=40)).strftime('%Y-%m-%d %H:%M:%S'), 'EVALUATE', 'Evaluated multi-vendor trade-offs.', 'Ranked ABC Electronics #1 for both audio items due to 2-day SLA beating imminent stockouts.'),
        (None, (now - timedelta(minutes=35)).strftime('%Y-%m-%d %H:%M:%S'), 'APPROVE', 'Awaiting Business Owner Authorization.', 'Dispatched 4 interactive approval cards to Owner Dashboard (2 POs, 2 Payment Reminders).')
    ]
    cursor.executemany("INSERT INTO agent_cognition VALUES (?, ?, ?, ?, ?)", cognition)

    conn.commit()

    # Summary report
    prod_c = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    supp_c = cursor.execute("SELECT COUNT(*) FROM suppliers").fetchone()[0]
    cust_c = cursor.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    ord_c = cursor.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    inv_c = cursor.execute("SELECT COUNT(*) FROM invoices").fetchone()[0]
    app_c = cursor.execute("SELECT COUNT(*) FROM approvals").fetchone()[0]
    log_c = cursor.execute("SELECT COUNT(*) FROM activity_logs").fetchone()[0]

    conn.close()

    print(f"[SUCCESS] Dummy Test Data Created Successfully!")
    print(f"Summary:")
    print(f"   - Products: {prod_c} items (with live stockout forecasting)")
    print(f"   - Suppliers: {supp_c} suppliers with competitive pricing matrix")
    print(f"   - Customers: {cust_c} accounts")
    print(f"   - Orders: {ord_c} multi-channel orders (WhatsApp, Walk-in, Online, Phone)")
    print(f"   - Invoices: {inv_c} invoices (Paid, Pending, Overdue)")
    print(f"   - Approvals Queue: {app_c} action items (POs + Overdue reminders)")
    print(f"   - Activity Logs: {log_c} entries")

    # Export JSON fixture for test suites
    export_path = os.path.join(os.path.dirname(__file__), '..', 'tests', 'dummy_test_data.json')
    export_dummy_json(export_path)

def export_dummy_json(output_path: str):
    """Exports test data to a JSON fixture for frontend or standalone testing."""
    conn = get_db_connection()
    cursor = conn.cursor()

    data = {
        "business_profile": dict(cursor.execute("SELECT * FROM business_profile WHERE id = 1").fetchone() or {}),
        "products": [dict(r) for r in cursor.execute("SELECT * FROM products").fetchall()],
        "suppliers": [dict(r) for r in cursor.execute("SELECT * FROM suppliers").fetchall()],
        "supplier_products": [dict(r) for r in cursor.execute("SELECT * FROM supplier_products").fetchall()],
        "customers": [dict(r) for r in cursor.execute("SELECT * FROM customers").fetchall()],
        "orders": [dict(r) for r in cursor.execute("SELECT * FROM orders").fetchall()],
        "invoices": [dict(r) for r in cursor.execute("SELECT * FROM invoices").fetchall()],
        "purchase_orders": [dict(r) for r in cursor.execute("SELECT * FROM purchase_orders").fetchall()],
        "approvals": [dict(r) for r in cursor.execute("SELECT * FROM approvals").fetchall()],
        "activity_logs": [dict(r) for r in cursor.execute("SELECT * FROM activity_logs").fetchall()],
        "agent_cognition": [dict(r) for r in cursor.execute("SELECT * FROM agent_cognition").fetchall()]
    }
    conn.close()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[EXPORT] Exported test fixture to: {output_path}")

if __name__ == "__main__":
    industry = sys.argv[1] if len(sys.argv) > 1 else "electronics"
    generate_dummy_database(industry)
