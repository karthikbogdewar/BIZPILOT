// BizPilot AI – Frontend Application Core Logic

let state = {
  activeTab: 'dashboard',
  dashboard: null,
  products: [],
  orders: [],
  invoices: [],
  suppliers: [],
  approvals: [],
  activityLogs: [],
  agents: [],
  charts: {}
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  await fetchAllData();
  initCharts();
  
  // Auto-refresh data every 15 seconds to simulate continuous agent background scanning
  setInterval(async () => {
    await fetchDashboardData(false);
  }, 15000);
});

// -------------------------------------------------------------
// NAVIGATION & TABS
// -------------------------------------------------------------
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update sidebar buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update main views
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove('hidden');
  }

  // Update page title
  const titleMap = {
    'dashboard': 'Operational Command Dashboard',
    'agents-squad': 'Autonomous AI Agents Squad (7 Active Workers)',
    'ai-agent': 'AI Agent Cognition & Command Center',
    'orders': 'Orders & WhatsApp Ingestion Channel',
    'inventory': 'Inventory & Stockout Prediction Engine',
    'invoices': 'Invoices & Accounts Receivable Tracking',
    'suppliers': 'Suppliers & Multi-Criteria Matrix',
    'approvals': 'Human-in-the-Loop Owner Approvals Queue',
    'what-if': 'Supply Chain & Festive Surge "What-If" Digital Twin',
    'activity': 'Real-Time AI Activity & Audit Stream',
    'settings': 'Business Profile & Demo Settings'
  };
  document.getElementById('page-title').innerText = titleMap[tabId] || 'BizPilot AI';

  // Trigger tab-specific refresh
  if (tabId === 'agents-squad') renderAgentsSquadPage();
  if (tabId === 'what-if') runWhatIfSimulation();
  if (tabId === 'inventory') renderInventoryPage();
  if (tabId === 'orders') renderOrdersPage();
  if (tabId === 'invoices') renderInvoicesPage();
  if (tabId === 'inventory') {
    loadMultiBranchData();
  }
  if (tabId === 'suppliers') {
    renderSuppliersPage();
    loadSupplierComparison('PRD-101');
  }
  if (tabId === 'approvals') renderApprovalsPage();
  if (tabId === 'activity') loadActivityLogs();

  if (window.lucide) {
    lucide.createIcons();
  }
}

// -------------------------------------------------------------
// DATA FETCHING & API INTEGRATION
// -------------------------------------------------------------
async function fetchAllData() {
  try {
    await Promise.all([
      fetchDashboardData(true),
      fetchAgents(),
      fetchProducts(),
      fetchOrders(),
      fetchInvoices(),
      fetchSuppliers(),
      fetchApprovals()
    ]);
  } catch (err) {
    console.error('Error loading initial data:', err);
  }
}

async function fetchAgents() {
  try {
    const res = await fetch('/api/agents');
    if (res.ok) {
      const data = await res.json();
      state.agents = data.agents || [];
    }
  } catch (e) {
    console.warn('Failed to fetch agents:', e);
  }
}

async function fetchDashboardData(showLoading = false) {
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    const data = await res.json();
    state.dashboard = data;
    renderDashboard(data);
    updateLastSyncTime();
  } catch (err) {
    console.error(err);
  }
}

async function fetchProducts() {
  const res = await fetch('/api/products');
  if (res.ok) {
    state.products = await res.json();
  }
}

async function fetchOrders() {
  const res = await fetch('/api/orders');
  if (res.ok) {
    state.orders = await res.json();
  }
}

async function fetchInvoices() {
  const res = await fetch('/api/invoices');
  if (res.ok) {
    state.invoices = await res.json();
  }
}

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers');
  if (res.ok) {
    state.suppliers = await res.json();
  }
}

async function fetchApprovals() {
  const res = await fetch('/api/approvals');
  if (res.ok) {
    state.approvals = await res.json();
  }
}

