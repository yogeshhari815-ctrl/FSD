import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  Mail,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Star,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const pages = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "suppliers", label: "Suppliers", icon: Building2 },
  { id: "orders", label: "Purchase orders", icon: ClipboardList },
  { id: "performance", label: "Performance", icon: BarChart3 }
];
const pageTitles = {
  overview: "Overview",
  suppliers: "Supplier directory",
  orders: "Purchase orders",
  performance: "Vendor performance"
};
const statuses = ["Pending", "Active", "Under review", "At risk"];
const transitions = {
  Draft: ["Submitted", "Cancelled"],
  Submitted: ["Approved", "Cancelled"],
  Approved: ["In transit", "Cancelled"],
  "In transit": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: []
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "The request could not be completed.");
  }
  return response.status === 204 ? null : response.json();
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function shortDate(value) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--";
}

function initials(name = "Vendor") {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function StatusPill({ value }) {
  const tone = String(value || "pending").toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill status-${tone}`}>{value || "Pending"}</span>;
}

function Metric({ icon: Icon, label, value, detail, trend, tone = "green" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon icon-${tone}`}><Icon size={18} strokeWidth={1.8} /></div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        {trend ? <span className="trend"><ArrowUpRight size={14} />{trend}</span> : <span className="trend-muted">Portfolio total</span>}
        <span>{detail}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, detail, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><FileText size={20} /></div>
      <strong>{title}</strong>
      <span>{detail}</span>
      {action}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("overview");
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formType, setFormType] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const searchInputRef = useRef(null);

  async function refresh(showLoading = false) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const [supplierData, orderData] = await Promise.all([
        request("/suppliers"),
        request("/orders")
      ]);
      setSuppliers(supplierData);
      setOrders(orderData);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(true);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const supplierSpend = suppliers.reduce((sum, supplier) => sum + (supplier.spend || 0), 0);
  const openOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const pendingSuppliers = suppliers.filter((supplier) => supplier.status === "Pending");
  const attentionOrders = orders.filter((order) => ["Submitted", "In transit"].includes(order.status));
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === "Active");
  const avgRating = activeSuppliers.length
    ? activeSuppliers.reduce((sum, supplier) => sum + (supplier.rating || 0), 0) / activeSuppliers.length
    : 0;

  const visibleSuppliers = useMemo(() => suppliers.filter((supplier) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [supplier.name, supplier.category, supplier.contactName, supplier.email]
      .some((value) => String(value || "").toLowerCase().includes(term));
    const matchesStatus = supplierFilter === "All" || supplier.status === supplierFilter;
    return matchesSearch && matchesStatus;
  }), [suppliers, search, supplierFilter]);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [order.orderNumber, order.title, order.supplier?.name]
      .some((value) => String(value || "").toLowerCase().includes(term));
    const matchesStatus = orderFilter === "All" || order.status === orderFilter;
    return matchesSearch && matchesStatus;
  }), [orders, search, orderFilter]);

  const categories = useMemo(() => {
    const totals = new Map();
    suppliers.forEach((supplier) => totals.set(supplier.category, (totals.get(supplier.category) || 0) + (supplier.spend || 0)));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [suppliers]);

  async function changeSupplierStatus(supplier, status) {
    try {
      await request(`/suppliers/${supplier._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await refresh();
      setNotice(`${supplier.name} updated to ${status.toLowerCase()}.`);
    } catch (updateError) {
      setNotice(updateError.message);
    }
  }

  async function changeOrderStatus(order, status) {
    try {
      await request(`/orders/${order._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await refresh();
      setNotice(`${order.orderNumber} moved to ${status.toLowerCase()}.`);
    } catch (updateError) {
      setNotice(updateError.message);
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    setFormBusy(true);
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    if (formType === "order") payload.amount = Number(payload.amount);
    try {
      await request(formType === "supplier" ? "/suppliers" : "/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refresh();
      setFormType("");
      setNotice(formType === "supplier" ? "Supplier onboarding submitted." : "Purchase order created.");
    } catch (submitError) {
      setNotice(submitError.message);
    } finally {
      setFormBusy(false);
    }
  }

  function goTo(page) {
    setActivePage(page);
    setSearch("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => goTo("overview")}>
          <span className="brand-mark"><PackageCheck size={21} /></span>
          <span>fieldwork<span className="brand-period">.</span><small>SUPPLIER OPERATIONS</small></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy"><strong>Northstar Group</strong><small>Procurement team</small></span>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav className="main-nav" aria-label="Main navigation">
          {pages.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-link ${activePage === id ? "nav-link-active" : ""}`} onClick={() => goTo(id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "suppliers" && pendingSuppliers.length > 0 && <span className="nav-count">{pendingSuppliers.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <div className="help-mark"><CircleAlert size={16} /></div>
          <strong>Need a hand?</strong>
          <span>Talk to your procurement admin.</span>
          <a href="mailto:procurement@example.com">Contact support <ArrowUpRight size={13} /></a>
        </div>
        <div className="profile-button">
          <span className="profile-avatar">AM</span>
          <span className="profile-copy"><strong>Alex Morgan</strong><small>Procurement lead</small></span>
          <ChevronDown size={15} />
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>{pageTitles[activePage]}</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendors or orders" />
              <kbd>Ctrl K</kbd>
            </label>
            <button className="icon-button notification-button" aria-label="Review pending suppliers" title="Review pending suppliers" onClick={() => { goTo("suppliers"); setSupplierFilter("Pending"); }}><Bell size={18} />{pendingSuppliers.length > 0 && <span />}</button>
            <span className="topbar-divider" />
            <span className="today-label">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="connection-banner" role="alert">
              <CircleAlert size={17} />
              <span><strong>Could not load procurement data.</strong> {error} Check that the API and MongoDB are running.</span>
              <button onClick={() => refresh(true)}><RefreshCw size={15} /> Retry</button>
            </div>
          )}

          {activePage === "overview" && (
            <OverviewPage
              suppliers={suppliers}
              orders={orders}
              supplierSpend={supplierSpend}
              openOrders={openOrders}
              activeSuppliers={activeSuppliers}
              pendingSuppliers={pendingSuppliers}
              attentionOrders={attentionOrders}
              avgRating={avgRating}
              categories={categories}
              loading={loading}
              onPageChange={goTo}
              onCreateOrder={() => setFormType("order")}
            />
          )}
          {activePage === "suppliers" && (
            <SuppliersPage
              suppliers={visibleSuppliers}
              total={suppliers.length}
              loading={loading}
              filter={supplierFilter}
              setFilter={setSupplierFilter}
              onStatusChange={changeSupplierStatus}
              onAdd={() => setFormType("supplier")}
            />
          )}
          {activePage === "orders" && (
            <OrdersPage
              orders={visibleOrders}
              total={orders.length}
              loading={loading}
              filter={orderFilter}
              setFilter={setOrderFilter}
              onStatusChange={changeOrderStatus}
              onAdd={() => setFormType("order")}
            />
          )}
          {activePage === "performance" && (
            <PerformancePage suppliers={suppliers} loading={loading} search={search} />
          )}
        </div>
      </main>

      {formType && (
        <FormDialog
          type={formType}
          suppliers={activeSuppliers}
          busy={formBusy}
          onClose={() => setFormType("")}
          onSubmit={submitForm}
        />
      )}
      {notice && <div className="toast" role="status"><Check size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

function OverviewPage({ suppliers, orders, supplierSpend, openOrders, activeSuppliers, pendingSuppliers, attentionOrders, avgRating, categories, loading, onPageChange, onCreateOrder }) {
  const recentOrders = [...orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)).slice(0, 5);
  const maxCategorySpend = Math.max(...categories.map((item) => item[1]), 1);

  return (
    <>
      <section className="page-heading overview-heading">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()} <span className="eyebrow-dot" /> PROCUREMENT OVERVIEW</p>
          <h1>Good morning, Alex<span className="heading-period">.</span></h1>
          <p className="heading-subtitle">A clear view of your supplier network and what needs attention.</p>
        </div>
        <button className="button button-primary" onClick={onCreateOrder}><Plus size={17} /> New purchase order</button>
      </section>

      <section className="metrics-grid" aria-label="Procurement summary">
        <Metric icon={Building2} label="Active suppliers" value={loading ? "--" : activeSuppliers.length} detail={`${suppliers.length} in your network`} trend={`${pendingSuppliers.length} to review`} />
        <Metric icon={ClipboardList} label="Open purchase orders" value={loading ? "--" : openOrders.length} detail={`${orders.length} total orders`} tone="blue" />
        <Metric icon={FileText} label="Supplier spend" value={loading ? "--" : currency(supplierSpend)} detail="Across all suppliers" tone="orange" />
        <Metric icon={Star} label="Average supplier rating" value={loading || !activeSuppliers.length ? "--" : `${avgRating.toFixed(1)} / 5`} detail="Active supplier average" tone="yellow" />
      </section>

      <section className="overview-grid">
        <article className="panel spend-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">BY SUPPLIER CATEGORY</p><h2>Spend overview</h2></div>
            <span className="panel-period">All time <ChevronDown size={14} /></span>
          </div>
          {categories.length ? (
            <div className="category-list">
              {categories.map(([name, amount], index) => (
                <div className="category-item" key={name}>
                  <div className="category-meta"><span className={`category-dot category-dot-${index}`} />{name}<strong>{currency(amount)}</strong></div>
                  <div className="category-track"><span className={`category-fill category-fill-${index}`} style={{ width: `${Math.max((amount / maxCategorySpend) * 100, 3)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Spend data will appear here" detail="Add suppliers and purchase orders to see category totals." />}
          <button className="text-link" onClick={() => onPageChange("performance")}>View vendor performance <ArrowUpRight size={14} /></button>
        </article>

        <article className="panel attention-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">YOUR NEXT STEPS</p><h2>Needs attention</h2></div>
            <span className="attention-total">{pendingSuppliers.length + attentionOrders.length}</span>
          </div>
          <button className="attention-row" onClick={() => onPageChange("suppliers")}>
            <span className="attention-icon attention-orange"><Building2 size={17} /></span>
            <span className="attention-copy"><strong>Supplier applications</strong><small>{pendingSuppliers.length ? `${pendingSuppliers.length} waiting for review` : "No applications waiting"}</small></span>
            <ArrowUpRight size={16} />
          </button>
          <button className="attention-row" onClick={() => onPageChange("orders")}>
            <span className="attention-icon attention-blue"><Clock3 size={17} /></span>
            <span className="attention-copy"><strong>Orders in progress</strong><small>{attentionOrders.length ? `${attentionOrders.length} need a status check` : "All orders are up to date"}</small></span>
            <ArrowUpRight size={16} />
          </button>
          <button className="attention-row" onClick={() => onPageChange("performance")}>
            <span className="attention-icon attention-red"><CircleAlert size={17} /></span>
            <span className="attention-copy"><strong>Vendor performance</strong><small>{suppliers.filter((supplier) => supplier.status === "At risk").length} suppliers flagged at risk</small></span>
            <ArrowUpRight size={16} />
          </button>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading recent-heading">
          <div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent purchase orders</h2></div>
          <button className="text-link" onClick={() => onPageChange("orders")}>View all orders <ArrowUpRight size={14} /></button>
        </div>
        {recentOrders.length ? <OrderTable orders={recentOrders} compact onStatusChange={() => {}} readOnly /> : (
          <EmptyState title="No purchase orders yet" detail="Create an order to start tracking procurement." action={<button className="button button-secondary" onClick={onCreateOrder}><Plus size={15} /> Create an order</button>} />
        )}
      </section>
    </>
  );
}

function SuppliersPage({ suppliers, total, loading, filter, setFilter, onStatusChange, onAdd }) {
  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">YOUR SUPPLIER NETWORK</p><h1>Suppliers<span className="heading-period">.</span></h1><p className="heading-subtitle">Onboard partners and keep their details in one place.</p></div>
        <button className="button button-primary" onClick={onAdd}><Plus size={17} /> Add supplier</button>
      </section>
      <div className="list-toolbar">
        <span className="result-count">{loading ? "Loading suppliers..." : `${suppliers.length} of ${total} suppliers`}</span>
        <label className="filter-select"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}>{["All", ...statuses].map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label>
      </div>
      <section className="panel table-panel">
        {suppliers.length ? (
          <div className="table-scroll"><table><thead><tr><th>SUPPLIER</th><th>CONTACT</th><th>PERFORMANCE</th><th>COMPLIANCE</th><th>STATUS</th><th>SPEND</th></tr></thead>
            <tbody>{suppliers.map((supplier) => <SupplierRow key={supplier._id} supplier={supplier} onStatusChange={onStatusChange} />)}</tbody>
          </table></div>
        ) : loading ? <div className="table-loading"><RefreshCw size={17} /> Loading supplier directory...</div> : <EmptyState title="No suppliers match this view" detail="Try a different search or status filter, or add a supplier." action={<button className="button button-secondary" onClick={onAdd}><Plus size={15} /> Add supplier</button>} />}
      </section>
    </>
  );
}

function SupplierRow({ supplier, onStatusChange }) {
  return (
    <tr>
      <td><div className="supplier-cell"><span className={`supplier-avatar avatar-${supplier.name.charCodeAt(0) % 5}`}>{initials(supplier.name)}</span><span className="supplier-info"><strong>{supplier.name}</strong><small>{supplier.category}</small></span></div></td>
      <td><div className="contact-info"><strong>{supplier.contactName}</strong><small><Mail size={12} />{supplier.email}</small></div></td>
      <td><div className="performance-cell"><span className="rating-line"><Star size={13} fill="currentColor" />{supplier.rating ? supplier.rating.toFixed(1) : "--"}</span><small>{supplier.deliveryRate || 0}% on-time</small></div></td>
      <td><StatusPill value={supplier.compliance} /></td>
      <td><label className="status-select-wrap"><span className="sr-only">Update {supplier.name} status</span><select className={`status-select status-select-${String(supplier.status).toLowerCase().replaceAll(" ", "-")}`} value={supplier.status} onChange={(event) => onStatusChange(supplier, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={12} /></label></td>
      <td className="amount-cell">{currency(supplier.spend)}</td>
    </tr>
  );
}

function OrdersPage({ orders, total, loading, filter, setFilter, onStatusChange, onAdd }) {
  const orderStatuses = ["All", ...Object.keys(transitions)];
  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">PROCUREMENT LIFECYCLE</p><h1>Purchase orders<span className="heading-period">.</span></h1><p className="heading-subtitle">Follow every order from submission through delivery.</p></div>
        <button className="button button-primary" onClick={onAdd}><Plus size={17} /> New purchase order</button>
      </section>
      <div className="list-toolbar">
        <span className="result-count">{loading ? "Loading orders..." : `${orders.length} of ${total} purchase orders`}</span>
        <label className="filter-select"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label>
      </div>
      <section className="panel table-panel">
        {orders.length ? <OrderTable orders={orders} onStatusChange={onStatusChange} /> : loading ? <div className="table-loading"><RefreshCw size={17} /> Loading purchase orders...</div> : <EmptyState title="No purchase orders match this view" detail="Create a new order or change your search and filters." action={<button className="button button-secondary" onClick={onAdd}><Plus size={15} /> New purchase order</button>} />}
      </section>
    </>
  );
}

function OrderTable({ orders, onStatusChange, compact = false, readOnly = false }) {
  return (
    <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>SUPPLIER</th><th>AMOUNT</th><th>PLACED</th><th>DUE DATE</th><th>STATUS</th></tr></thead>
      <tbody>{orders.map((order) => {
        const options = [order.status, ...(transitions[order.status] || [])];
        return <tr key={order._id}>
          <td><div className="order-number"><span className="order-mark"><FileText size={14} /></span><span><strong>{order.orderNumber}</strong><small>{order.title}</small></span></div></td>
          <td><div className="order-supplier"><span className="mini-avatar">{initials(order.supplier?.name)}</span>{order.supplier?.name || "Unknown supplier"}</div></td>
          <td className="amount-cell">{currency(order.amount)}</td>
          <td className="date-cell">{shortDate(order.placedAt)}</td>
          <td className="date-cell">{shortDate(order.dueDate)}</td>
          <td>{readOnly ? <StatusPill value={order.status} /> : <label className="status-select-wrap"><span className="sr-only">Update {order.orderNumber} status</span><select className={`status-select status-select-${String(order.status).toLowerCase().replaceAll(" ", "-")}`} value={order.status} disabled={!options.length || options.length === 1} onChange={(event) => onStatusChange(order, event.target.value)}>{options.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={12} /></label>}</td>
        </tr>;
      })}</tbody>
    </table>{compact && <span className="sr-only">Showing the five latest purchase orders</span>}</div>
  );
}

function PerformancePage({ suppliers, loading, search }) {
  const vendors = suppliers.filter((supplier) => !search.trim() || [supplier.name, supplier.category, supplier.contactName]
    .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const active = suppliers.filter((supplier) => supplier.status === "Active");
  const avgDelivery = active.length ? Math.round(active.reduce((sum, supplier) => sum + (supplier.deliveryRate || 0), 0) / active.length) : 0;
  const avgQuality = active.length ? Math.round(active.reduce((sum, supplier) => sum + (supplier.qualityScore || 0), 0) / active.length) : 0;
  const compliantCount = suppliers.filter((supplier) => supplier.compliance === "Compliant").length;

  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">SERVICE & QUALITY</p><h1>Performance<span className="heading-period">.</span></h1><p className="heading-subtitle">Compare supplier delivery, quality, and compliance signals.</p></div>
      </section>
      <section className="performance-summary">
        <article className="performance-stat"><span className="stat-icon stat-green"><PackageCheck size={18} /></span><span className="stat-label">On-time delivery</span><strong>{loading ? "--" : `${avgDelivery}%`}</strong><span className="stat-note">Active supplier average</span></article>
        <article className="performance-stat"><span className="stat-icon stat-blue"><Star size={18} /></span><span className="stat-label">Quality score</span><strong>{loading ? "--" : `${avgQuality}%`}</strong><span className="stat-note">Active supplier average</span></article>
        <article className="performance-stat"><span className="stat-icon stat-orange"><Check size={18} /></span><span className="stat-label">Compliance clear</span><strong>{loading ? "--" : `${compliantCount} / ${suppliers.length}`}</strong><span className="stat-note">Suppliers compliant</span></article>
      </section>
      <div className="performance-title"><div><p className="eyebrow">SUPPLIER SCORECARD</p><h2>Vendor comparison</h2></div><span className="result-count">{vendors.length} suppliers</span></div>
      <section className="panel table-panel performance-table">
        {vendors.length ? <div className="table-scroll"><table><thead><tr><th>SUPPLIER</th><th>RATING</th><th>ON-TIME DELIVERY</th><th>QUALITY</th><th>SPEND</th><th>STATUS</th></tr></thead>
          <tbody>{vendors.map((supplier) => <tr key={supplier._id}>
            <td><div className="supplier-cell"><span className={`supplier-avatar avatar-${supplier.name.charCodeAt(0) % 5}`}>{initials(supplier.name)}</span><span className="supplier-info"><strong>{supplier.name}</strong><small>{supplier.category}</small></span></div></td>
            <td><span className="rating-line"><Star size={13} fill="currentColor" />{supplier.rating ? supplier.rating.toFixed(1) : "--"}</span></td>
            <td><ScoreBar score={supplier.deliveryRate} /></td><td><ScoreBar score={supplier.qualityScore} /></td>
            <td className="amount-cell">{currency(supplier.spend)}</td><td><StatusPill value={supplier.status} /></td>
          </tr>)}</tbody>
        </table></div> : loading ? <div className="table-loading"><RefreshCw size={17} /> Calculating supplier scores...</div> : <EmptyState title="No supplier scores yet" detail="Supplier scorecards will appear as your network is set up." />}
      </section>
      <p className="score-note"><CircleAlert size={14} /> Scores reflect the latest supplier data in your network.</p>
    </>
  );
}

function ScoreBar({ score = 0 }) {
  const tone = score >= 90 ? "score-high" : score >= 80 ? "score-medium" : "score-low";
  return <div className="score-bar-cell"><span className="score-track"><span className={`score-fill ${tone}`} style={{ width: `${Math.min(score, 100)}%` }} /></span><strong>{score || 0}%</strong></div>;
}

function FormDialog({ type, suppliers, busy, onClose, onSubmit }) {
  const isSupplier = type === "supplier";
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="dialog-heading"><span className="dialog-icon">{isSupplier ? <Building2 size={19} /> : <ClipboardList size={19} />}</span><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <p className="eyebrow">{isSupplier ? "SUPPLIER ONBOARDING" : "PROCUREMENT"}</p>
        <h2 id="form-title">{isSupplier ? "Add a supplier" : "Create purchase order"}</h2>
        <p className="dialog-description">{isSupplier ? "Enter the partner details to start their onboarding review." : "Choose an active supplier and set the order amount and due date."}</p>
        <form onSubmit={onSubmit}>
          {isSupplier ? <>
            <label className="form-field">Supplier name<input name="name" placeholder="e.g. Acme Components" required autoFocus /></label>
            <label className="form-field">Category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{["Manufacturing", "Technology", "Office supplies", "Logistics", "Packaging", "Professional services", "Other"].map((category) => <option key={category}>{category}</option>)}</select></label>
            <div className="form-row"><label className="form-field">Contact name<input name="contactName" placeholder="Primary contact" required /></label><label className="form-field">Email address<input name="email" type="email" placeholder="name@company.com" required /></label></div>
            <div className="form-row"><label className="form-field">Phone <span className="optional">Optional</span><input name="phone" type="tel" placeholder="+1 555 0100" /></label><label className="form-field">Location <span className="optional">Optional</span><input name="location" placeholder="City, state" /></label></div>
          </> : <>
            <label className="form-field">Supplier<select name="supplier" required defaultValue=""><option value="" disabled>Select an active supplier</option>{suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}</select></label>
            {!suppliers.length && <p className="form-hint"><CircleAlert size={14} /> Activate a supplier before creating an order.</p>}
            <label className="form-field">Order description<input name="title" placeholder="e.g. Quarterly component supply" required /></label>
            <div className="form-row"><label className="form-field">Amount (USD)<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><label className="form-field">Due date<input name="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label></div>
          </>}
          <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy || (!isSupplier && !suppliers.length)}>{busy ? <><RefreshCw size={15} className="spin" /> Saving...</> : <>{isSupplier ? "Submit for review" : "Create order"}<ArrowUpRight size={15} /></>}</button></div>
        </form>
      </section>
    </div>
  );
}

export default App;