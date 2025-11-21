import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links" | "alerts";

/* --------- SUPABASE CLIENT (VITE) --------- */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ---------- TYPES (BATENDO COM TEU SCHEMA) ---------- */
type RestockEvent = {
  id: string;
  supplier_name: string | null;
  product_name: string | null;
  sku: string | null;
  url: string;
  detected_at: string; // ISO
  price: number | null;
  marketplace: "amazon" | "walmart" | "ebay" | "other" | null;
};

type SupplierLinkRow = {
  id: string;
  supplier: string | null;
  products: string | null;
  list_name: string | null;
  url: string;
  created_at?: string | null;
};

type AlertRow = {
  id: string;
  url: string;
  supplier_name: string | null;
  product_name: string | null;
  status: "open" | "resolved" | "muted";
  reason: string | null;
  change_type: string | null;
  created_at: string;
};

/* ---------- HELPERS ---------- */
const fmtDate = (iso?: string | null) => {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const mpLabel = (mp: RestockEvent["marketplace"]) => {
  switch (mp) {
    case "amazon":
      return "Amazon";
    case "walmart":
      return "Walmart";
    case "ebay":
      return "eBay";
    default:
      return "Other";
  }
};

const restockStatusBadge = (detectedAt: string) => {
  const hours = (Date.now() - new Date(detectedAt).getTime()) / 36e5;
  if (hours <= 6) return { text: "Hot", cls: "badge badge-hot" };
  if (hours <= 48) return { text: "Watch", cls: "badge badge-watch" };
  return { text: "Normal", cls: "badge badge-normal" };
};

/* ---------- MODAL ADD LINK ---------- */
function AddLinkModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [supplier, setSupplier] = useState("");
  const [products, setProducts] = useState("");
  const [listName, setListName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setErr(null);
    if (!supplier.trim() || !url.trim()) {
      setErr("Supplier and URL are required.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("supplier_links").insert([
      {
        supplier: supplier.trim(),
        products: products.trim() || null,
        list_name: listName.trim() || null,
        url: url.trim(),
      },
    ]);
    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // reset + close
    setSupplier("");
    setProducts("");
    setListName("");
    setUrl("");
    onClose();
    onCreated();
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Add new supplier link</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label>Supplier</label>
          <input
            placeholder="FragranceNet, Chia Pet..."
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />

          <label>Product name</label>
          <input
            placeholder="Paris Hilton Just Me Man..."
            value={products}
            onChange={(e) => setProducts(e.target.value)}
          />

          <label>Amazon Department (list_name)</label>
          <input
            placeholder="Beauty & Personal Care..."
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />

          <label>URL</label>
          <input
            placeholder="https://supplier.com/product..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {err && <div className="modal-error">{err}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  const [restocks, setRestocks] = useState<RestockEvent[]>([]);
  const [links, setLinks] = useState<SupplierLinkRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  // filtros globais
  const [marketFilter, setMarketFilter] = useState<
    "all" | "amazon" | "walmart" | "ebay" | "other"
  >("all");
  const [search, setSearch] = useState("");

  // modal add link
  const [addOpen, setAddOpen] = useState(false);

  /* ---------- FETCH ---------- */
  async function loadAll() {
    const restocksQ = supabase
      .from("restock_events")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(200);

    const linksQ = supabase
      .from("supplier_links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const alertsQ = supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const [r, l, a] = await Promise.all([restocksQ, linksQ, alertsQ]);

    if (!r.error) setRestocks(r.data as any);
    if (!l.error) setLinks(l.data as any);
    if (!a.error) setAlerts(a.data as any);
  }

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel("restocks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "restock_events" },
        (payload) => {
          const row = payload.new as any as RestockEvent;
          setRestocks((prev) => [row, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- FILTERED DATA ---------- */
  const q = search.trim().toLowerCase();

  const urlMpGuess = (url: string) => {
    const u = (url || "").toLowerCase();
    if (u.includes("amazon")) return "amazon";
    if (u.includes("walmart")) return "walmart";
    if (u.includes("ebay")) return "ebay";
    return "other";
  };

  const filteredRestocks = useMemo(() => {
    return restocks.filter((r) => {
      const mpOk = marketFilter === "all" || r.marketplace === marketFilter;
      const searchOk =
        !q ||
        r.url.toLowerCase().includes(q) ||
        (r.product_name || "").toLowerCase().includes(q) ||
        (r.supplier_name || "").toLowerCase().includes(q) ||
        (r.sku || "").toLowerCase().includes(q);
      return mpOk && searchOk;
    });
  }, [restocks, marketFilter, q]);

  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const mp = urlMpGuess(l.url);
      const mpOk = marketFilter === "all" || mp === marketFilter;
      const searchOk =
        !q ||
        l.url.toLowerCase().includes(q) ||
        (l.supplier || "").toLowerCase().includes(q) ||
        (l.products || "").toLowerCase().includes(q) ||
        (l.list_name || "").toLowerCase().includes(q);
      return mpOk && searchOk;
    });
  }, [links, marketFilter, q]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const mpOk =
        marketFilter === "all" ||
        (a.url || "").toLowerCase().includes(marketFilter);
      const searchOk =
        !q ||
        (a.url || "").toLowerCase().includes(q) ||
        (a.product_name || "").toLowerCase().includes(q) ||
        (a.supplier_name || "").toLowerCase().includes(q);
      return mpOk && searchOk;
    });
  }, [alerts, marketFilter, q]);

  /* ---------- KPIs ---------- */
  const kpis = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const last24 = restocks.filter(
      (r) => now - new Date(r.detected_at).getTime() <= dayMs
    ).length;

    const last7 = restocks.filter(
      (r) => now - new Date(r.detected_at).getTime() <= 7 * dayMs
    ).length;

    const activeUrls = links.length;
    const activeSuppliers = new Set(
      links.map((l) => l.supplier || "Unknown")
    ).size;

    const alertsSent = alerts.length;

    return {
      activeUrls,
      last7,
      activeSuppliers,
      alertsSent,
      last24,
    };
  }, [restocks, links, alerts]);

  return (
    <div className="app-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-block">
          <div className="logo-icon">🦍</div>
          <div>
            <div className="logo-title">RESTOCKING</div>
            <div className="logo-sub">Restock before everyone else.</div>
          </div>
        </div>

        <div className="nav">
          <button
            className={`nav-item ${page === "overview" ? "active" : ""}`}
            onClick={() => setPage("overview")}
          >
            Overview
          </button>
          <button
            className={`nav-item ${page === "links" ? "active" : ""}`}
            onClick={() => setPage("links")}
          >
            Supplier Links
          </button>
          <button
            className={`nav-item ${page === "alerts" ? "active" : ""}`}
            onClick={() => setPage("alerts")}
          >
            Restock Alerts
          </button>
        </div>

        <div className="sidebar-footer">Build v2 • realtime on</div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Dashboard /{" "}
            <span>
              {page === "overview"
                ? "Overview"
                : page === "links"
                ? "Supplier Links"
                : "Alerts"}
            </span>
          </div>
          <div className="topbar-right">
            <button className="btn-secondary" onClick={loadAll}>
              Refresh
            </button>
            <div className="avatar">LP</div>
          </div>
        </header>

        <div className="main-content">
          {/* HEADER */}
          {page === "overview" && (
            <div className="page-header">
              <h1>Restock Overview</h1>
              <p>Monitor supplier restocks, act before everyone else.</p>
            </div>
          )}
          {page === "links" && (
            <div className="page-header page-header-links">
              <div>
                <h1>Supplier Links</h1>
                <p>All monitored URLs and suppliers.</p>
              </div>

              {/* BOTÃO VOLTOU AQUI */}
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                + Add new link
              </button>
            </div>
          )}
          {page === "alerts" && (
            <div className="page-header">
              <h1>Restock Alerts</h1>
              <p>Events that need attention right now.</p>
            </div>
          )}

          {/* FILTER BAR */}
          <div className="filter-bar">
            <div className="filter-item">
              <label>Marketplace</label>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="amazon">Amazon</option>
                <option value="walmart">Walmart</option>
                <option value="ebay">eBay</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Search</label>
              <input
                style={{ height: 36, borderRadius: 10, padding: "0 10px" }}
                placeholder="supplier, product or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn-ghost" onClick={() => setSearch("")}>
              Clear filters
            </button>
          </div>

          {/* OVERVIEW */}
          {page === "overview" && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">ACTIVE URLS</div>
                  <div className="stat-value">{kpis.activeUrls}</div>
                  <div className="stat-desc">Links monitored</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">RESTOCKS (7 DAYS)</div>
                  <div className="stat-value kpi-value">{kpis.last7}</div>
                  <div className="stat-desc">Last 7d</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">SUPPLIERS</div>
                  <div className="stat-value">{kpis.activeSuppliers}</div>
                  <div className="stat-desc">Active suppliers</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">ALERTS SENT</div>
                  <div className="stat-value">{kpis.alertsSent}</div>
                  <div className="stat-desc">Notifications</div>
                </div>
              </div>

              <div className="table-wrapper">
                <div className="table-header">
                  <div>
                    <h2>Recent Restocks</h2>
                    <p>Latest supplier restocks being tracked live.</p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => setPage("alerts")}
                  >
                    View all
                  </button>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Marketplace</th>
                      <th>Last Restock</th>
                      <th className="right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestocks.slice(0, 12).map((r) => {
                      const badge = restockStatusBadge(r.detected_at);
                      return (
                        <tr key={r.id}>
                          <td>{r.supplier_name || "Unknown"}</td>
                          <td>{r.product_name || "Unnamed product"}</td>
                          <td>{r.sku || "--"}</td>
                          <td>{mpLabel(r.marketplace)}</td>
                          <td>{timeAgo(r.detected_at)}</td>
                          <td className="right">
                            <span className={badge.cls}>{badge.text}</span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRestocks.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 14, textAlign: "center", color: "#9ca3af" }}>
                          No restocks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* LINKS */}
          {page === "links" && (
            <div className="table-wrapper">
              <div className="table-header">
                <div>
                  <h2>Supplier Links</h2>
                  <p>All monitored URLs.</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Amazon Dept</th>
                    <th>Product</th>
                    <th>URL</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((l) => (
                    <tr key={l.id}>
                      <td>{l.supplier || "Unknown"}</td>
                      <td>{l.list_name || "--"}</td>
                      <td>{l.products || "--"}</td>
                      <td>
                        <a
                          className="clickable-url url-cell"
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {l.url}
                        </a>
                      </td>
                      <td>{fmtDate(l.created_at)}</td>
                    </tr>
                  ))}

                  {filteredLinks.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 14, textAlign: "center", color: "#9ca3af" }}>
                        No links found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ALERTS */}
          {page === "alerts" && (
            <div className="table-wrapper alerts-table-wrapper">
              <div className="table-header alerts-table-header">
                <div>
                  <h2>Restock Alerts</h2>
                  <p>Same logic as Overview — real events.</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Product</th>
                    <th>Change</th>
                    <th>When</th>
                    <th>Status</th>
                    <th className="right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((a) => (
                    <tr
                      key={a.id}
                      className={a.status === "open" ? "alert-row-unread" : ""}
                    >
                      <td>{a.supplier_name || "Unknown"}</td>
                      <td>{a.product_name || a.reason || "Alert"}</td>
                      <td>
                        <span className={`badge change-${a.change_type || "restock"}`}>
                          {a.change_type || "restock"}
                        </span>
                      </td>
                      <td>{timeAgo(a.created_at)}</td>
                      <td>
                        <span
                          className={`badge ${
                            a.status === "open"
                              ? "badge-hot"
                              : a.status === "muted"
                              ? "badge-watch"
                              : "badge-normal"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="right">
                        <a className="open-link" href={a.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}

                  {filteredAlerts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 14, textAlign: "center", color: "#9ca3af" }}>
                        No alerts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <AddLinkModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={loadAll}
      />
    </div>
  );
}

