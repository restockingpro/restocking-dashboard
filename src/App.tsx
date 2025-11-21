import { useState } from "react";
import "./App.css";

type Page = "overview" | "links" | "alerts" | "history" | "settings" | "billing";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
};

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {description && <span className="stat-desc">{description}</span>}
    </div>
  );
}

/* -------- RECENT RESTOCKS (OVERVIEW) -------- */

type RestockRow = {
  supplier: string;
  product: string;
  sku: string;
  lastRestock: string;
  status: "Hot" | "Normal" | "Watch";
};

function RestockTable() {
  const rows: RestockRow[] = [
    {
      supplier: "Supplier A",
      product: "Davidoff Cool Water 4.2oz",
      sku: "DCW-42",
      lastRestock: "2 hours ago",
      status: "Hot",
    },
    {
      supplier: "Supplier B",
      product: "Legendary Protein Bar 12ct",
      sku: "LEG-BAR-12",
      lastRestock: "Yesterday",
      status: "Normal",
    },
    {
      supplier: "Supplier C",
      product: "Renpure Shampoo 16oz",
      sku: "REN-16",
      lastRestock: "3 days ago",
      status: "Watch",
    },
  ];

  const getBadgeClass = (status: RestockRow["status"]) => {
    if (status === "Hot") return "badge badge-hot";
    if (status === "Watch") return "badge badge-watch";
    return "badge badge-normal";
  };

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <div>
          <h2>Recent Restocks</h2>
          <p>Latest supplier restocks being tracked by RestocKING.</p>
        </div>
        <button className="btn-secondary">View all</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Last Restock</th>
            <th className="right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku}>
              <td>{row.supplier}</td>
              <td>{row.product}</td>
              <td>{row.sku}</td>
              <td>{row.lastRestock}</td>
              <td className="right">
                <span className={getBadgeClass(row.status)}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------- SIDEBAR / TOPBAR -------- */

type SidebarProps = {
  currentPage: Page;
  onChangePage: (page: Page) => void;
};

const navItems: { label: string; key: Page }[] = [
  { label: "Overview", key: "overview" },
  { label: "Supplier Links", key: "links" },
  { label: "Restock Alerts", key: "alerts" },
  { label: "History", key: "history" },
  { label: "Settings", key: "settings" },
  { label: "Billing", key: "billing" },
];

function Sidebar({ currentPage, onChangePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo-block">
        <div className="logo-icon">🦍</div>
        <div>
          <div className="logo-title">RESTOCKING</div>
          <div className="logo-sub">Restock before everyone else.</div>
        </div>
      </div>
      <nav className="nav">
        {navItems.map((item) => {
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.label}
              className={"nav-item" + (isActive ? " active" : "")}
              onClick={() => onChangePage(item.key)}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">© {new Date().getFullYear()} RestocKING</div>
    </aside>
  );
}

type TopbarProps = { currentPage: Page };

function Topbar({ currentPage }: TopbarProps) {
  let label: string;
  switch (currentPage) {
    case "overview":
      label = "Overview";
      break;
    case "links":
      label = "Supplier Links";
      break;
    case "alerts":
      label = "Restock Alerts";
      break;
    case "history":
      label = "History";
      break;
    case "settings":
      label = "Settings";
      break;
    case "billing":
      label = "Billing";
      break;
    default:
      label = "";
  }

  return (
    <header className="topbar">
      <div className="breadcrumb">
        Dashboard / <span>{label}</span>
      </div>
      <div className="topbar-right">
        <button className="btn-secondary">Get Early Access Link</button>
        <div className="avatar">LP</div>
      </div>
    </header>
  );
}

/* -------- OVERVIEW SECTION -------- */

function OverviewSection() {
  return (
    <>
      <div className="page-header">
        <h1>Restock Overview</h1>
        <p>
          Monitor supplier restocks, act before everyone else and keep your FBA
          always stocked.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard label="Active URLs" value="128" description="Links monitored" />
        <StatCard
          label="Restocks (7 days)"
          value="46"
          description="High-demand products"
        />
        <StatCard label="Suppliers" value="9" description="Active suppliers" />
        <StatCard label="Alerts sent" value="312" description="Notifications" />
      </div>

      <RestockTable />
    </>
  );
}

/* -------- SUPPLIER LINKS SECTION -------- */

type SupplierLink = {
  supplier: string;
  label: string;
  url: string;
  products: string;
  links: number;
  lastRestock: string;
  status: "Stable" | "Hot" | "Watch";
};

const supplierLinks: SupplierLink[] = [
  {
    supplier: "KeHE",
    label: "Snacks & Grocery – Main list",
    url: "https://portal.kehe.com/catalog/snacks?tag=top-sellers",
    products: "Snacks / Grocery",
    links: 34,
    lastRestock: "2 hours ago",
    status: "Hot",
  },
  {
    supplier: "Nandansons",
    label: "Fragrances – Davidoff / Calvin Klein",
    url: "https://portal.nandansons.com/search?cool+water",
    products: "Fragrances",
    links: 12,
    lastRestock: "Yesterday",
    status: "Stable",
  },
  {
    supplier: "The Perfume Spot",
    label: "Paris Hilton / Celebrity perfumes",
    url: "https://www.theperfumespot.com/paris-hilton",
    products: "Fragrances",
    links: 18,
    lastRestock: "3 days ago",
    status: "Watch",
  },
];

function SupplierLinksSection() {
  const getStatusBadgeClass = (status: SupplierLink["status"]) => {
    if (status === "Hot") return "badge badge-hot";
    if (status === "Watch") return "badge badge-watch";
    return "badge badge-normal";
  };

  return (
    <>
      <div className="page-header">
        <h1>Supplier Links</h1>
        <p>
          Manage all supplier URLs that RestocKING monitors for restocks,
          price changes and availability.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Monitored URLs</h2>
          <p>
            {supplierLinks.length} supplier sources connected. Keep links clean
            and focused on your best-sellers.
          </p>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">Import from CSV</button>
          <button className="btn-primary">+ Add new link</button>
        </div>
      </div>

      <div className="toolbar-tags">
        <div className="tag">
          <span className="tag-dot" />
          High priority
        </div>
        <div className="tag">
          <span className="tag-dot warning" />
          Watch closely
        </div>
        <div className="tag">
          <span className="tag-dot danger" />
          Risk of going OOS
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <h2>All Supplier Links</h2>
            <p>Each URL is scanned and converted into restock alerts.</p>
          </div>
          <button className="btn-secondary">Filters</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>List name</th>
              <th>URL</th>
              <th>Products</th>
              <th>Links</th>
              <th>Last Restock</th>
              <th className="right">Status</th>
            </tr>
          </thead>
          <tbody>
            {supplierLinks.map((row, idx) => (
              <tr key={idx}>
                <td>{row.supplier}</td>
                <td>{row.label}</td>
                <td>
                  <span className="url-cell">{row.url}</span>
                </td>
                <td>{row.products}</td>
                <td>{row.links}</td>
                <td>{row.lastRestock}</td>
                <td className="right">
                  <span className={getStatusBadgeClass(row.status)}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------- RESTOCK ALERTS SECTION -------- */

type RestockAlert = {
  product: string;
  supplier: string;
  url: string;
  status: "Hot" | "Normal" | "Watch";
  lastCheck: string;
  frequency: string;
  notifications: string;
};

const restockAlerts: RestockAlert[] = [
  {
    product: "Davidoff Cool Water EDT 4.2oz",
    supplier: "Nandansons",
    url: "https://portal.nandansons.com/search?cool+water",
    status: "Hot",
    lastCheck: "5 min ago",
    frequency: "Every 15 min",
    notifications: "Email + WhatsApp",
  },
  {
    product: "Paris Hilton Just Me – 3.4oz EDP",
    supplier: "The Perfume Spot",
    url: "https://www.theperfumespot.com/paris-hilton-just-me",
    status: "Watch",
    lastCheck: "32 min ago",
    frequency: "Every hour",
    notifications: "Email + Slack",
  },
  {
    product: "Russell Stover Sugar Free – Assorted",
    supplier: "KeHE",
    url: "https://portal.kehe.com/catalog/snacks?tag=top-sellers",
    status: "Normal",
    lastCheck: "Yesterday",
    frequency: "Daily",
    notifications: "Email only",
  },
];

function RestockAlertsSection() {
  const getAlertBadgeClass = (status: RestockAlert["status"]) => {
    if (status === "Hot") return "badge badge-hot";
    if (status === "Watch") return "badge badge-watch";
    return "badge badge-normal";
  };

  return (
    <>
      <div className="page-header">
        <h1>Restock Alerts</h1>
        <p>
          Track supplier stock levels and get notified when high-priority items
          come back in stock.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Monitored alerts</h2>
          <p>
            {restockAlerts.length} active alerts. Focus on best-sellers and
            fast-moving SKUs.
          </p>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">Export</button>
          <button className="btn-primary">+ Add alert</button>
        </div>
      </div>

      <div className="toolbar-tags">
        <div className="tag">
          <span className="tag-dot" />
          In stock / Hot sellers
        </div>
        <div className="tag">
          <span className="tag-dot warning" />
          Low stock – Watch closely
        </div>
        <div className="tag">
          <span className="tag-dot danger" />
          Out of stock – Critical
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <h2>All Restock Alerts</h2>
            <p>
              Each URL is monitored and converted into stock signals and
              notifications.
            </p>
          </div>
          <button className="btn-secondary">Filters</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Supplier</th>
              <th>URL</th>
              <th>Status</th>
              <th>Last check</th>
              <th>Frequency</th>
              <th className="right">Notifications</th>
            </tr>
          </thead>
          <tbody>
            {restockAlerts.map((row, idx) => (
              <tr key={idx}>
                <td>{row.product}</td>
                <td>{row.supplier}</td>
                <td>
                  <span className="url-cell">{row.url}</span>
                </td>
                <td>
                  <span className={getAlertBadgeClass(row.status)}>
                    {row.status}
                  </span>
                </td>
                <td>{row.lastCheck}</td>
                <td>{row.frequency}</td>
                <td className="right">{row.notifications}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------- HISTORY SECTION -------- */

type HistoryEvent = {
  date: string;
  type: "Restock" | "Alert sent" | "Link added";
  description: string;
  source: string;
};

const historyEvents: HistoryEvent[] = [
  {
    date: "Today · 09:14",
    type: "Alert sent",
    description: "WhatsApp alert sent for Davidoff Cool Water (back in stock).",
    source: "Nandansons",
  },
  {
    date: "Yesterday · 18:03",
    type: "Restock",
    description: "Paris Hilton Just Me detected as back in stock.",
    source: "The Perfume Spot",
  },
  {
    date: "2 days ago",
    type: "Link added",
    description: "New KeHE snacks main list added to Supplier Links.",
    source: "KeHE",
  },
];

function HistorySection() {
  return (
    <>
      <div className="page-header">
        <h1>History</h1>
        <p>
          See a complete audit trail of restocks, alerts sent and changes to
          your supplier links.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Activity log</h2>
          <p>All recent events generated by the SupplyRadar engine.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">Export log</button>
          <button className="btn-secondary">Clear filters</button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <h2>Recent activity</h2>
            <p>Latest 30 events across all suppliers and alerts.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date / time</th>
              <th>Type</th>
              <th>Description</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {historyEvents.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.description}</td>
                <td>{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------- SETTINGS SECTION -------- */

function SettingsSection() {
  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure notifications, account preferences and security options.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Notifications</span>
          <span className="stat-value">Email + WhatsApp</span>
          <span className="stat-desc">
            Manage how you receive restock alerts.
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Time zone</span>
          <span className="stat-value">America/New_York</span>
          <span className="stat-desc">
            All schedules and logs use this time zone.
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Team members</span>
          <span className="stat-value">1</span>
          <span className="stat-desc">Invite more users soon.</span>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <h2>Alert channels</h2>
            <p>Choose which channels are used by default for new alerts.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Email</td>
              <td>
                <span className="badge badge-normal">Enabled</span>
              </td>
              <td>Alerts sent to your primary email address.</td>
            </tr>
            <tr>
              <td>WhatsApp</td>
              <td>
                <span className="badge badge-hot">Enabled</span>
              </td>
              <td>Fast alerts for high-priority SKUs.</td>
            </tr>
            <tr>
              <td>Slack</td>
              <td>
                <span className="badge badge-watch">Coming soon</span>
              </td>
              <td>Connect your team workspace to receive alerts.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------- BILLING SECTION -------- */

type Invoice = {
  date: string;
  id: string;
  amount: string;
  status: "Paid" | "Open";
};

const invoices: Invoice[] = [
  {
    date: "Nov 1, 2025",
    id: "#INV-2025-1101",
    amount: "$49.00",
    status: "Paid",
  },
  {
    date: "Oct 1, 2025",
    id: "#INV-2025-1001",
    amount: "$49.00",
    status: "Paid",
  },
  {
    date: "Sep 1, 2025",
    id: "#INV-2025-0901",
    amount: "$49.00",
    status: "Paid",
  },
];

function BillingSection() {
  return (
    <>
      <div className="page-header">
        <h1>Billing</h1>
        <p>Manage your subscription, plan and invoices.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Current plan</span>
          <span className="stat-value">Pro</span>
          <span className="stat-desc">Up to 500 monitored URLs.</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monthly cost</span>
          <span className="stat-value">$49</span>
          <span className="stat-desc">Billed every 1st of the month.</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Next invoice</span>
          <span className="stat-value">Dec 1, 2025</span>
          <span className="stat-desc">Auto-charged to Visa •••• 4242.</span>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <h2>Invoices</h2>
            <p>Download past invoices for your records.</p>
          </div>
          <button className="btn-secondary">Update payment method</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td>{row.id}</td>
                <td>{row.amount}</td>
                <td>
                  <span
                    className={
                      row.status === "Paid"
                        ? "badge badge-normal"
                        : "badge badge-watch"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="right">
                  <button className="link-button">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------- ROOT APP -------- */

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <div className="app-root">
      <Sidebar currentPage={page} onChangePage={setPage} />
      <div className="main-area">
        <Topbar currentPage={page} />
        <main className="main-content">
          {page === "overview" && <OverviewSection />}
          {page === "links" && <SupplierLinksSection />}
          {page === "alerts" && <RestockAlertsSection />}
          {page === "history" && <HistorySection />}
          {page === "settings" && <SettingsSection />}
          {page === "billing" && <BillingSection />}
        </main>
      </div>
    </div>
  );
}

