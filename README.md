# BizPilot AI – Small Business Back-Office Agent

> **Proactive AI Digital Operations Employee for Small Businesses**  
> *Monitors orders, inventory, invoices, and suppliers &mdash; detects problems before they happen, automatically performs safe routine tasks, and requests human approval for sensitive financial decisions.*

---

## 1. Project Purpose & Differentiator

Small businesses constantly juggle customer orders, inventory replenishment, billing, overdue payments, and supplier coordination across fragmented tools (WhatsApp, paper notebooks, spreadsheets, phone calls).

**BizPilot AI** is **NOT a passive chatbot**. It is an autonomous **Digital Operations Employee** that actively notices what needs to happen and gets routine work done.

```
CAPTURE ➔ UNDERSTAND ➔ REMEMBER ➔ ANALYZE ➔ PLAN ➔ EXECUTE ➔ APPROVE ➔ FOLLOW-UP
```

### Key Differentiator
| Traditional Chatbot | BizPilot AI Back-Office Agent |
| :--- | :--- |
| Waits for user questions (*"What is my stock?"*) | **Proactively alerts**: *"Boat Earphones will exhaust in 1.3 days, before supplier delivery!"* |
| Cannot take actions | **Autonomously takes safe routine actions**: Extracts WhatsApp items, reserves stock, creates orders & invoices. |
| Risks catastrophic mistakes if fully automated | **Human-in-the-Loop Governance**: Requests Owner Authorization for financial actions (e.g. ₹8,500 Purchase Order). |

---

## 2. Business Persona: Sri Lakshmi Electronics

- **Business**: Sri Lakshmi Electronics (Bengaluru, India)
- **Owner / Admin**: Karthik Sharma
- **Category**: Consumer Electronics & Smart Accessories
- **Currency**: INR (₹)
- **Managed SKUs**: Boat BassHeads Earphones, 65W Fast GaN Chargers, 100W Braided Type-C Cables, OnePlus Nord Buds 2, Fastrack Limitless Smartwatches, SanDisk 128GB MicroSD Cards.

---

## 3. Core Modules & Capabilities

### 1. Dashboard (360° Operations Command)
- **6 Real-time KPIs**: Total Orders, Pending Orders, Low Stock Alerts, Overdue Receivables (₹), Today's Revenue (₹), Tasks Automatically Handled.
- **Tri-Color Proactive Priority Hub**:
  - 🔴 **URGENT**: Immediate stockout risks and overdue invoices.
  - 🟡 **NEEDS APPROVAL**: Pending purchase orders & reminders awaiting owner authorization.
  - 🟢 **AUTOMATICALLY HANDLED**: Real-time counter of automated orders, stock deductions, and invoices created today without human effort.
- **Daily Business AI Executive Summary**: Daily operations report and prioritized actions.
- **Interactive Analytics**: Sales velocity vs stock chart and autonomous order channel breakdown.

### 2. AI Agent Cognition & Command Center
- **Visual Cognition Loop**: Live 8-stage tracker (`CAPTURE` &rarr; `UNDERSTAND` &rarr; `REMEMBER` &rarr; `ANALYZE` &rarr; `PLAN` &rarr; `EXECUTE` &rarr; `APPROVE` &rarr; `FOLLOW-UP`).
- **Grounded Natural Language Query Engine**: Answers questions strictly using stored database records without hallucination.

### 3. Orders & WhatsApp Natural Language Ingestion
- **NLP Parser**: Reads messages like *"I need 10 Boat earphones and 5 chargers"*.
- **Autonomous Fulfillment**: Verifies live stock, deducts inventory, creates orders and invoices instantly.
- **Shortage Detection**: If stock is insufficient, immediately flags the shortage and prepares expedited replenishment.

### 4. Inventory & Stockout Prediction Engine
- **Mathematical Formula**:
  $$\text{Days Remaining} = \frac{\text{Current Stock}}{\text{Average Daily Sales}}$$
