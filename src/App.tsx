import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links" | "alerts";

/* --------- SUPABASE CLIENT (VITE) --------- */
// usa env do Vercel/local. fallback só pra não quebrar dev.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://plhdroogujwxugpmkpta.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* --------- AMAZON DEPARTMENTS (TOP LEVEL) --------- */
const AMAZON_DEPARTMENTS = [
  "Appliances",
  "Arts, Crafts & Sewing",
  "Automotive",
  "Baby",
  "Beauty & Personal Care",
  "Books",
  "Camera & Photo",
  "Cell Phones & Accessories",
  "Clothing, Shoes & Jewelry",
  "Collectibles & Fine Art",
  "Computers",
  "Electronics",
  "Grocery & Gourmet Food",
  "Health & Household",
  "Home & Kitchen",
  "Industrial & Scientific",
  "Kitchen & Dining",
  "Movies & TV",
  "Musical Instruments",
  "Office Products",
  "Patio, Lawn & Garden",
  "Pet Supplies",
  "Sports & Outdoors",
  "Tools & Home Improvement",
  "Toys & Games",
  "Video Games",
] as const;

/* --------- SMALL COMPONENTS --------- */
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

const navItems: {
  label: string;
  key: Page | "history" | "settings" | "billing";
}[] = [
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
          const isRealPage =
            item.key === "overview" ||
            item.key === "links" ||
            item.key === "alerts";
          const isActive = currentPage === item.key;

          return (
            <button
              key={item.label}
              className={"nav-item" + (isActive && isRealPage ? " active" : "")}
              onClick={() => {
                if (isRealPage) onChangePage(item.key as Page);
              }}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        © {new Date().getFullYear()} RestocKING
      </div>
    </aside>
  );
}

type TopbarProps = { currentPage: Page };

