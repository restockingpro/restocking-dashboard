import React, { useState, useEffect } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links";

/* --------- SUPABASE CLIENT (VITE) --------- */
const supabaseUrl = "https://plhdroogujwxugpmkpta.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaGRyb29ndWp3eHVncG1rcHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODA4MDMsImV4cCI6MjA3OTI1NjgwM30.iNXj1oO_Bb5zv_uq-xJLuIWhqC3eQNOxvYsWUUL8rtE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  { label: "Restock Alerts", key: "history" },
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
          const isRealPage = item.key === "overview" || item.key === "links";
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
  const label = currentPage === "overview" ? "Overview" : "Supplier Links";

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
  label: string; // list_name no banco
  url: string;
  products: string;
  links: number;
  lastRestock: string;
  status: "Stable" | "Hot" | "Watch";
  priority: "High" | "Medium" | "Low";
};

type NewSupplierLinkInput = {
  supplier: string;
  label: string;
  url: string;
  products: string;
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
      <div
        className="modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
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
              <label>Products</label>
              <input
                type="text"
                value={form.products}
                onChange={(e) =>
                  setForm((f) => ({ ...f, products: e.target.value }))
                }
                required
                placeholder="Snacks, Fragrances..."
              />
            </div>
            <div className="form-field form-field-full">
              <label>List name</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                required
                placeholder="Snacks & Grocery – Main list"
              />
            </div>
            <div className="form-field form-field-full">
              <label>URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
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
          supplier: r.supplier ?? "",
          label: r.list_name ?? "",
          url: r.url ?? "",
          products: r.products ?? "",
          priority: (r.priority ?? "High") as SupplierLink["priority"],
          status: (r.status ?? "Stable") as SupplierLink["status"],
          links: r.links_count ?? 0,
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

    const { error } = await supabase
      .from("supplier_links")
      .insert(insertPayload);

    if (error) {
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
      alert("Erro ao atualizar no Supabase: " + error.message);
      return;
    }

    setEditingRow(null);
    fetchLinks();
  };

  // ✅ DELETE
  const handleDeleteLink = async (id?: string) => {
    if (!id) return;

    const ok = window.confirm("Delete this supplier link?");
    if (!ok) return;

    const { error } = await supabase
      .from("supplier_links")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("DELETE ERROR:", error);
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

  return (
    <>
      <div className="page-header">
        <h1>Supplier Links</h1>
        <p>
          Manage all supplier URLs that RestocKING monitors for restocks, price
          changes and availability.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Monitored URLs</h2>
          <p>
            {data.length} supplier sources connected. Keep links clean and
            focused on your best-sellers.
          </p>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">Import from CSV</button>
          <button className="btn-primary" type="button" onClick={openAddModal}>
            + Add new link
          </button>
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

        {loading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>List name</th>
                <th>URL</th>
                <th>Products</th>
                <th>Priority</th>
                <th>Links</th>
                <th>Last Restock</th>
                <th className="right">Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  <td>{row.supplier}</td>
                  <td>{row.label}</td>
                  <td>
                    <span className="url-cell">{row.url}</span>
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

                  {/* ✅ ACTIONS */}
                  <td className="right">
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => openEditModal(row)}
                        className="action-btn edit"
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
                        className="action-btn delete"
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
        </main>
      </div>
    </div>
  );
}