- **Lead-Time Violation Detection**: Flags critical warning when $\text{Days Remaining} \le \text{Supplier Lead Days}$.

### 5. Smart Reorder & Multi-Supplier Evaluation Matrix
- Compares suppliers across **Price (35%)**, **Delivery SLA / Lead Time (25%)**, and **Reliability (40%)**.
- Penalizes vendors whose delivery lead time exceeds the days-to-stockout threshold.

### 6. Invoices & Accounts Receivable Agent
- Tracks invoice maturity dates.
- Generates polite payment reminders with instant UPI payment links for overdue clients.

### 7. Human-in-the-Loop Owner Approvals Queue
- Clear separation between safe routine tasks (auto-executed) and sensitive actions (requires owner click).
- Detailed breakdown with vendor trade-offs, financial projections, and one-click authorization.

### 8. Immutable Activity & Audit Log
- Chronological audit stream with category filters and autonomous vs manual action indicators.

---

## 4. Hackathon Presentation Demo Walkthrough

Follow this step-by-step scenario during your presentation:

1. **Launch the Demo Scenario**:
   - Click **"1-Click Demo"** in the top bar or sidebar.
   - Boat Earphones are calibrated: **Stock = 8**, **Daily Sales = 6.0/day**, **Lead Time = 3 days**.
2. **Observe Proactive Detection**:
   - The AI Agent calculates $\text{Days Remaining} = \frac{8}{6.0} = 1.33 \text{ days} < 3 \text{ days lead time}$.
   - 🔴 **URGENT** priority alert is triggered immediately on the dashboard.
3. **Inspect Multi-Supplier Matrix**:
   - Navigate to **"Suppliers & Matrix"**.
   - View the comparison:
     - **ABC Electronics**: ₹425/unit, 2 days delivery, 96.5% reliability &rarr; **AI Recommended ⭐** (Beats stockout deadline).
     - **Apex DigiTech**: ₹410/unit, 5 days delivery &rarr; *Rejected* (Guarantees stockout).
     - **Sonic Sound**: ₹450/unit, 1 day delivery &rarr; *Higher unit price*.
4. **Approve Purchase Order in Approval Queue**:
   - Go to **"Owner Approvals"**.
   - Review Ticket `APP-101`: Reorder 20 units from ABC Electronics for **₹8,500**.
   - Click **"Authorize & Execute"** &rarr; Simulated PO is dispatched, inventory is updated, activity is logged.
5. **Test WhatsApp Order Ingestion**:
   - Click **"Simulate WhatsApp Order"** in the top header.
   - Click Preset: *"Please send 2 65W fast chargers and 4 type c cables urgently"*.
   - Click **"Process Message"** &rarr; AI extracts items, verifies inventory, creates Order & Invoice automatically.
6. **Query the AI Command Center**:
   - Navigate to **"AI Command Center"**.
   - Ask: *"Which products are at risk?"* or *"Why is Boat Earphones showing a warning?"*.
   - Observe grounded, fact-based answers computed from the live database.

---

## 5. Quickstart & Run Instructions

### Prerequisites
- Python 3.10+ installed

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the BizPilot AI Application
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Open in Browser
Visit: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 6. Running Tests
To verify all backend reasoning rules, stockout calculations, WhatsApp NLP parsers, and live API endpoints:
```bash
python tests/test_backend.py
python tests/test_live.py
```

---

## 7. Architecture & Tech Stack

- **Backend**: Python 3, FastAPI, Uvicorn, SQLite
- **AI / Agent Engine**: Autonomous Cognitive Loop, Multi-criteria Supplier Ranking, Stockout Predictor, WhatsApp NLP Regex Parser
- **Frontend**: Modern SPA (HTML5, Tailwind CSS, Lucide Icons, Chart.js)
- **Data Persistence**: Local SQLite (`backend/bizpilot.db`) with automatic schema initialization and demo seeder.

---

*BizPilot AI &copy; 2026 &mdash; Built for Small Business Operations Automation.*