function updateLastSyncTime() {
  const el = document.getElementById('last-sync-time');
  if (el) {
    const now = new Date();
    el.innerText = `Last scan: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
}

// -------------------------------------------------------------
// RENDER: DASHBOARD VIEW
// -------------------------------------------------------------
function renderDashboard(data) {
  if (!data) return;

  // Header info
  if (data.profile) {
    document.getElementById('header-business-name').innerText = data.profile.business_name || 'Sri Lakshmi Electronics';
    document.getElementById('header-owner-name').innerText = data.profile.owner_name || 'Karthik Sharma';
  }

  // Top Statistics
  document.getElementById('stat-total-orders').innerText = data.stats.total_orders;
  document.getElementById('stat-pending-orders').innerText = data.stats.pending_orders;
  document.getElementById('stat-low-stock').innerText = data.stats.low_stock_count;
  document.getElementById('stat-outstanding-payments').innerText = `₹${data.stats.outstanding_payments.toLocaleString('en-IN')}`;
  document.getElementById('stat-today-revenue').innerText = `₹${data.stats.today_revenue.toLocaleString('en-IN')}`;
  document.getElementById('stat-auto-tasks').innerText = data.stats.auto_completed_tasks;

  // Sidebar badges
  document.getElementById('nav-orders-count').innerText = data.stats.total_orders;
  document.getElementById('nav-stockout-badge').innerText = `${data.stats.low_stock_count} Risk`;
  document.getElementById('nav-overdue-count').innerText = `${data.daily_summary.overdue_payments} Overdue`;
  
  const pendingApprovalsCount = data.priority.needs_approval.length;
  document.getElementById('nav-approvals-count').innerText = pendingApprovalsCount;
  document.getElementById('header-approval-pill').innerText = pendingApprovalsCount;
  document.getElementById('needs-approval-badge-count').innerText = `${pendingApprovalsCount} Pending`;

  // 1. 🔴 URGENT ITEMS
  const urgentContainer = document.getElementById('urgent-items-list');
  document.getElementById('urgent-badge-count').innerText = `${data.priority.urgent.length} Items`;
  urgentContainer.innerHTML = '';

  if (data.priority.urgent.length === 0) {
    urgentContainer.innerHTML = `
      <div class="text-center py-6 text-slate-500 text-xs">
        <i data-lucide="check-circle" class="w-6 h-6 mx-auto mb-1 text-emerald-500/60"></i>
        No critical urgent risks detected.
      </div>
    `;
  } else {
    data.priority.urgent.forEach(item => {
      const isStockout = item.type === 'stockout_risk';
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-surface-950/80 border border-rose-900/50 hover:border-rose-700 transition flex flex-col justify-between gap-2';
      div.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isStockout ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'} mb-1">
              ${isStockout ? 'STOCKOUT IMMINENT' : 'PAYMENT OVERDUE'}
            </span>
            <h4 class="font-bold text-white text-xs">${item.title}</h4>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">${item.detail}</p>
          </div>
        </div>
        <div class="flex items-center justify-end pt-1">
          <button onclick="switchTab('approvals')" class="bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer">
            <span>${item.action_label}</span> &rarr;
          </button>
        </div>
      `;
      urgentContainer.appendChild(div);
    });
  }

  // 2. 🟡 NEEDS APPROVAL ITEMS
  const approvalContainer = document.getElementById('needs-approval-items-list');
  approvalContainer.innerHTML = '';

  if (data.priority.needs_approval.length === 0) {
    approvalContainer.innerHTML = `
      <div class="text-center py-6 text-slate-500 text-xs">
        <i data-lucide="check-circle" class="w-6 h-6 mx-auto mb-1 text-emerald-500/60"></i>
        All pending approval items resolved.
      </div>
    `;
  } else {
    data.priority.needs_approval.forEach(app => {
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-surface-950/80 border border-amber-900/50 hover:border-amber-700 transition flex flex-col justify-between gap-2';
      div.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ${app.type}
            </span>
            ${app.amount ? `<span class="text-xs font-mono font-bold text-white">₹${app.amount.toLocaleString('en-IN')}</span>` : ''}
          </div>
          <h4 class="font-bold text-white text-xs">${app.title}</h4>
          <p class="text-[11px] text-slate-300 mt-1 line-clamp-2">${app.recommendation}</p>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button onclick="rejectApprovalAction('${app.id}')" class="text-slate-400 hover:text-rose-400 text-[11px] px-2 py-1 rounded transition cursor-pointer">
            Reject
          </button>
          <button onclick="approveApprovalAction('${app.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer">
            <i data-lucide="check" class="w-3 h-3"></i> Approve
          </button>
        </div>
      `;
      approvalContainer.appendChild(div);
    });
  }

  // 3. 🟢 AUTOMATICALLY HANDLED ITEMS
  const autoContainer = document.getElementById('auto-handled-items-list');
  autoContainer.innerHTML = '';
  if (data.priority.auto_handled && data.priority.auto_handled.length > 0) {
    data.priority.auto_handled.slice(0, 4).forEach(log => {
      const div = document.createElement('div');
      div.className = 'p-2.5 rounded-xl bg-surface-950/60 border border-emerald-900/30 flex items-start gap-2.5';
      div.innerHTML = `
        <div class="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <i data-lucide="check" class="w-3 h-3"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between text-[11px]">
            <strong class="text-white font-medium truncate">${log.title}</strong>
            <span class="text-slate-500 text-[10px] font-mono">${log.time_display}</span>
          </div>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">${log.detail}</p>
        </div>
      `;
      autoContainer.appendChild(div);
    });
  }

  // Daily Summary Stats
  document.getElementById('daily-orders-count').innerText = data.daily_summary.orders_processed;
  document.getElementById('daily-lowstock-count').innerText = data.daily_summary.low_stock_risks;
  document.getElementById('daily-overdue-count').innerText = data.daily_summary.overdue_payments;
  document.getElementById('daily-auto-count').innerText = data.daily_summary.tasks_auto_completed;
  document.getElementById('daily-decisions-count').innerText = data.daily_summary.owner_decisions_required;
  document.getElementById('daily-top-recommendation').innerHTML = data.daily_summary.highest_priority_recommendation;

  // Mini Activity Logs
  const miniLogs = document.getElementById('dashboard-mini-logs');
  miniLogs.innerHTML = '';
  if (data.recent_logs) {
    data.recent_logs.slice(0, 5).forEach(log => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0 text-xs';
      div.innerHTML = `
        <div class="flex items-center gap-2 truncate">
          <span class="w-1.5 h-1.5 rounded-full ${log.severity === 'urgent' ? 'bg-rose-500' : (log.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-400')}"></span>
          <span class="text-slate-200 truncate">${log.title}</span>
        </div>
        <span class="text-[10px] text-slate-500 font-mono shrink-0">${log.time_display}</span>
      `;
      miniLogs.appendChild(div);
    });
  }

  // Cognition stream in AI Agent tab
  renderCognitionStream(data.cognition_trail);

  if (window.lucide) {
    lucide.createIcons();
  }
}

// -------------------------------------------------------------
// RENDER: INVENTORY PAGE
// -------------------------------------------------------------
function renderInventoryPage() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody || !state.products) return;

  tbody.innerHTML = '';
  state.products.forEach(p => {
    const days = p.days_remaining;
    const isCritical = days <= p.lead_time_days;
    const isWarning = p.stock <= p.min_stock;

    let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let statusText = 'Optimal Stock';
    if (isCritical) {
      badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      statusText = '🔴 Stockout Risk';
    } else if (isWarning) {
      badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      statusText = '🟡 Reorder Soon';
    }

    const tr = document.createElement('tr');
    tr.className = isCritical ? 'bg-rose-950/20' : '';
    tr.innerHTML = `
      <td class="p-3.5 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-surface-950 border border-slate-700 flex items-center justify-center font-bold text-brand-400 font-mono text-xs">
          ${p.id.replace('PRD-', '#')}
        </div>
        <div>
          <strong class="text-white block font-semibold">${p.name}</strong>
          <span class="text-[11px] text-slate-400">${p.category} | Min buffer: ${p.min_stock} units</span>
        </div>
      </td>
      <td class="p-3.5 font-mono font-bold ${isCritical ? 'text-rose-400 text-sm' : 'text-white'}">${p.stock} units</td>
      <td class="p-3.5 font-mono text-slate-300">${p.avg_daily_sales} / day</td>
      <td class="p-3.5 font-mono">
        <span class="font-bold ${isCritical ? 'text-rose-400' : (isWarning ? 'text-amber-400' : 'text-emerald-400')}">${days} days</span>
        <div class="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div class="h-full ${isCritical ? 'bg-rose-500' : (isWarning ? 'bg-amber-400' : 'bg-emerald-400')}" style="width: ${Math.min(100, (days / 10) * 100)}%"></div>
        </div>
      </td>
      <td class="p-3.5 font-mono text-slate-300">${p.lead_time_days} days</td>
      <td class="p-3.5 font-mono text-slate-200">₹${p.unit_price.toLocaleString('en-IN')}</td>
      <td class="p-3.5">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${badgeClass}">
          ${statusText}
        </span>
      </td>
      <td class="p-3.5 text-right">
        <button onclick="compareSuppliersAndRestock('${p.id}')" class="bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 text-xs px-2.5 py-1.5 rounded-lg transition font-medium cursor-pointer">
          Reorder Analysis
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function compareSuppliersAndRestock(productId) {
  switchTab('suppliers');
  const select = document.getElementById('supplier-matrix-select');
  if (select) {
    select.value = productId;
  }
  loadSupplierComparison(productId);
}

// -------------------------------------------------------------
// RENDER: ORDERS PAGE
// -------------------------------------------------------------
function renderOrdersPage() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody || !state.orders) return;

  tbody.innerHTML = '';
  state.orders.forEach(ord => {
    let itemsText = '';
    if (ord.items && Array.isArray(ord.items)) {
      itemsText = ord.items.map(it => `${it.qty}x ${it.name}`).join(', ');
    } else {
      itemsText = 'Standard items';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-3.5 font-mono font-bold text-brand-400">${ord.id}</td>
      <td class="p-3.5">
        <strong class="text-white block">${ord.customer_name}</strong>
        <span class="text-[11px] text-slate-400">${ord.customer_id}</span>
      </td>
      <td class="p-3.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
          ${ord.channel}
        </span>
      </td>
      <td class="p-3.5 max-w-xs truncate text-slate-300" title="${itemsText}">
        ${itemsText}
      </td>
      <td class="p-3.5 font-mono font-bold text-white">₹${ord.total_amount.toLocaleString('en-IN')}</td>
      <td class="p-3.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${ord.payment_status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : (ord.payment_status === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300')}">
          ${ord.payment_status}
        </span>
      </td>
      <td class="p-3.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
          Auto Fulfilled
        </span>
      </td>
      <td class="p-3.5 font-mono text-slate-400 text-[11px]">${ord.created_at}</td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function filterOrdersTable() {
  const query = document.getElementById('order-search-input').value.toLowerCase();
  const rows = document.querySelectorAll('#orders-table-body tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

// -------------------------------------------------------------
// RENDER: INVOICES & PAYMENTS PAGE
// -------------------------------------------------------------
function renderInvoicesPage() {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody || !state.invoices) return;

  tbody.innerHTML = '';
  state.invoices.forEach(inv => {
    const isOverdue = inv.status === 'Overdue';
    const tr = document.createElement('tr');
    tr.className = isOverdue ? 'bg-amber-950/20' : '';
    tr.innerHTML = `
      <td class="p-3.5 font-mono font-bold text-white">${inv.id}</td>
      <td class="p-3.5 font-mono text-slate-400">${inv.order_id || 'Direct'}</td>
      <td class="p-3.5">
        <strong class="text-white block">${inv.customer_name}</strong>
        <span class="text-[11px] text-slate-400">Created: ${inv.created_date}</span>
      </td>
      <td class="p-3.5 font-mono font-bold text-white text-sm">₹${inv.amount.toLocaleString('en-IN')}</td>
      <td class="p-3.5 font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}">${inv.due_date}</td>
      <td class="p-3.5">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : (isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300')}">
          ${inv.status}
        </span>
      </td>
      <td class="p-3.5 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openUpiModal('${inv.id}', ${inv.amount}, '${inv.customer_name}')" class="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] px-2 py-1 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer" title="View Scannable UPI QR">
            <i data-lucide="qr-code" class="w-3 h-3 text-emerald-400"></i> QR Pay
          </button>
          <button onclick="openGstInvoiceModal('${inv.id}')" class="bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/30 text-[11px] px-2 py-1 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer" title="View GST E-Invoice">
            <i data-lucide="receipt" class="w-3 h-3 text-teal-400"></i> GST Bill
          </button>
          ${isOverdue ? `
            <button onclick="openKhataReminderModal('${inv.id}', '${inv.customer_name}', ${inv.amount})" class="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-[11px] px-2 py-1 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer" title="Send Localized Khata Reminder">
              <i data-lucide="bell-ring" class="w-3 h-3 text-amber-400"></i> Khata Alert
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// RENDER: SUPPLIERS PAGE & COMPARISON MATRIX
// -------------------------------------------------------------
function renderSuppliersPage() {
  const tbody = document.getElementById('suppliers-table-body');
  if (!tbody || !state.suppliers) return;

  tbody.innerHTML = '';
  state.suppliers.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-3.5 font-mono font-bold text-brand-400">${s.id}</td>
      <td class="p-3.5">
        <strong class="text-white block">${s.name}</strong>
        <span class="text-[11px] text-slate-400">${s.catalog ? s.catalog.length : 0} catalog products</span>
      </td>
      <td class="p-3.5 text-slate-200">${s.contact_name}</td>
      <td class="p-3.5 text-slate-300 font-mono text-xs">
        <div>${s.phone}</div>
        <div class="text-slate-400 text-[11px]">${s.email}</div>
      </td>
      <td class="p-3.5 text-slate-300">${s.city}</td>
      <td class="p-3.5 font-mono font-bold text-emerald-400">${s.reliability_score}%</td>
      <td class="p-3.5 font-mono text-slate-300">${s.payment_terms}</td>
      <td class="p-3.5 font-mono text-slate-400">${s.order_history_count} orders</td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

async function loadSupplierComparison(productId) {
  const container = document.getElementById('supplier-comparison-container');
  if (!container) return;

  container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs"><i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto mb-1 text-brand-400"></i> Evaluating supplier matrix...</div>`;
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch(`/api/products/${productId}/suppliers`);
    if (!res.ok) throw new Error('Failed to load supplier comparison');
    const comp = await res.json();

    let cardsHtml = '';
    comp.comparisons.forEach(c => {
      const isBest = c.id === comp.best_supplier.id;
      cardsHtml += `
        <div class="p-4 rounded-xl border ${isBest ? 'bg-brand-950/40 border-brand-500 shadow-lg shadow-brand-500/10' : 'bg-surface-950/60 border-slate-800'} flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-white text-sm">${c.name}</span>
              ${isBest ? '<span class="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Pick ⭐</span>' : ''}
            </div>
            
            <div class="space-y-1.5 text-xs text-slate-300 my-3">
              <div class="flex justify-between border-b border-slate-800/80 pb-1">
                <span class="text-slate-400">Unit Price:</span>
                <span class="font-mono font-bold text-white">₹${c.price.toFixed(2)}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800/80 pb-1">
                <span class="text-slate-400">Delivery Lead Time:</span>
                <span class="font-mono font-semibold ${c.lead_time_days <= comp.days_remaining ? 'text-emerald-400' : 'text-rose-400'}">${c.lead_time_days} days</span>
              </div>
              <div class="flex justify-between border-b border-slate-800/80 pb-1">
                <span class="text-slate-400">Reliability Score:</span>
                <span class="font-mono font-bold text-emerald-400">${c.reliability_score}%</span>
              </div>
              <div class="flex justify-between border-b border-slate-800/80 pb-1">
                <span class="text-slate-400">Min Order Qty (MOQ):</span>
                <span class="font-mono text-slate-200">${c.moq} units</span>
              </div>
              <div class="flex justify-between pt-1">
                <span class="text-slate-400">Weighted AI Score:</span>
                <span class="font-mono font-bold text-brand-300 text-sm">${c.total_score} / 100</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800">
            <span class="text-[11px] ${isBest ? 'text-brand-300 font-medium' : 'text-slate-400'} block leading-tight">
              ${isBest ? 'Recommended: Optimal speed and reliability balance.' : (c.lead_time_days > comp.days_remaining ? '⚠️ Lead time exceeds stockout threshold.' : 'Alternative supplier.')}
            </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Rationale Callout -->
        <div class="bg-surface-950 p-4 rounded-xl border border-brand-500/30 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-brand-500/20 text-brand-300 shrink-0">
            <i data-lucide="bot" class="w-4 h-4"></i>
          </div>
          <div class="text-xs">
            <strong class="text-white block font-semibold mb-0.5">Autonomous Optimization Rationale for ${comp.product.name}:</strong>
            <p class="text-slate-300 leading-relaxed">${comp.rationale}</p>
            <div class="mt-2 text-[11px] font-mono text-brand-300">
              Optimal Reorder Quantity: <strong>${comp.recommended_qty} units</strong> | Estimated Cost: <strong>₹${comp.estimated_cost.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        <!-- Supplier Comparison Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${cardsHtml}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div class="text-rose-400 text-xs py-4 text-center">Unable to evaluate suppliers for this product.</div>`;
  }
}

// -------------------------------------------------------------
// RENDER: APPROVALS QUEUE PAGE
// -------------------------------------------------------------
function renderApprovalsPage() {
  const container = document.getElementById('approvals-full-list');
  if (!container || !state.approvals) return;

  container.innerHTML = '';
  const pendingApprovals = state.approvals.filter(a => a.status === 'Pending');

  if (pendingApprovals.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-900 border border-slate-800 rounded-2xl p-12 text-center">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="shield-check" class="w-8 h-8"></i>
        </div>
        <h3 class="font-bold text-white text-base">Approval Queue is Clear</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">BizPilot AI is actively monitoring operations. New financial or sensitive actions will appear here for your review.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  pendingApprovals.forEach(app => {
    const meta = app.metadata || {};
    const isPO = app.type === 'Purchase Order';
    const isReminder = app.type === 'Payment Reminder';

    let detailsHtml = '';
    if (isPO && meta.comparison) {
      detailsHtml = `
        <div class="mt-4 p-3.5 rounded-xl bg-surface-950/80 border border-slate-800 text-xs">
          <h5 class="font-bold text-slate-300 text-xs mb-2">Supplier Trade-Off Evaluation:</h5>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            ${meta.comparison.map(c => `
              <div class="p-2 rounded-lg ${c.selected ? 'bg-brand-950/60 border border-brand-500/40 text-brand-200' : 'bg-surface-900 border border-slate-800 text-slate-400'}">
                <div class="font-semibold text-white flex items-center justify-between text-[11px]">
                  <span>${c.name}</span>
                  ${c.selected ? '<span class="text-[9px] bg-brand-500 text-white px-1.5 py-0.2 rounded font-bold">PICK</span>' : ''}
                </div>
                <div class="mt-1 text-[10px] font-mono">₹${c.price} • ${c.lead} • ${c.reliability}</div>
                <div class="mt-1 text-[10px] text-slate-400">${c.reason}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (isReminder && meta.message) {
      detailsHtml = `
        <div class="mt-4 p-3.5 rounded-xl bg-surface-950/80 border border-slate-800 text-xs">
          <h5 class="font-bold text-slate-300 text-xs mb-1.5">Drafted WhatsApp Notification:</h5>
          <div class="p-2.5 rounded-lg bg-[#075e54]/20 border border-emerald-500/30 text-slate-200 font-sans text-xs">
            "${meta.message}"
          </div>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'bg-surface-900 border border-amber-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden';
    card.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ${app.type}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Priority: ${app.priority}
            </span>
            <span class="text-xs text-slate-400 font-mono">Ticket: ${app.id}</span>
          </div>
          <h3 class="font-bold text-white text-base">${app.title}</h3>
        </div>

        ${app.amount ? `
          <div class="text-right">
            <span class="text-xs text-slate-400 block">Estimated Amount</span>
            <span class="text-2xl font-bold font-mono text-amber-300">₹${app.amount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
      </div>

      <div class="py-4 space-y-2 text-xs">
        <p class="text-slate-300 leading-relaxed"><strong class="text-slate-400">Context:</strong> ${app.description}</p>
        <p class="text-slate-300 leading-relaxed"><strong class="text-brand-400">AI Recommendation:</strong> ${app.recommendation}</p>
        ${detailsHtml}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-slate-800">
        <span class="text-[11px] text-slate-500 font-mono">Generated: ${app.created_at}</span>
        <div class="flex items-center gap-3">
          <button onclick="rejectApprovalAction('${app.id}')" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer">
            Reject Action
          </button>
          <button onclick="approveApprovalAction('${app.id}')" class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Authorize & Execute</span>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

async function approveApprovalAction(approvalId) {
  try {
    const res = await fetch(`/api/approvals/${approvalId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Approval execution failed');
    showToast('Success', 'Action authorized and executed by BizPilot AI!', 'success');
    await fetchAllData();
    switchTab('approvals');
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function rejectApprovalAction(approvalId) {
  try {
    const res = await fetch(`/api/approvals/${approvalId}/reject`, { method: 'POST' });
    if (!res.ok) throw new Error('Rejection failed');
    showToast('Action Rejected', 'Recommendation cancelled. Agent plan updated.', 'warning');
    await fetchAllData();
    switchTab('approvals');
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// RENDER: ACTIVITY LOGS PAGE
// -------------------------------------------------------------
async function loadActivityLogs(category = 'All') {
  const tbody = document.getElementById('activity-table-body');
  if (!tbody) return;

  try {
    const url = category && category !== 'All' ? `/api/activity-logs?category=${category}` : '/api/activity-logs';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load activity logs');
    const logs = await res.json();
    state.activityLogs = logs;

    tbody.innerHTML = '';
    logs.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-3.5 text-slate-400 whitespace-nowrap">${l.timestamp}</td>
        <td class="p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            ${l.category}
          </span>
        </td>
        <td class="p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${l.automated ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-500/20 text-brand-300'}">
            ${l.automated ? '🟢 AUTONOMOUS' : '👤 OWNER ACTION'}
          </span>
        </td>
        <td class="p-3.5 text-white font-semibold">${l.title}</td>
        <td class="p-3.5 text-slate-300 leading-relaxed">${l.detail}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function renderCognitionStream(stream) {
  const container = document.getElementById('cognition-stream-list');
  if (!container || !stream) return;

  container.innerHTML = '';
  stream.forEach(c => {
    const div = document.createElement('div');
    div.className = 'p-2.5 rounded-xl bg-surface-950 border border-slate-800 space-y-1';
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
          ${c.stage}
        </span>
        <span class="text-[10px] text-slate-500 font-mono">${c.timestamp ? c.timestamp.split(' ')[1] : ''}</span>
      </div>
      <strong class="text-white block text-xs">${c.summary}</strong>
      <p class="text-[11px] text-slate-400 leading-tight">${c.details}</p>
    `;
    container.appendChild(div);
  });
}

// -------------------------------------------------------------
// AI COMMAND CENTER & GROUNDED Q&A CHAT
// -------------------------------------------------------------
async function handleCommandSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('ai-command-input');
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  await executeAICommand(query);
}

function sendQuickCommand(query) {
  executeAICommand(query);
}

async function executeAICommand(query) {
  const chatMessages = document.getElementById('ai-chat-messages');
  if (!chatMessages) return;

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'flex items-start gap-3 justify-end';
  userDiv.innerHTML = `
    <div class="bg-brand-600 rounded-2xl rounded-tr-none p-3 max-w-[85%] text-white text-xs">
      ${query}
    </div>
  `;
  chatMessages.appendChild(userDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Append AI loading bubble
  const aiLoadingDiv = document.createElement('div');
  aiLoadingDiv.className = 'flex items-start gap-3';
  aiLoadingDiv.id = 'ai-loading-bubble';
  aiLoadingDiv.innerHTML = `
    <div class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 mt-0.5">
      <i data-lucide="bot" class="w-4 h-4 animate-spin"></i>
    </div>
    <div class="bg-surface-800 border border-slate-700/60 rounded-2xl rounded-tl-none p-3 text-slate-400 text-xs">
      Querying database & analyzing operations...
    </div>
  `;
  chatMessages.appendChild(aiLoadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch('/api/agent/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    const loadingEl = document.getElementById('ai-loading-bubble');
    if (loadingEl) loadingEl.remove();

    // Format markdown output
    const formattedAnswer = formatMarkdown(data.answer);

    const aiDiv = document.createElement('div');
    aiDiv.className = 'flex items-start gap-3';
    aiDiv.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 mt-0.5">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="bg-surface-800 border border-slate-700/60 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-slate-200 text-xs ai-formatted-chat leading-relaxed">
        ${formattedAnswer}
      </div>
    `;
    chatMessages.appendChild(aiDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    const loadingEl = document.getElementById('ai-loading-bubble');
    if (loadingEl) loadingEl.remove();
    showToast('Error', 'Failed to reach AI Command Center', 'error');
  }
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/### (.*?)\n/g, '<h3 class="font-bold text-white text-sm my-1">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="font-bold text-white text-base my-1.5">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 text-brand-300 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// -------------------------------------------------------------
// MODAL: WHATSAPP CUSTOMER INGESTION
// -------------------------------------------------------------
function openWhatsAppSimulatorModal() {
  document.getElementById('whatsapp-modal').classList.remove('hidden');
  document.getElementById('wa-result-box').classList.add('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeWhatsAppSimulatorModal() {
  document.getElementById('whatsapp-modal').classList.add('hidden');
}

function setWhatsAppPreset(message, customerName) {
  document.getElementById('wa-message-text').value = message;
  document.getElementById('wa-customer-name').value = customerName;
}

async function submitSimulatedWhatsAppMessage() {
  const message = document.getElementById('wa-message-text').value.trim();
  const customerName = document.getElementById('wa-customer-name').value.trim();
  const resultBox = document.getElementById('wa-result-box');

  if (!message) {
    alert('Please enter a WhatsApp message.');
    return;
  }

  resultBox.className = 'p-3.5 rounded-xl text-xs bg-slate-800 text-slate-300 border border-slate-700 block';
  resultBox.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin inline mr-1 text-brand-400"></i> AI Agent extracting items and verifying inventory...';
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch('/api/orders/simulate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, customer_name: customerName, channel: 'WhatsApp' })
    });
    const data = await res.json();

    if (data.success) {
      resultBox.className = 'p-3.5 rounded-xl text-xs bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 block space-y-1.5';
      resultBox.innerHTML = `
        <div class="font-bold text-white flex items-center gap-1.5 text-xs">
          <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
          Order Automatically Fulfilled!
        </div>
        <p>${data.message}</p>
        <div class="text-[11px] font-mono text-emerald-300">
          Order ID: <strong>${data.order_id}</strong> | Invoice: <strong>${data.invoice_id}</strong>
        </div>
      `;
      showToast('Order Auto-Fulfilled', `Created Order ${data.order_id} for ${customerName} (₹${data.total_amount:,.2f})`, 'success');
      await fetchAllData();
    } else {
      resultBox.className = 'p-3.5 rounded-xl text-xs bg-rose-950/80 text-rose-200 border border-rose-500/40 block space-y-1.5';
      resultBox.innerHTML = `
        <div class="font-bold text-white flex items-center gap-1.5 text-xs">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i>
          Inventory Shortage Detected!
        </div>
        <p>${data.message}</p>
        <div class="text-[11px] text-rose-300">
          Reorder approval request has been prioritized in your queue.
        </div>
      `;
      showToast('Inventory Shortage', data.message, 'warning');
      await fetchAllData();
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    resultBox.className = 'p-3.5 rounded-xl text-xs bg-rose-950/80 text-rose-200 border border-rose-500/40 block';
    resultBox.innerHTML = 'Error processing WhatsApp order message.';
  }
}

// -------------------------------------------------------------
// HACKATHON DEMO & STATE RESET TRIGGERS
// -------------------------------------------------------------
async function runHackathonDemoScenario() {
  try {
    const res = await fetch('/api/demo/hackathon-scenario', { method: 'POST' });
    const data = await res.json();
    showToast('Demo Scenario Activated', 'Boat Earphones calibrated: 8 units stock, 1.33 days remaining. Reorder PO ready for approval!', 'success');
    await fetchAllData();
    switchTab('dashboard');
  } catch (err) {
    showToast('Error', 'Failed to run demo scenario', 'error');
  }
}

async function triggerOperationsScan() {
  try {
    const res = await fetch('/api/agent/scan', { method: 'POST' });
    const data = await res.json();
    showToast('Operations Scan Complete', `Scanned all SKUs and accounts. ${data.actions_taken.length} new actions generated.`, 'success');
    await fetchAllData();
  } catch (err) {
    showToast('Error', 'Scan failed', 'error');
  }
}

async function resetDatabaseState() {
  if (!confirm('Reset Sri Lakshmi Electronics database back to clean baseline demo state?')) return;
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    showToast('Database Reset', 'Demo database restored to initial clean state.', 'success');
    await fetchAllData();
    switchTab('dashboard');
  } catch (err) {
    showToast('Error', 'Reset failed', 'error');
  }
}

async function handleSettingsSave(e) {
  e.preventDefault();
  const payload = {
    business_name: document.getElementById('setting-biz-name').value,
    owner_name: document.getElementById('setting-owner-name').value,
    category: document.getElementById('setting-category').value,
    city: document.getElementById('setting-city').value,
    auto_pilot_enabled: 1,
    approval_required_above: parseFloat(document.getElementById('setting-approval-threshold').value) || 5000.0
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Settings Saved', 'Business profile and auto-pilot thresholds updated.', 'success');
      await fetchAllData();
    }
  } catch (err) {
    showToast('Error', 'Failed to save settings', 'error');
  }
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------
function showToast(title, message, type = 'success') {
  const toast = document.getElementById('toast-notification');
  const toastTitle = document.getElementById('toast-title');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast) return;

  toastTitle.innerText = title;
  toastMsg.innerText = message;

  if (type === 'success') {
    toastIcon.className = 'p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400';
    toastIcon.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
  } else if (type === 'warning') {
    toastIcon.className = 'p-1.5 rounded-lg bg-amber-500/20 text-amber-400';
    toastIcon.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4"></i>';
  } else {
    toastIcon.className = 'p-1.5 rounded-lg bg-rose-500/20 text-rose-400';
    toastIcon.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
  }

  if (window.lucide) lucide.createIcons();

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 4000);
}

// -------------------------------------------------------------
// CHART.JS INITIALIZATION
// -------------------------------------------------------------
function initCharts() {
  // Chart 1: Inventory Health & Sales Velocity
  const ctx1 = document.getElementById('inventoryHealthChart');
  if (ctx1) {
    state.charts.inventory = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Boat Earphones', '65W Charger', 'Type-C Cable', 'Nord Buds 2', 'Smartwatch', 'MicroSD 128G'],
        datasets: [
          {
            label: 'Current Stock (Units)',
            data: [8, 28, 45, 4, 14, 36],
            backgroundColor: ['rgba(244, 63, 94, 0.8)', 'rgba(99, 102, 241, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(244, 63, 94, 0.8)', 'rgba(99, 102, 241, 0.7)', 'rgba(16, 185, 129, 0.7)'],
            borderRadius: 6
          },
          {
            label: 'Avg Daily Sales (Units)',
            data: [6.0, 4.0, 7.5, 2.5, 2.0, 5.0],
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });
  }

  // Chart 2: Order Channel & Automation Breakdown
  const ctx2 = document.getElementById('orderChannelChart');
  if (ctx2) {
    state.charts.channels = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['WhatsApp (Auto-NLP)', 'Online Store', 'Walk-in Retail', 'Phone Orders'],
        datasets: [{
          data: [55, 25, 12, 8],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(148, 163, 184, 0.6)'
          ],
          borderColor: '#0f172a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { size: 11 } }
          }
        },
        cutout: '68%'
      }
    });
  }
}

// -------------------------------------------------------------
// MULTI-AGENT SQUAD RENDERING & TASK RUNNERS
// -------------------------------------------------------------

async function renderAgentsSquadPage() {
  const container = document.getElementById('agents-grid-container');
  if (!container) return;

  if (!state.agents || state.agents.length === 0) {
    await fetchAgents();
  }

  const agentIcons = {
    'agent_inventory': { icon: 'boxes', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'Inventory & Forecasting' },
    'agent_sales': { icon: 'message-square', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', badge: 'WhatsApp & Conversational Sales' },
    'agent_cashflow': { icon: 'receipt', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', badge: 'Receivables & Cash Flow' },
    'agent_procurement': { icon: 'truck', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', badge: 'Procurement & Vendor SLA' },
    'agent_multilingual': { icon: 'languages', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', badge: 'Indic Localization & Transliteration' },
    'agent_gst_tax': { icon: 'calculator', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', badge: 'GST, HSN & Tax Compliance' },
    'agent_executive_brief': { icon: 'briefcase', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', badge: 'CEO Operations Briefing' }
  };

  container.innerHTML = state.agents.map(agent => {
    const meta = agentIcons[agent.agent_id] || { icon: 'bot', color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/30', badge: 'Operations' };
    const tasksHtml = (agent.supported_tasks || []).map(t => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-950/80 border border-slate-800 hover:border-slate-700 transition">
        <div>
          <strong class="text-white text-xs block">${t.name}</strong>
          <span class="text-slate-400 text-[11px]">${t.description}</span>
        </div>
        <button onclick="runAgentTaskLive('${agent.agent_id}', '${t.task_id}')" class="bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1 shrink-0 ml-2 cursor-pointer">
          <i data-lucide="play" class="w-3 h-3"></i> Run
        </button>
      </div>
    `).join('');

    return `
      <div class="p-5 rounded-2xl bg-surface-900 border ${meta.border} shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center border ${meta.border}">
                <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-sm text-white flex items-center gap-2">
                  ${agent.name}
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Agent Online"></span>
                </h4>
                <span class="text-[11px] font-mono ${meta.color}">${meta.badge}</span>
              </div>
            </div>
            <button onclick="openAgentSpecModal('${agent.agent_id}')" class="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer">
              <i data-lucide="file-code" class="w-3 h-3 text-brand-400"></i> Prompt Spec
            </button>
          </div>

          <div class="mt-3.5 space-y-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Role</span>
              <p class="text-xs text-slate-200">${agent.role}</p>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Context Scope</span>
              <p class="text-[11px] text-slate-400">${agent.context}</p>
            </div>
          </div>
        </div>

        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2">Callable Agent Tasks</span>
          <div class="space-y-1.5">
            ${tasksHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

function openAgentSpecModal(agentId) {
  const agent = state.agents.find(a => a.agent_id === agentId);
  if (!agent) return;

  document.getElementById('agent-modal-name').innerText = agent.name;
  document.getElementById('agent-modal-role').innerText = agent.role;
  document.getElementById('agent-modal-context').innerText = agent.context;
  document.getElementById('agent-modal-prompt').innerText = agent.system_prompt;

  const tasksContainer = document.getElementById('agent-modal-tasks');
  tasksContainer.innerHTML = (agent.supported_tasks || []).map(t => `
    <div class="p-2.5 rounded-lg bg-surface-900 border border-slate-800">
      <div class="flex items-center justify-between">
        <strong class="text-white text-xs">${t.name} (<code>${t.task_id}</code>)</strong>
      </div>
      <p class="text-slate-400 text-[11px] mt-0.5">${t.description}</p>
      ${Object.keys(t.parameters || {}).length > 0 ? `
        <div class="mt-1.5 pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-brand-300">
          Params: ${JSON.stringify(t.parameters)}
        </div>
      ` : ''}
    </div>
  `).join('');

  document.getElementById('agent-spec-modal').classList.remove('hidden');
  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeAgentSpecModal() {
  document.getElementById('agent-spec-modal').classList.add('hidden');
}

async function runAgentTaskLive(agentId, taskId, customPayload = {}) {
  const consoleEl = document.getElementById('agent-task-output');
  const statusEl = document.getElementById('agent-console-status');

  if (statusEl) statusEl.innerText = `Executing [${agentId}] task '${taskId}'...`;
  if (consoleEl) {
    consoleEl.innerText = `// Dispatched task '${taskId}' to ${agentId} at ${new Date().toLocaleTimeString()}...\n// Awaiting autonomous cognitive output...\n`;
  }

  try {
    const res = await fetch(`/api/agents/${agentId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_name: taskId, payload: customPayload })
    });

    const data = await res.json();
    if (consoleEl) {
      consoleEl.innerText = JSON.stringify(data, null, 2);
    }
    if (statusEl) {
      statusEl.innerText = `Task completed in ${res.ok ? 'SUCCESS' : 'ERROR'}`;
    }

    showToast('Agent Task Executed', `[${agentId}] ${taskId} completed successfully!`, 'success');
    
    // Refresh background state
    fetchDashboardData(false);
  } catch (err) {
    if (consoleEl) consoleEl.innerText = `// Execution Error:\n${err.message}`;
    showToast('Agent Task Error', err.message, 'error');
  }
}

async function triggerMultiAgentSwarmCycle() {
  const consoleEl = document.getElementById('agent-task-output');
  const statusEl = document.getElementById('agent-console-status');

  if (statusEl) statusEl.innerText = 'Synchronizing Multi-Agent Swarm Cycle...';
  if (consoleEl) {
    consoleEl.innerText = `// Initiating 4-Agent Coordinated Operations Swarm...\n// 1. Inventory Sentinel: Scanning Days-to-Stockout velocity...\n// 2. Supplier Procurement Agent: Evaluating multi-vendor matrices...\n// 3. Cash Flow Agent: Auditing receivables & staging overdue collections...\n// 4. WhatsApp Agent: Polling inbound customer channels...\n`;
  }

  try {
    const res = await fetch('/api/agents/swarm/cycle', { method: 'POST' });
    const data = await res.json();

    if (consoleEl) {
      consoleEl.innerText = JSON.stringify(data, null, 2);
    }
    if (statusEl) {
      statusEl.innerText = 'Swarm cycle completed successfully across all 4 agents';
    }

    showToast('Swarm Synchronized', 'All 4 agents completed synchronized operations cycle!', 'success');
    await fetchAllData();
  } catch (err) {
    if (consoleEl) consoleEl.innerText = `// Swarm Error:\n${err.message}`;
    showToast('Swarm Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// TELEGRAM BOT LIVE INTEGRATION HELPERS
// -------------------------------------------------------------

async function autoLinkTelegramChat() {
  try {
    const res = await fetch('/api/telegram/auto-discover-chat', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Telegram Linked!', `Connected to ${data.user_name} (Chat ID: ${data.chat_id})`, 'success');
    } else {
      showToast('Telegram Link Notice', data.message, 'warning');
    }
  } catch (err) {
    showToast('Telegram Error', err.message, 'error');
  }
}

async function sendTelegramTestApproval() {
  try {
    const res = await fetch('/api/telegram/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Stockout Imminent: Boat BassHeads Earphones",
        description: "Stock will exhaust in 1.33 days! Procurement agent drafted ₹8,500 PO from ABC Electronics.",
        amount: 8500.0,
        approval_id: "APP-101",
        reference_id: "PO-901"
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Alert Sent to Phone!', 'Check your Telegram app for the interactive Approval card.', 'success');
    } else {
      showToast('Telegram Alert Notice', data.error || 'Please link your Telegram chat first.', 'warning');
    }
  } catch (err) {
    showToast('Telegram Alert Error', err.message, 'error');
  }
}

async function dispatchTelegramDailyBriefing() {
  try {
    showToast('Synthesizing Briefing', 'Executive Briefing Agent is compiling daily telemetry...', 'info');
    const res = await fetch('/api/agents/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: "agent_executive_brief",
        task_name: "dispatch_telegram_briefing",
        payload: {}
      })
    });
    const data = await res.json();
    if (data.success && data.result.dispatched_to_telegram) {
      showToast('CEO Briefing Sent!', 'Daily operations summary pushed to your Telegram Bot!', 'success');
    } else {
      showToast('Briefing Generated', 'Summary ready. Link Telegram to receive phone push.', 'warning');
    }
  } catch (err) {
    showToast('Briefing Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// MULTILINGUAL DASHBOARD TRANSLATION DICTIONARY
// -------------------------------------------------------------

const UI_TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    agents_squad: "AI Agents Squad",
    ai_agent: "AI Command Center",
    orders: "Orders & WhatsApp",
    inventory: "Inventory & Stockout",
    invoices: "Invoices & Payments",
    suppliers: "Suppliers & Matrix",
    approvals: "Owner Approvals",
    title_dashboard: "Operational Command Dashboard",
    total_orders: "Total Orders",
    pending_orders: "Pending Orders",
    stockout_risk: "Stockout Risk",
    cash_collected: "Cash Collected",
    overdue_amount: "Overdue Amount",
    runway_days: "Cash Runway"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    agents_squad: "एआई एजेंट दस्ता",
    ai_agent: "एआई कमांड सेंटर",
    orders: "ऑर्डर और व्हाट्सएप",
    inventory: "इन्वेंट्री और स्टॉक",
    invoices: "चालान और भुगतान",
    suppliers: "सप्लायर्स मैट्रिक्स",
    approvals: "मालिक अनुमोदन",
    title_dashboard: "बिजनेस ऑपरेशंस डैशबोर्ड",
    total_orders: "कुल ऑर्डर",
    pending_orders: "लंबित ऑर्डर",
    stockout_risk: "स्टॉक खत्म होने का जोखिम",
    cash_collected: "प्राप्त नकद",
    overdue_amount: "बकाया राशि",
    runway_days: "कैश रनवे"
  },
  te: {
    dashboard: "డ్యాష్‌బోర్డ్",
    agents_squad: "ఏఐ ఏజెంట్ల స్క్వాడ్",
    ai_agent: "ఏఐ కమాండ్ సెంటర్",
    orders: "ఆర్డర్లు & వాట్సాప్",
    inventory: "ఇన్వెంటరీ & స్టాక్",
    invoices: "ఇన్‌వాయిస్‌లు & చెల్లింపులు",
    suppliers: "సరఫరాదారులు",
    approvals: "యజమాని ఆమోదాలు",
    title_dashboard: "వ్యాపార కార్యకలాపాల డ్యాష్‌బోర్డ్",
    total_orders: "మొత్తం ఆర్డర్లు",
    pending_orders: "పెండింగ్ ఆర్డర్లు",
    stockout_risk: "స్టాక్ కొరత ప్రమాదం",
    cash_collected: "వసూలైన నగదు",
    overdue_amount: "బకాయి మొత్తం",
    runway_days: "నగదు రన్‌వే"
  },
  kn: {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    agents_squad: "ಎಐ ಏಜೆಂಟ್ ಸ್ಕ್ವಾಡ್",
    ai_agent: "ಎಐ ಕಮಾಂಡ್ ಸೆಂಟರ್",
    orders: "ಆರ್ಡರ್‌ಗಳು & ವಾಟ್ಸಾಪ್",
    inventory: "ದಾಸ್ತಾನು & ಸ್ಟಾಕ್",
    invoices: "ಇನ್‌ವಾಯ್ಸ್‌ಗಳು & ಪಾವತಿಗಳು",
    suppliers: "ಪೂರೈಕೆದಾರರು",
    approvals: "ಮಾಲೀಕರ ಅನುಮೋದನೆಗಳು",
    title_dashboard: "ವ್ಯಾಪಾರ ಕಾರ್ಯಾಚರಣೆಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    total_orders: "ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು",
    pending_orders: "ಬಾಕಿ ಉಳಿದ ಆರ್ಡರ್‌ಗಳು",
    stockout_risk: "ಸ್ಟಾಕ್ ಕೊರತೆ ಎಚ್ಚರಿಕೆ",
    cash_collected: "ಸ್ವೀಕರಿಸಿದ ನಗದು",
    overdue_amount: "ಬಾಕಿ ಮೊತ್ತ",
    runway_days: "ಕ್ಯಾಶ್ ರನ್‌ವೇ"
  },
  ta: {
    dashboard: "டாஷ்போர்டு",
    agents_squad: "AI ஏஜென்ட் படை",
    ai_agent: "AI கட்டளை மையம்",
    orders: "ஆர்டர்கள் & வாட்ஸ்அப்",
    inventory: "சரக்கு & ஸ்டாக்",
    invoices: "விலைப்பட்டியல் & பணம்",
    suppliers: "விற்பனையாளர்கள்",
    approvals: "உரிமையாளர் ஒப்புதல்கள்",
    title_dashboard: "வணிக செயல்பாடுகள் டாஷ்போர்டு",
    total_orders: "மொத்த ஆர்டர்கள்",
    pending_orders: "நிலுவையில் உள்ள ஆர்டர்கள்",
    stockout_risk: "சரக்கு தீரும் அபாயம்",
    cash_collected: "வசூலிக்கப்பட்ட பணம்",
    overdue_amount: "நிலுவைத் தொகை",
    runway_days: "பண இருப்பு நாட்கள்"
  }
};

let currentDashboardLanguage = 'en';

function setDashboardLanguage(lang) {
  currentDashboardLanguage = lang || 'en';
  
  // Highlight active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('bg-slate-800', 'text-white');
    btn.classList.add('text-slate-400');
  });
  const activeBtn = document.getElementById(`lang-btn-${currentDashboardLanguage}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400');
    activeBtn.classList.add('bg-slate-800', 'text-white');
  }

  const dict = UI_TRANSLATIONS[currentDashboardLanguage] || UI_TRANSLATIONS.en;
  
  // Update sidebar nav labels
  const navItems = {
    'dashboard': dict.dashboard,
    'agents-squad': dict.agents_squad,
    'ai-agent': dict.ai_agent,
    'orders': dict.orders,
    'inventory': dict.inventory,
    'invoices': dict.invoices,
    'suppliers': dict.suppliers,
    'approvals': dict.approvals
  };

  for (const [key, label] of Object.entries(navItems)) {
    const btn = document.querySelector(`.nav-btn[data-tab="${key}"] span:not([class*="bg-"])`);
    if (btn) btn.innerText = label;
  }

  const pageTitle = document.getElementById('page-title');
  if (pageTitle && state.activeTab === 'dashboard') {
    pageTitle.innerText = dict.title_dashboard;
  }

  showToast('Language Updated', `Switched UI language to ${currentDashboardLanguage.toUpperCase()}`, 'info');
}

// -------------------------------------------------------------
// 1. INDIC VOICE AI ASSISTANT (SPEECH-TO-TEXT & TTS)
// -------------------------------------------------------------
let voiceRecognition = null;
let isVoiceListening = false;

function toggleVoiceAssistant() {
  if (isVoiceListening) {
    stopVoiceAssistant();
  } else {
    startVoiceAssistant();
  }
}

function startVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Voice Notice', 'Speech Recognition is not supported on this browser. Try Chrome/Edge or type in AI Command Center.', 'warning');
    return;
  }

  try {
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = false;

    // Map language code to speech locale
    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ta': 'ta-IN'
    };
    voiceRecognition.lang = langMap[currentDashboardLanguage] || 'en-IN';

    voiceRecognition.onstart = () => {
      isVoiceListening = true;
      const btn = document.getElementById('voice-assistant-btn');
      const text = document.getElementById('voice-btn-text');
      const pulse = document.getElementById('voice-pulse-ring');
      if (btn) btn.classList.add('bg-rose-600', 'text-white');
      if (text) text.innerText = 'Listening...';
      if (pulse) pulse.classList.remove('hidden');
      showToast('Voice AI Listening', `Speak now in ${currentDashboardLanguage.toUpperCase()}...`, 'info');
    };

    voiceRecognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      showToast('Voice Captured', `"${transcript}"`, 'success');
      stopVoiceAssistant();

      // Process voice query via backend
      try {
        const res = await fetch('/api/ai/voice-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, language: currentDashboardLanguage })
        });
        const data = await res.json();

        // Switch to AI command center and show answer
        switchTab('ai-agent');
        const queryInput = document.getElementById('command-query-input');
        if (queryInput) queryInput.value = transcript;

        const container = document.getElementById('command-center-conversation');
        if (container) {
          const userMsg = document.createElement('div');
          userMsg.className = 'p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white max-w-lg self-end ml-auto';
          userMsg.innerHTML = `<span class="text-[10px] text-rose-400 font-mono block mb-1">🎙️ VOICE QUERY (${data.detected_language.toUpperCase()}):</span>${transcript}`;
          container.appendChild(userMsg);

          const aiMsg = document.createElement('div');
          aiMsg.className = 'p-4 bg-brand-950/60 border border-brand-500/40 rounded-xl text-xs text-slate-200 max-w-xl self-start space-y-2';
          aiMsg.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-emerald-400 font-mono font-bold">🤖 BIZPILOT AI VOICE ANSWER:</span>
              <button onclick="speakText('${encodeURIComponent(data.voice_script)}')" class="text-brand-300 hover:text-white text-[10px] flex items-center gap-1 font-mono cursor-pointer">
                <i data-lucide="volume-2" class="w-3 h-3"></i> Replay Voice
              </button>
            </div>
            <p class="leading-relaxed text-white">${data.answer}</p>
          `;
          container.appendChild(aiMsg);
          container.scrollTop = container.scrollHeight;
          if (window.lucide) lucide.createIcons();
        }

        // Speak aloud using Browser Speech Synthesis
        speakText(data.voice_script);

      } catch (err) {
        showToast('Voice Query Error', err.message, 'error');
      }
    };

    voiceRecognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      stopVoiceAssistant();
      showToast('Voice Input Notice', `Microphone event: ${e.error}`, 'warning');
    };

    voiceRecognition.onend = () => {
      stopVoiceAssistant();
    };

    voiceRecognition.start();
  } catch (err) {
    stopVoiceAssistant();
    showToast('Voice Error', err.message, 'error');
  }
}

function stopVoiceAssistant() {
  isVoiceListening = false;
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch(e) {}
  }
  const btn = document.getElementById('voice-assistant-btn');
  const text = document.getElementById('voice-btn-text');
  const pulse = document.getElementById('voice-pulse-ring');
  if (btn) btn.classList.remove('bg-rose-600', 'text-white');
  if (text) text.innerText = 'Voice AI';
  if (pulse) pulse.classList.add('hidden');
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  const decoded = decodeURIComponent(text);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(decoded);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// -------------------------------------------------------------
// 2. "WHAT-IF" DIGITAL TWIN SIMULATOR ENGINE
// -------------------------------------------------------------
function updateWhatIfSliders() {
  const demand = parseFloat(document.getElementById('slider-demand')?.value || 2.0);
  const lead = parseInt(document.getElementById('slider-lead')?.value || 3);
  const delay = parseInt(document.getElementById('slider-delay')?.value || 7);

  const demandLabel = document.getElementById('slider-demand-val');
  if (demandLabel) {
    const pct = Math.round((demand - 1.0) * 100);
    demandLabel.innerText = `${pct >= 0 ? '+' : ''}${pct}% (${demand}x)`;
  }

  const leadLabel = document.getElementById('slider-lead-val');
  if (leadLabel) leadLabel.innerText = `+${lead} Days Delay`;

  const delayLabel = document.getElementById('slider-delay-val');
  if (delayLabel) delayLabel.innerText = `+${delay} Days Lag`;
}

async function runWhatIfSimulation() {
  const demand = parseFloat(document.getElementById('slider-demand')?.value || 2.0);
  const lead = parseInt(document.getElementById('slider-lead')?.value || 3);
  const delay = parseInt(document.getElementById('slider-delay')?.value || 7);

  try {
    const res = await fetch('/api/simulator/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        demand_multiplier: demand,
        lead_time_added_days: lead,
        collection_delay_days: delay
      })
    });
    const data = await res.json();

    // Update KPIs
    const s = data.summary;
    const resScoreEl = document.getElementById('sim-kpi-resilience');
    const resVerdictEl = document.getElementById('sim-kpi-verdict');
    const resBarEl = document.getElementById('sim-kpi-bar');
    const stockoutsEl = document.getElementById('sim-kpi-stockouts');
    const budgetEl = document.getElementById('sim-kpi-budget');
    const runwayEl = document.getElementById('sim-kpi-runway');

    if (resScoreEl) resScoreEl.innerText = `${s.resilience_score}%`;
    if (resVerdictEl) resVerdictEl.innerText = s.verdict;
    if (resBarEl) resBarEl.style.width = `${s.resilience_score}%`;
    if (stockoutsEl) stockoutsEl.innerText = `${s.critical_stockout_skus} / 10`;
    if (budgetEl) budgetEl.innerText = `₹${s.total_contingency_po_budget_needed.toLocaleString('en-IN')}`;
    if (runwayEl) runwayEl.innerText = `${s.projected_cash_runway_days} Days`;

    // Populate SKU Table
    const tbody = document.getElementById('whatif-skus-table-body');
    if (tbody && data.skus) {
      tbody.innerHTML = data.skus.map(sku => `
        <tr class="${sku.risk_status === 'CRITICAL' ? 'bg-rose-950/20' : (sku.risk_status === 'WARNING' ? 'bg-amber-950/10' : '')}">
          <td class="py-3 px-4 text-white font-semibold">${sku.name}</td>
          <td class="py-3 px-4 font-mono text-slate-300">${sku.current_stock} units</td>
          <td class="py-3 px-4 font-mono text-emerald-400 font-bold">${sku.simulated_sales_rate} /day</td>
          <td class="py-3 px-4 font-mono text-slate-400">${sku.simulated_lead_time_days} days</td>
          <td class="py-3 px-4 font-mono font-bold ${sku.simulated_days_to_stockout <= sku.simulated_lead_time_days ? 'text-rose-400' : 'text-slate-200'}">
            ${sku.simulated_days_to_stockout} days
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              sku.risk_status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              (sku.risk_status === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
            }">
              ${sku.risk_status}
            </span>
          </td>
          <td class="py-3 px-4 text-right font-mono font-bold text-amber-300">
            ${sku.contingency_reorder_qty > 0 ? `+${sku.contingency_reorder_qty} units (₹${sku.contingency_po_cost.toLocaleString('en-IN')})` : '<span class="text-slate-500 font-normal">Sufficient</span>'}
          </td>
        </tr>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('What-If simulation error:', err);
  }
}

// -------------------------------------------------------------
// 3. DYNAMIC SCANNABLE UPI QR MODAL & INSTANT RECONCILIATION
// -------------------------------------------------------------
let activeUpiInvoiceId = null;

function openUpiModal(invId, amount, customerName) {
  activeUpiInvoiceId = invId;
  const modal = document.getElementById('upi-qr-modal');
  const amountEl = document.getElementById('upi-modal-amount');
  const invEl = document.getElementById('upi-modal-inv');
  const qrContainer = document.getElementById('upi-qrcode-container');

  if (amountEl) amountEl.innerText = `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  if (invEl) invEl.innerText = invId;

  if (qrContainer) {
    qrContainer.innerHTML = '';
    const upiUri = `upi://pay?pa=bizpilot@icici&pn=Sri%20Lakshmi%20Electronics&am=${amount}&tr=${invId}&tn=Invoice%20Payment`;
    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: upiUri,
        width: 180,
        height: 180,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeUpiModal() {
  const modal = document.getElementById('upi-qr-modal');
  if (modal) modal.classList.add('hidden');
  activeUpiInvoiceId = null;
}

async function executeSimulatedInvoicePayment() {
  if (!activeUpiInvoiceId) return;

  try {
    const res = await fetch(`/api/invoices/${activeUpiInvoiceId}/pay-simulate`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Payment Verified! 🎉', `₹${data.amount.toLocaleString('en-IN')} received via UPI for ${data.invoice_id}. Cash runway updated!`, 'success');
      closeUpiModal();
      await fetchAllData();
      switchTab('invoices');
    }
  } catch (err) {
    showToast('Payment Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// 4. PROFESSIONAL GST TAX E-INVOICE GENERATOR
// -------------------------------------------------------------
async function openGstInvoiceModal(invId) {
  try {
    const inv = (state.invoices || []).find(i => i.id === invId);
    const order = (state.orders || []).find(o => o.id === inv?.order_id) || (state.orders && state.orders[0]) || {};

    const modal = document.getElementById('gst-invoice-modal');
    document.getElementById('gst-doc-inv-id').innerText = invId;
    document.getElementById('gst-doc-date').innerText = inv ? inv.created_date : new Date().toLocaleDateString('en-GB');
    document.getElementById('gst-doc-cust-name').innerText = inv ? inv.customer_name : 'Customer';
    document.getElementById('gst-doc-cust-channel').innerText = `${order.channel || 'WhatsApp'} Channel / Order ${order.id || 'N/A'}`;
    
    const statusEl = document.getElementById('gst-doc-status');
    if (statusEl && inv) {
      statusEl.innerText = inv.status;
      statusEl.className = inv.status === 'Paid' ? 
        'bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2 py-0.5 rounded font-bold border border-emerald-500/30' :
        'bg-amber-500/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded font-bold border border-amber-500/30';
    }

    // Tax breakdown calculation
    const taxRes = await fetch(`/api/agents/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 'agent_gst_tax',
        task_name: 'calculate_gst_invoice_breakdown',
        payload: { order_id: order.id, is_interstate: false }
      })
    });
    const taxData = await taxRes.json();
    const result = taxData.result || {};
    const summary = result.summary || {};

    document.getElementById('gst-doc-taxable').innerText = `₹${(summary.total_taxable_value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('gst-doc-cgst').innerText = `₹${(summary.total_cgst || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('gst-doc-sgst').innerText = `₹${(summary.total_sgst || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('gst-doc-total').innerText = `₹${(summary.invoice_total || (inv ? inv.amount : 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    const tbody = document.getElementById('gst-doc-items-tbody');
    if (tbody) {
      const items = result.items && result.items.length > 0 ? result.items : [
        { name: 'Boat BassHeads Earphones', hsn: '85183000', quantity: 2, taxable_value: 1184.75, cgst: 106.63, sgst: 106.63, gross_amount: 1398.0 },
        { name: '65W Fast GaN Charger (Type-C)', hsn: '85044090', quantity: 3, taxable_value: 3302.54, cgst: 297.23, sgst: 297.23, gross_amount: 3897.0 }
      ];

      tbody.innerHTML = items.map(it => `
        <tr>
          <td class="py-2.5 px-3 text-white">${it.name}</td>
          <td class="py-2.5 px-3 font-mono text-slate-400">${it.hsn}</td>
          <td class="py-2.5 px-3 text-center font-mono">${it.quantity}</td>
          <td class="py-2.5 px-3 text-right font-mono">₹${it.taxable_value.toFixed(2)}</td>
          <td class="py-2.5 px-3 text-right font-mono text-teal-400">₹${it.cgst.toFixed(2)}</td>
          <td class="py-2.5 px-3 text-right font-mono text-teal-400">₹${it.sgst.toFixed(2)}</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-white">₹${it.gross_amount.toFixed(2)}</td>
        </tr>
      `).join('');
    }

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('GST Bill Error', err.message, 'error');
  }
}

function closeGstInvoiceModal() {
  const modal = document.getElementById('gst-invoice-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// 5. CUSTOMER KHATA (CREDIT LEDGER) REMINDER DISPATCHER
// -------------------------------------------------------------
let activeKhataInvoiceId = null;
let activeKhataTone = 'polite';
let activeKhataLang = 'en';

async function openKhataReminderModal(invId, customerName, amount, daysOverdue = 3) {
  activeKhataInvoiceId = invId;
  activeKhataTone = 'polite';
  activeKhataLang = currentDashboardLanguage || 'en';

  const modal = document.getElementById('khata-reminder-modal');
  const custEl = document.getElementById('khata-modal-customer');
  const invEl = document.getElementById('khata-modal-inv');
  const amtEl = document.getElementById('khata-modal-amount');

  if (custEl) custEl.innerText = customerName || 'Customer';
  if (invEl) invEl.innerText = `${invId} (${daysOverdue}d overdue)`;
  if (amtEl) amtEl.innerText = `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  setKhataTone('polite', false);
  setKhataLanguage(activeKhataLang, false);
  await updateKhataMessagePreview();

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeKhataModal() {
  const modal = document.getElementById('khata-reminder-modal');
  if (modal) modal.classList.add('hidden');
  activeKhataInvoiceId = null;
}

function setKhataTone(tone, reload = true) {
  activeKhataTone = tone;
  ['polite', 'formal', 'urgent'].forEach(t => {
    const btn = document.getElementById(`khata-tone-${t}`);
    if (btn) {
      if (t === tone) {
        btn.className = 'p-2.5 rounded-xl border bg-brand-950/80 border-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer';
      } else {
        btn.className = 'p-2.5 rounded-xl border bg-surface-950 border-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer';
      }
    }
  });

  if (reload) updateKhataMessagePreview();
}

function setKhataLanguage(lang, reload = true) {
  activeKhataLang = lang;
  ['en', 'te', 'hi', 'kn', 'ta'].forEach(l => {
    const btn = document.getElementById(`khata-lang-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = 'px-2.5 py-1 rounded-lg border bg-brand-950/80 border-brand-500 text-brand-200 text-xs font-medium cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg border bg-surface-950 border-slate-800 text-slate-400 hover:text-white text-xs font-medium cursor-pointer';
      }
    }
  });

  if (reload) updateKhataMessagePreview();
}

async function updateKhataMessagePreview() {
  const textarea = document.getElementById('khata-message-preview');
  if (!textarea || !activeKhataInvoiceId) return;

  textarea.value = 'Generating intelligent localized Khata reminder...';

  try {
    const res = await fetch('/api/agents/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 'agent_cashflow',
        task_name: 'generate_khata_reminder',
        payload: {
          invoice_id: activeKhataInvoiceId,
          tone: activeKhataTone,
          language: activeKhataLang
        }
      })
    });
    const data = await res.json();
    if (data.result && data.result.formatted_reminder_message) {
      textarea.value = data.result.formatted_reminder_message;
    }
  } catch (err) {
    textarea.value = `Hi! Gentle reminder regarding invoice ${activeKhataInvoiceId}. Kindly settle via UPI: upi://pay?pa=bizpilot@icici Thank you!`;
  }
}

async function dispatchKhataReminder(channel = 'telegram') {
  if (!activeKhataInvoiceId) return;

  try {
    const res = await fetch('/api/khata/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_id: activeKhataInvoiceId,
        tone: activeKhataTone,
        language: activeKhataLang,
        channel: channel
      })
    });
    const data = await res.json();
    if (data.status === 'COMPLETED') {
      showToast('Khata Reminder Sent! 🚀', `Dispatched ${activeKhataTone} reminder in ${activeKhataLang.toUpperCase()} for ${activeKhataInvoiceId} via ${channel.toUpperCase()}!`, 'success');
      closeKhataModal();
      await fetchAllData();
    }
  } catch (err) {
    showToast('Dispatch Error', err.message, 'error');
  }
}

function copyKhataMessage() {
  const textarea = document.getElementById('khata-message-preview');
  if (!textarea) return;
  navigator.clipboard.writeText(textarea.value);
  showToast('Copied to Clipboard', 'Khata reminder text ready to paste in WhatsApp/SMS.', 'info');
}

// -------------------------------------------------------------
// 1. MULTI-BRANCH INVENTORY REBALANCING & TELEPORTATION
// -------------------------------------------------------------
async function loadMultiBranchData() {
  const container = document.getElementById('branch-rebalance-container');
  if (!container) return;

  try {
    const res = await fetch('/api/inventory/multi-branch');
    const data = await res.json();

    if (!data.transfer_recommendations || data.transfer_recommendations.length === 0) {
      container.innerHTML = `
        <div class="col-span-2 p-4 bg-surface-950 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
          ✅ All 3 branch outlets are optimally balanced. No inter-branch arbitrage transfer required at this moment.
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    data.transfer_recommendations.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl bg-surface-950 border border-purple-500/40 flex flex-col justify-between space-y-3';
      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${rec.product_name}</span>
            <span class="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-purple-500/30">Capital Saved: ₹${rec.working_capital_preserved.toLocaleString('en-IN')}</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">${rec.recommendation}</p>
          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800 font-mono">
            <div>
              <span class="text-slate-400 block">Transfer ETA</span>
              <span class="text-emerald-400 font-semibold">${rec.transfer_time}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Courier Cost</span>
              <span class="text-purple-300 font-semibold">₹${rec.courier_logistics_cost} (Porter)</span>
            </div>
          </div>
        </div>
        <button onclick="executeBranchTransfer('${rec.transfer_id}', '${rec.product_id}', ${rec.transfer_quantity}, '${rec.source_branch_name}', '${rec.target_branch_name}')" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer">
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
          <span>🚀 Execute Inter-Store Transfer (${rec.transfer_quantity} Units)</span>
        </button>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error loading multi-branch data:', err);
  }
}

async function executeBranchTransfer(transferId, productId, qty, src, tgt) {
  try {
    const res = await fetch('/api/inventory/rebalance-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transfer_id: transferId,
        product_id: productId,
        quantity: qty,
        source_branch: src,
        target_branch: tgt
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Stock Teleported! 🚚', data.message, 'success');
      await fetchAllData();
      await loadMultiBranchData();
    }
  } catch (err) {
    showToast('Transfer Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// 2. AUTONOMOUS B2B VENDOR PRICE NEGOTIATION
// -------------------------------------------------------------
let activeNegotiationData = null;

async function openNegotiationModal(productName = 'Boat BassHeads Earphones', supplierName = 'ABC Electronics Distributors', unitPrice = 425.0, qty = 20) {
  const modal = document.getElementById('negotiate-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  try {
    const res = await fetch('/api/procurement/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_name: productName,
        supplier_name: supplierName,
        initial_unit_price: unitPrice,
        quantity: qty,
        payment_terms: 'Immediate UPI Settlement',
        lifetime_purchases_count: 15,
        target_discount_pct: 7.5
      })
    });
    const data = await res.json();
    activeNegotiationData = data;

    document.getElementById('nego-initial-price').innerText = `₹${data.initial_unit_price.toFixed(2)} / unit`;
    document.getElementById('nego-initial-total').innerText = `Total: ₹${data.initial_total_cost.toLocaleString('en-IN')}`;
    document.getElementById('nego-counter-price').innerText = `₹${data.counter_unit_price.toFixed(2)} / unit`;
    document.getElementById('nego-counter-total').innerText = `Total: ₹${data.counter_total_cost.toLocaleString('en-IN')} (-${data.discount_percentage}%)`;
    document.getElementById('nego-margin-saved').innerText = `+₹${data.margin_saved.toLocaleString('en-IN')}`;

    const levContainer = document.getElementById('nego-leverage-container');
    levContainer.innerHTML = '';
    data.leverage_points.forEach(lp => {
      const div = document.createElement('div');
      div.className = 'p-2 rounded-lg bg-surface-950 border border-slate-800 text-slate-300 flex items-center gap-2';
      div.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span><span>${lp}</span>`;
      levContainer.appendChild(div);
    });

    document.getElementById('nego-message-preview').value = data.proposal_message;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('Negotiation Error', err.message, 'error');
  }
}

function closeNegotiationModal() {
  const modal = document.getElementById('negotiate-modal');
  if (modal) modal.classList.add('hidden');
}

function copyNegotiationProposal() {
  const textarea = document.getElementById('nego-message-preview');
  if (textarea) {
    navigator.clipboard.writeText(textarea.value);
    showToast('Proposal Copied! 📋', 'Vendor bargaining proposal ready to paste in WhatsApp.', 'info');
  }
}

function simulateVendorAcceptance() {
  if (!activeNegotiationData) return;
  showToast('Vendor Accepted Counter-Offer! 🎉', `Supplier confirmed ₹${activeNegotiationData.counter_unit_price}/unit. Saved ₹${activeNegotiationData.margin_saved} in purchase margin!`, 'success');
  closeNegotiationModal();
  fetchAllData();
}

// -------------------------------------------------------------
// 3. PHYSICAL BILL & HANDWRITTEN CHITTI OCR DIGITIZER
// -------------------------------------------------------------
const OCR_PRESETS = {
  charni_road: `Charni Road Wholesale Electronics Hub
Challan Date: 22-Aug-2026
Items:
20 pcs Boat BassHeads Earphones @ 410.00
10 pcs 65W GaN Fast Charger @ 810.00
30 pcs Type-C Braided Cable @ 170.00
Tax: CGST 9% SGST 9%`,
  sp_road: `SP Road Electronic Market Bengaluru
Date: 23-Aug-2026 | Challan #BLR-9901
Items:
15 pcs OnePlus Nord Buds 2 @ 1850.00
10 pcs Fastrack Smartwatch @ 1520.00
40 pcs Type-C Braided Cable @ 165.00
Payment: UPI / Immediate`,
  nehru_place: `Nehru Place Hardware & Storage Hub
Challan #NP-4421 | Delhi
Items:
25 pcs SanDisk 128GB MicroSD Card @ 610.00
5 pcs Redmi Note 13 5G Smartphone @ 13900.00
15 pcs Mi 20000mAh Power Bank @ 1420.00
GST Verified Input Tax Credit Claimable`
};

let activeParsedOcrBill = null;

function openOcrModal() {
  const modal = document.getElementById('ocr-bill-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  loadOcrPreset('charni_road');
  if (window.lucide) lucide.createIcons();
}

function closeOcrModal() {
  const modal = document.getElementById('ocr-bill-modal');
  if (modal) modal.classList.add('hidden');
}

function loadOcrPreset(key) {
  const textarea = document.getElementById('ocr-raw-text');
  if (textarea && OCR_PRESETS[key]) {
    textarea.value = OCR_PRESETS[key];
  }
}

async function runOcrDigitization() {
  const rawText = document.getElementById('ocr-raw-text').value;
  if (!rawText.trim()) return;

  try {
    const res = await fetch('/api/ocr/digitize-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bill_text: rawText })
    });
    const data = await res.json();
    activeParsedOcrBill = data;

    document.getElementById('ocr-result-container').classList.remove('hidden');
    document.getElementById('ocr-commit-btn').classList.remove('hidden');
    document.getElementById('ocr-supplier-display').innerText = `${data.supplier_name} (${data.bill_number})`;
    document.getElementById('ocr-itc-display').innerText = `ITC Claimable: ₹${data.input_tax_credit_claimable.toLocaleString('en-IN')}`;

    const tbody = document.getElementById('ocr-items-table-body');
    tbody.innerHTML = '';
    data.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2.5 font-bold text-white">${item.product_name}</td>
        <td class="p-2.5 font-mono text-slate-200">${item.quantity} units</td>
        <td class="p-2.5 font-mono text-slate-300">₹${item.unit_cost_price.toFixed(2)}</td>
        <td class="p-2.5 font-mono font-bold text-emerald-400">₹${item.line_total.toLocaleString('en-IN')}</td>
        <td class="p-2.5 font-mono text-teal-400 font-semibold">${item.confidence_score}%</td>
      `;
      tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('OCR Error', err.message, 'error');
  }
}

async function commitOcrBillToInventory() {
  if (!activeParsedOcrBill) return;

  try {
    const res = await fetch('/api/ocr/commit-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeParsedOcrBill)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Inventory Updated from Bill! 📦', `${data.message} Recorded ₹${data.itc_claimed} ITC.`, 'success');
      closeOcrModal();
      await fetchAllData();
    }
  } catch (err) {
    showToast('Commit Error', err.message, 'error');
  }
}

// -------------------------------------------------------------
// 4. 'WHILE YOU SLEPT' 24-HOUR AUTONOMOUS SHIFT SIMULATOR
// -------------------------------------------------------------
async function openNightShiftModal() {
  const modal = document.getElementById('night-shift-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  await runNightShiftSimulation();
}

function closeNightShiftModal() {
  const modal = document.getElementById('night-shift-modal');
  if (modal) modal.classList.add('hidden');
}

async function runNightShiftSimulation() {
  const timelineContainer = document.getElementById('night-shift-timeline');
  if (!timelineContainer) return;

  timelineContainer.innerHTML = `<div class="text-slate-400 text-xs py-4 flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin text-purple-400"></i> Accelerating 24-hour operations shift in 5.0 seconds...</div>`;
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch('/api/simulator/night-shift', { method: 'POST' });
    const data = await res.json();

    timelineContainer.innerHTML = '';
    
    // Animate items one by one with 300ms delay for live time machine feeling
    for (let i = 0; i < data.timeline.length; i++) {
      const item = data.timeline[i];
      const div = document.createElement('div');
      div.className = 'relative group';
      div.innerHTML = `
        <div class="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-surface-900"></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-slate-800 hover:border-purple-500/50 transition space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-mono text-purple-400 text-[11px] font-bold">${item.time}</span>
              <span class="text-white font-bold text-xs">${item.title}</span>
            </div>
            <span class="font-mono text-emerald-400 font-bold text-[11px]">${item.financial_impact}</span>
          </div>
          <p class="text-slate-300 text-[11px] leading-relaxed">${item.detail}</p>
          <div class="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
            <span class="px-1.5 py-0.2 rounded bg-surface-900 border border-slate-800 text-slate-400">${item.agent_name}</span>
            <span>•</span>
            <span>Phase: ${item.phase}</span>
          </div>
        </div>
      `;
      timelineContainer.appendChild(div);
      await new Promise(r => setTimeout(r, 200));
    }

    if (window.lucide) lucide.createIcons();
    showToast('Autonomous 24h Shift Complete! 🌙', 'All 8 autonomous operations executed with zero human friction.', 'success');
  } catch (err) {
    showToast('Simulation Error', err.message, 'error');
  }
}



