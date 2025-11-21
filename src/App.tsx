import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links" | "alerts";

/* --------- SUPABASE CLIENT (VITE) --------- */
const supabaseUrl = "https://plhdroogujwxugpmkpta.supabase.co";
const supabaseAnonKey =
  "YOUR_ANON_KEY_HERE"; // <-- deixa sua key aqui igual estava antes

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ---------- TYPES ---------- */
type RestockEvent = {
  id: string;
  supplier_name: string | null;
  product_name: string | null;
  url: string;
  detected_at: string; // ISO
  price: number | null;
  marketplace: "amazon" | "walmart" | "ebay" | "other" | null;
};

type SupplierLink = {
  id: string;
  supplier_name: string;
  url: string;
  marketplace: "amazon" | "walmart" | "ebay" | "other" | null;
  is_active: boolean;
  created_at: string;
};

type AlertRow = {
  id: string;
  url: string;
  supplier_name: string | null;
  status: "open" | "resolved" | "muted";
  reason: string | null;
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

const mpBadge = (mp: RestockEvent["marketplace"]) => {
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

/* ---------- COMPONENTS ---------- */
function StatCard({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number; // percent change
}) {
  const isUp = (delta ?? 0) >= 0;
  const deltaText =
    delta == null ? "" : `${isUp ? "+" : ""}${delta.toFixed(1)}%`;

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">
        {sub}
        {delta != null && (
          <span className={`delta ${isUp ? "up" : "down"}`}>
            {deltaText}
          </span>
        )}
      </div>
    </div>
  );
}

function MiniFeedItem({ e }: { e: RestockEvent }) {
  return (
    <div className="feed-item">
      <div className="feed-left">
        <div className="feed-title">
          {e.product_name || "Unnamed product"}
        </div>
        <div className="feed-meta">
          <span className="badge">{mpBadge(e.marketplace)}</span>
          <span className="muted">
            {e.supplier_name || "Unknown supplier"}
          </span>
          <span className="muted">• {timeAgo(e.detected_at)}</span>
        </div>
        <a href={e.url} target="_blank" rel="noreferrer" className="feed-link">
          {e.url}
        </a>
      </div>

      <div className="feed-right">
        <div className="feed-price">
          {e.price != null ? `$${e.price.toFixed(2)}` : "--"}
        </div>
        <div className="feed-date">{fmtDate(e.detected_at)}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  // data
  const [restocks, setRestocks] = useState<RestockEvent[]>([]);
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  // ui state
  const [mpFilter, setMpFilter] = useState<
    "all" | "amazon" | "walmart" | "ebay" | "other"
  >("all");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  /* ---------- FETCH ---------- */
  async function loadAll() {
    // ⚠️ AJUSTE AQUI se seus nomes de tabela forem diferentes
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

    // realtime restocks
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

  /* ---------- FILTERS ---------- */
  const filteredRestocks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return restocks.filter((e) => {
      const mpOk = mpFilter === "all" || e.marketplace === mpFilter;
      const searchOk =
        !q ||
        e.url.toLowerCase().includes(q) ||
        (e.product_name || "").toLowerCase().includes(q) ||
        (e.supplier_name || "").toLowerCase().includes(q);
      return mpOk && searchOk;
    });
  }, [restocks, mpFilter, search]);

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter((l) => {
      const mpOk = mpFilter === "all" || l.marketplace === mpFilter;
      const searchOk =
        !q ||
        l.url.toLowerCase().includes(q) ||
        l.supplier_name.toLowerCase().includes(q);
      const activeOk = !activeOnly || l.is_active;
      return mpOk && searchOk && activeOk;
    });
  }, [links, mpFilter, search, activeOnly]);

  /* ---------- KPIs w/ TREND ---------- */
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

    const openAlerts = alerts.filter((a) => a.status === "open").length;

    const delta = (cur: number, prev: number) => {
      if (prev === 0 && cur === 0) return 0;
      if (prev === 0) return 100;
      return ((cur - prev) / prev) * 100;
    };

    return {
      last24,
      last24Delta: delta(last24, prev24),
      last7,
      last7Delta: delta(last7, prev7),
      activeLinks: links.filter((l) => l.is_active).length,
      openAlerts,
    };
  }, [restocks, links, alerts]);

  /* ---------- UI ---------- */
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">👑</div>
          <div className="brand-name">RestocKING</div>
          <div className="brand-sub">Restock Radar</div>
        </div>

        <nav className="nav">
          <button
            className={`nav-btn ${page === "overview" ? "active" : ""}`}
            onClick={() => setPage("overview")}
          >
            Overview
          </button>
          <button
            className={`nav-btn ${page === "links" ? "active" : ""}`}
            onClick={() => setPage("links")}
          >
            Supply Links
          </button>
          <button
            className={`nav-btn ${page === "alerts" ? "active" : ""}`}
            onClick={() => setPage("alerts")}
          >
            Alerts
          </button>
        </nav>
      </aside>

      <main className="main">
        {/* FILTER BAR (fica global, coerente) */}
        <div className="filter-bar">
          <div className="filter-left">
            <div className="segmented">
              {(["all", "amazon", "walmart", "ebay", "other"] as const).map(
                (x) => (
                  <button
                    key={x}
                    className={`seg-btn ${mpFilter === x ? "on" : ""}`}
                    onClick={() => setMpFilter(x)}
                  >
                    {x === "all"
                      ? "All"
                      : x.charAt(0).toUpperCase() + x.slice(1)}
                  </button>
                )
              )}
            </div>

            {page === "links" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                Active only
              </label>
            )}
          </div>

          <div className="filter-right">
            <input
              className="search"
              placeholder={
                page === "links"
                  ? "Search links, suppliers or URLs..."
                  : "Search restocks, suppliers or URLs..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="icon-btn" onClick={loadAll} title="Refresh">
              ↻
            </button>
          </div>
        </div>

        {/* PAGES */}
        {page === "overview" && (
          <div className="page">
            <h1 className="page-title">Overview</h1>

            <div className="stats-grid">
              <StatCard
                label="Restocks (24h)"
                value={kpis.last24}
                sub="vs prev 24h"
                delta={kpis.last24Delta}
              />
              <StatCard
                label="Restocks (7d)"
                value={kpis.last7}
                sub="vs prev 7d"
                delta={kpis.last7Delta}
              />
              <StatCard label="Active Links" value={kpis.activeLinks} sub="" />
              <StatCard label="Open Alerts" value={kpis.openAlerts} sub="" />
            </div>

            <div className="split">
              <section className="card">
                <div className="card-header">
                  <h2>Recent Restocks</h2>
                  <span className="muted">
                    live feed • {filteredRestocks.length} events
                  </span>
                </div>

                <div className="feed">
                  {filteredRestocks.slice(0, 12).map((e) => (
                    <MiniFeedItem key={e.id} e={e} />
                  ))}

                  {filteredRestocks.length === 0 && (
                    <div className="empty">No restocks found.</div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>Alerts Snapshot</h2>
                  <span className="muted">same logic as Alerts tab</span>
                </div>

                <div className="alerts-mini">
                  {alerts.slice(0, 8).map((a) => (
                    <div key={a.id} className={`alert-row ${a.status}`}>
                      <div className="alert-title">
                        {a.reason || "Alert"}
                      </div>
                      <div className="alert-sub">
                        {a.supplier_name || "Unknown supplier"} •{" "}
                        {timeAgo(a.created_at)}
                      </div>
                      <a
                        href={a.url}
                        className="alert-link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.url}
                      </a>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="empty">No alerts.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {page === "links" && (
          <div className="page">
            <h1 className="page-title">Supply Links</h1>

            <section className="card">
              <div className="card-header">
                <h2>Monitored URLs</h2>
                <span className="muted">{filteredLinks.length} links</span>
              </div>

              <div className="table">
                <div className="row head">
                  <div>Supplier</div>
                  <div>Marketplace</div>
                  <div>Status</div>
                  <div>URL</div>
                  <div>Created</div>
                </div>

                {filteredLinks.map((l) => (
                  <div key={l.id} className="row">
                    <div className="strong">{l.supplier_name}</div>
                    <div>{mpBadge(l.marketplace as any)}</div>
                    <div>
                      <span className={`pill ${l.is_active ? "on" : "off"}`}>
                        {l.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="truncate">
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.url}
                      </a>
                    </div>
                    <div className="muted">{fmtDate(l.created_at)}</div>
                  </div>
                ))}

                {filteredLinks.length === 0 && (
                  <div className="empty">No links found.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {page === "alerts" && (
          <div className="page">
            <h1 className="page-title">Alerts</h1>

            <section className="card">
              <div className="card-header">
                <h2>Open & Recent Alerts</h2>
                <span className="muted">{alerts.length} total</span>
              </div>

              <div className="alerts-list">
                {alerts.map((a) => (
                  <div key={a.id} className={`alert-row big ${a.status}`}>
                    <div className="alert-title">
                      {a.reason || "Alert"}
                    </div>
                    <div className="alert-sub">
                      {a.supplier_name || "Unknown supplier"} •{" "}
                      {fmtDate(a.created_at)}
                    </div>
                    <a
                      href={a.url}
                      className="alert-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.url}
                    </a>
                    <div className="alert-status">
                      <span className={`pill ${a.status}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="empty">No alerts.</div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