function Topbar({ currentPage }: TopbarProps) {
  const label =
    currentPage === "overview"
      ? "Overview"
      : currentPage === "links"
      ? "Supplier Links"
      : "Restock Alerts";

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

/* -------- SUPPLIER LINKS + MODAL -------- */
type SupplierLink = {
  id?: string;
  supplier: string;
  label: string; // list_name no banco (department)
  url: string;
  products: string; // product name
  links: number;
  lastRestock: string;
  status: "Stable" | "Hot" | "Watch";
  priority: "High" | "Medium" | "Low";
};

type NewSupplierLinkInput = {
  supplier: string;
  label: string; // department
  url: string;
  products: string; // product name
  priority: SupplierLink["priority"];
  status: SupplierLink["status"];
  links?: number;
};

type AddLinkModalProps = {
  open: boolean;
  mode: "add" | "edit";
  initialData?: Partial<NewSupplierLinkInput>;
  onClose: () => void;
  onSave: (data: NewSupplierLinkInput) => void;
};

function AddLinkModal({
  open,
  mode,
  initialData,
  onClose,
  onSave,
}: AddLinkModalProps) {
  const [form, setForm] = useState({
    supplier: "",
    label: "",
    url: "",
    products: "",
    priority: "High" as SupplierLink["priority"],
    status: "Hot" as SupplierLink["status"],
    links: "0",
  });

  useEffect(() => {
    if (open) {
      setForm({
        supplier: initialData?.supplier ?? "",
        label: initialData?.label ?? "",
        url: initialData?.url ?? "",
        products: initialData?.products ?? "",
        priority: (initialData?.priority ?? "High") as SupplierLink["priority"],
        status: (initialData?.status ?? "Hot") as SupplierLink["status"],
        links: String(initialData?.links ?? 0),
      });
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const linksNumber = Number(form.links || 0);

    onSave({
      supplier: form.supplier.trim(),
      label: form.label.trim(),
      url: form.url.trim(),
      products: form.products.trim(),
      priority: form.priority,
      status: form.status,
      links: Number.isNaN(linksNumber) ? 0 : linksNumber,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {mode === "add" ? "Add new supplier link" : "Edit supplier link"}
            </div>
            <p className="modal-subtitle">
              Keep URLs focused on your best suppliers. You can edit later.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>Supplier</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier: e.target.value }))
                }
                required
                placeholder="KeHE, Nandansons..."
              />
            </div>

            <div className="form-field">
              <label>Product name</label>
              <input
                type="text"
                value={form.products}
                onChange={(e) =>
                  setForm((f) => ({ ...f, products: e.target.value }))
                }
                required
                placeholder="Davidoff Cool Water 4.2oz..."
              />
            </div>

            <div className="form-field form-field-full">
              <label>Amazon Department</label>
              <select
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Select a department...
                </option>
                {AMAZON_DEPARTMENTS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                required
                placeholder="https://portal.kehe.com/..."
              />
            </div>

            <div className="form-field">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priority: e.target.value as SupplierLink["priority"],
                  }))
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as SupplierLink["status"],
                  }))
                }
              >
                <option value="Hot">Hot</option>
                <option value="Stable">Stable</option>
                <option value="Watch">Watch</option>
              </select>
            </div>

            <div className="form-field">
              <label>Links (optional)</label>
              <input
                type="number"
                min={0}
                value={form.links}
                onChange={(e) =>
                  setForm((f) => ({ ...f, links: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {mode === "add" ? "Save link" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplierLinksSection() {
  const [data, setData] = useState<SupplierLink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SupplierLink | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  async function fetchLinks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("supplier_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch supplier_links error:", error.message);
      setData([]);
    } else {
      const mapped =
        (data ?? []).map((r: any) => ({
          id: r.id,
          supplier: r.supplier ?? r.supplier_name ?? "",
          label: r.list_name ?? r.department ?? "",
          url: r.url ?? "",
          products: r.products ?? r.product_name ?? "",
          priority: (r.priority ?? "High") as SupplierLink["priority"],
          status: (r.status ?? "Stable") as SupplierLink["status"],
          links: Number(r.links_count ?? r.links ?? 0),
          lastRestock: r.last_restock ?? "Not checked yet",
        })) as SupplierLink[];

      setData(mapped);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  const getStatusBadgeClass = (status: SupplierLink["status"]) => {
    if (status === "Hot") return "badge badge-hot";
    if (status === "Watch") return "badge badge-watch";
    return "badge badge-normal";
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const okDept =
        filterDepartment === "All" || row.label === filterDepartment;
      const okPriority =
        filterPriority === "All" || row.priority === filterPriority;
      const okStatus = filterStatus === "All" || row.status === filterStatus;
      return okDept && okPriority && okStatus;
    });
  }, [data, filterDepartment, filterPriority, filterStatus]);

  const handleAddLink = async (payload: NewSupplierLinkInput) => {
    const linksNumber = payload.links ?? 0;

    const insertPayload = {
      supplier: payload.supplier,
      list_name: payload.label,
      url: payload.url,
      products: payload.products,
      priority: payload.priority,
      status: payload.status,
      links_count: linksNumber,
    };

    const { error } = await supabase.from("supplier_links").insert(insertPayload);

    if (error) {
      console.error("INSERT ERROR:", error);
      alert("Erro ao salvar no Supabase: " + error.message);
      return;
    }

    fetchLinks();
  };

  const handleUpdateLink = async (payload: NewSupplierLinkInput) => {
    if (!editingRow?.id) return;

    const linksNumber = payload.links ?? 0;

    const updatePayload = {
      supplier: payload.supplier,
      list_name: payload.label,
      url: payload.url,
      products: payload.products,
      priority: payload.priority,
      status: payload.status,
      links_count: linksNumber,
    };

    const { error } = await supabase
      .from("supplier_links")
      .update(updatePayload)
      .eq("id", editingRow.id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      alert("Erro ao atualizar no Supabase: " + error.message);
      return;
    }

    setEditingRow(null);
    fetchLinks();
  };

  const handleDeleteLink = async (id?: string) => {
    if (!id) return;

    const ok = window.confirm("Delete this supplier link?");
    if (!ok) return;

    const { error } = await supabase
      .from("supplier_links")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE ERROR:", error);
      alert(error.message);
      return;
    }

    setData((prev) => prev.filter((l) => l.id !== id));
  };

  const openAddModal = () => {
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: SupplierLink) => {
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setFilterDepartment("All");
    setFilterPriority("All");
    setFilterStatus("All");
  };

  return (
    <>
      <div className="page-header">
        <h1>Supplier Links</h1>
        <p>
          Manage all supplier URLs you want RestocKING to monitor. By adding your links here, you’ll receive instant alerts the moment stock returns — giving you the advantage of restocking ahead of competitors.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Monitored URLs</h2>
          <p>
            {filteredData.length} of {data.length} links shown.
          </p>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">Import from CSV</button>
          <button className="btn-primary-big" type="button" onClick={openAddModal}>
            + Add new link
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="All">All</option>
            {AMAZON_DEPARTMENTS.map((d) => (
              <option value={d} key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Hot">Hot</option>
            <option value="Stable">Stable</option>
            <option value="Watch">Watch</option>
          </select>
        </div>

        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
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

        {loading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 20, opacity: 0.7 }}>
            No links match these filters.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Amazon Department</th>
                <th>URL</th>
                <th>Product name</th>
                <th>Priority</th>
                <th>Links</th>
                <th>Last Restock</th>
                <th className="right">Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  <td>{row.supplier}</td>
                  <td>{row.label}</td>

                  <td>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="url-cell clickable-url"
                      title="Open URL"
                    >
                      {row.url}
                    </a>
                  </td>

                  <td>{row.products}</td>
                  <td>{row.priority}</td>
                  <td>{row.links}</td>
                  <td>{row.lastRestock}</td>
                  <td className="right">
                    <span className={getStatusBadgeClass(row.status)}>
                      {row.status}
                    </span>
                  </td>

                  <td className="right">
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEditModal(row)}
                        title="Edit"
                        style={{
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "transparent",
                          padding: "6px 10px",
                          borderRadius: 10,
                          cursor: "pointer",
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => handleDeleteLink(row.id)}
                        title="Delete"
                        style={{
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "transparent",
                          padding: "6px 10px",
                          borderRadius: 10,
                          cursor: "pointer",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddLinkModal
        open={isModalOpen}
        mode={editingRow ? "edit" : "add"}
        initialData={
          editingRow
            ? {
                supplier: editingRow.supplier,
                label: editingRow.label,
                url: editingRow.url,
                products: editingRow.products,
                priority: editingRow.priority,
                status: editingRow.status,
                links: editingRow.links,
              }
            : undefined
        }
        onClose={() => {
          setIsModalOpen(false);
          setEditingRow(null);
        }}
        onSave={editingRow ? handleUpdateLink : handleAddLink}
      />
    </>
  );
}

/* -------- RESTOCK ALERTS SECTION -------- */
function RestockAlertsSection() {
  return (
    <>
      <div className="page-header">
        <h1>Restock Alerts</h1>
        <p>Alerts page (old layout). We’ll wire data later.</p>
      </div>
      <div className="table-wrapper">
        <div style={{ padding: 20, opacity: 0.7 }}>No alerts yet.</div>
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
        </main>
      </div>
    </div>
  );
}

