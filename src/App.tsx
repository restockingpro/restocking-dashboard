import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links" | "alerts";

/* --------- SUPABASE CLIENT (VITE) --------- */
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://plhdroogujwxugpmkpta.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ---------- TYPES ---------- */
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

type SupplierLink = {
  id: string;
  supplier: string | null;
  products: string | null;
  list_name: string | null;
  url: string | null;
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
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

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

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  const [restocks, setRestocks] = useState<RestockEvent[]>([]);
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  // filtros globais
  const [marketFilter, setMarketFilter] = useState<
    "all" | "amazon" | "walmart" | "ebay" | "other"
  >("all");
  const [search, setSearch] = useState("");

  // modal add link
  const [showAdd, setShowAdd] = useState(false);
  const [newSupplier, setNewSupplier] = useState("");
  const [newProducts, setNewProducts] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------- FETCH ---------- */
  async function loadAll() {
    const restocksQ = supabase
      .from("restock_events")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(200);

    const linksQ = supabase
      .from("supplier_links")
      .select("id, supplier, products, list_name, url")
      .order("id", { ascending: false })
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

  /* ---------- ADD LINK ---------- */
  async function addNewLink() {
    if (!newSupplier.trim() || !newUrl.trim()) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("supplier_links")
        .insert([
          {
            supplier: newSupplier.trim(),
            products: newProducts.trim() || null,
            list_name: newListName.trim() || null,
            url: newUrl.trim(),
          },
        ])
        .select("id, supplier, products, list_name, url")
        .single();

      if (error) throw error;

      setLinks((prev) => [data as any, ...prev]);
      setShowAdd(false);
      setNewSupplier("");
      setNewProducts("");
      setNewListName("");
      setNewUrl("");
    } catch (e) {
      console.error(e);
      alert("Erro ao adicionar link. Confere RLS/políticas.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- FILTERED DATA ---------- */
  const q = search.trim().toLowerCase();

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
      const searchOk =
        !q ||
        (l.url || "").toLowerCase().includes(q) ||
        (l.supplier || "").toLowerCase().includes(q) ||
        (l.products || "").toLowerCase().includes(q) ||
        (l.list_name || "").toLowerCase().includes(q);
      return searchOk;
    });
  }, [links, q]);

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

    const prev24 = restocks.filter((r) => {
      const t = new Date(r.detected_at).getTime();
      return now - t > dayMs && now - t <= 2 * dayMs;
    }).length;

    const last7 = restocks.filter(
      (r) => now - new Date(r.detected_at).getTime() <= 7 * dayMs
    ).length;

    const prev7 = restocks.filter((r) => {
      const t = new Date(r.detected_at).getTime();
      return now - t > 7 * dayMs && now - t <= 14 * dayMs;
    }).length;

    const activeUrls = links.length;
    const activeSuppliers = new Set(
      links.map((l) => l.supplier).filter(Boolean)
    ).size;

    const alertsSent = alerts.length;

    const deltaPct = (cur: number, prev: number) => {
      if (prev === 0 && cur === 0) return 0;
      if (prev === 0) return 100;
      return ((cur - prev) / prev) * 100;
    };

    return {
      activeUrls,
      last7,
      last7Delta: deltaPct(last7, prev7),
      activeSuppliers,
      alertsSent,
      last24,
      last24Delta: deltaPct(last24, prev24),
    };
  }, [restocks, links, alerts]);

  const Trend = ({ delta }: { delta: number }) => {
    const up = delta >= 0;
    return (
      <span className={`kpi-trend ${up ? "up" : "down"}`}>
        {up ? "+" : ""}
        {delta.toFixed(1)}%
      </span>
    );
  };

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
            <div className="page-header">
              <h1>Supplier Links</h1>
              <p>Manage all supplier URLs RestocKING monitors.</p>
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
            {/* marketplace só faz sentido pra Overview/Alerts, mas deixo global */}
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
                placeholder="supplier, product, department or URL..."
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
                  <div className="stat-value kpi-value">
                    {kpis.last7}
                    <Trend delta={kpis.last7Delta} />
                  </div>
                  <div className="stat-desc">vs previous 7d</div>
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
                        <td
                          colSpan={6}
                          style={{
                            padding: 14,
                            textAlign: "center",
                            color: "#9ca3af",
                          }}
                        >
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

                {/* BOTÃO DE ADD VOLTOU AQUI */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => alert("CSV depois a gente liga")}
                  >
                    Import from CSV
                  </button>
                  <button className="btn-primary" onClick={() => setShowAdd(true)}>
                    + Add new link
                  </button>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Department / List</th>
                    <th>Product</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((l) => (
                    <tr key={l.id}>
                      <td>{l.supplier || "Unknown"}</td>
                      <td>{l.list_name || "--"}</td>
                      <td>{l.products || "--"}</td>
                      <td>
                        {l.url ? (
                          <a
                            className="clickable-url url-cell"
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {l.url}
                          </a>
                        ) : (
                          "--"
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredLinks.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: 14,
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
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
                        <span
                          className={`badge change-${a.change_type || "restock"}`}
                        >
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
                        <a
                          className="open-link"
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}

                  {filteredAlerts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 14,
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
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

      {/* MODAL ADD LINK */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Add new supplier link</div>
                <div className="modal-subtitle">
                  This URL will be tracked for restocks.
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>
                Close
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Supplier *</label>
                <input
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  placeholder="FragranceNet"
                />
              </div>

              <div className="form-field">
                <label>Department / List</label>
                <input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Beauty & Personal Care"
                />
              </div>

              <div className="form-field form-field-full">
                <label>Product name / Notes</label>
                <input
                  value={newProducts}
                  onChange={(e) => setNewProducts(e.target.value)}
                  placeholder="Paris Hilton Just Me Man"
                />
              </div>

              <div className="form-field form-field-full">
                <label>URL *</label>
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://supplier.com/product/..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={saving}
                onClick={addNewLink}
              >
                {saving ? "Saving..." : "Save link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



