import React, { useMemo, useState } from "react";

type AlertStatus = "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK" | "ERROR" | "PAUSED";
type Frequency = "REAL_TIME" | "15_MIN" | "1_HOUR" | "DAILY";

interface RestockAlert {
  id: string;
  productName: string;
  productUrl: string;
  supplierName: string;
  supplierLogoUrl?: string;
  status: AlertStatus;
  lastCheck: string; // ex: "5 min ago"
  frequency: Frequency;
  notifyEmail: boolean;
  notifyWhatsApp: boolean;
  notifySlack: boolean;
}

const MOCK_ALERTS: RestockAlert[] = [
  {
    id: "1",
    productName: "Quest Protein Bar – Chocolate Chip Cookie Dough",
    productUrl: "https://supplier.com/product/quest-bar-cookie-dough",
    supplierName: "KeHE",
    status: "IN_STOCK",
    lastCheck: "5 min ago",
    frequency: "15_MIN",
    notifyEmail: true,
    notifyWhatsApp: true,
    notifySlack: false,
  },
  {
    id: "2",
    productName: "Lindt 90% Dark Chocolate 100g",
    productUrl: "https://supplier.com/product/lindt-90",
    supplierName: "Frontier",
    status: "OUT_OF_STOCK",
    lastCheck: "1 hour ago",
    frequency: "1_HOUR",
    notifyEmail: true,
    notifyWhatsApp: false,
    notifySlack: true,
  },
  {
    id: "3",
    productName: "Davidoff Cool Water EDT 4.2oz",
    productUrl: "https://supplier.com/product/cool-water-42",
    supplierName: "Netrition",
    status: "LOW_STOCK",
    lastCheck: "12 min ago",
    frequency: "REAL_TIME",
    notifyEmail: false,
    notifyWhatsApp: true,
    notifySlack: true,
  },
];

type ViewMode = "NONE" | "VIEW" | "EDIT" | "DELETE";

const statusLabel: Record<AlertStatus, string> = {
  IN_STOCK: "In Stock",
  OUT_OF_STOCK: "Out of Stock",
  LOW_STOCK: "Low Stock",
  ERROR: "Error",
  PAUSED: "Paused",
};

const frequencyLabel: Record<Frequency, string> = {
  REAL_TIME: "Real-time",
  "15_MIN": "Every 15 min",
  "1_HOUR": "Every hour",
  DAILY: "Daily",
};

const statusBadgeClasses: Record<AlertStatus, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  OUT_OF_STOCK: "bg-red-100 text-red-700 border border-red-200",
  LOW_STOCK: "bg-amber-100 text-amber-700 border border-amber-200",
  ERROR: "bg-orange-100 text-orange-700 border border-orange-200",
  PAUSED: "bg-slate-100 text-slate-600 border border-slate-200",
};

const RestockAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<RestockAlert[]>(MOCK_ALERTS);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL");

  const [selectedAlert, setSelectedAlert] = useState<RestockAlert | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("NONE");

  const [editForm, setEditForm] = useState<Partial<RestockAlert>>({});

  const suppliers = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.supplierName))),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const text = `${alert.productName} ${alert.productUrl} ${alert.supplierName}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;

      if (supplierFilter !== "ALL" && alert.supplierName !== supplierFilter) return false;

      if (statusFilter !== "ALL" && alert.status !== statusFilter) return false;

      if (frequencyFilter !== "ALL" && alert.frequency !== frequencyFilter) return false;

      return true;
    });
  }, [alerts, search, supplierFilter, statusFilter, frequencyFilter]);

  function openView(alert: RestockAlert) {
    setSelectedAlert(alert);
    setViewMode("VIEW");
  }

  function openEdit(alert: RestockAlert) {
    setSelectedAlert(alert);
    setEditForm(alert);
    setViewMode("EDIT");
  }

  function openDelete(alert: RestockAlert) {
    setSelectedAlert(alert);
    setViewMode("DELETE");
  }

  function closeModal() {
    setViewMode("NONE");
    setSelectedAlert(null);
  }

  function handleEditChange<K extends keyof RestockAlert>(field: K, value: RestockAlert[K]) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function saveEdit() {
    if (!selectedAlert || !editForm.id) {
      closeModal();
      return;
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === editForm.id ? { ...a, ...editForm } as RestockAlert : a))
    );
    closeModal();
  }

  function confirmDelete() {
    if (!selectedAlert) return;
    setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
    closeModal();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Restock Alerts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor your suppliers and get notified when items come back in stock.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Alert
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, supplier or URL..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Supplier
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">All</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="ERROR">Error</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Frequency
                </label>
                <select
                  value={frequencyFilter}
                  onChange={(e) => setFrequencyFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">All</option>
                  <option value="REAL_TIME">Real-time</option>
                  <option value="15_MIN">Every 15 min</option>
                  <option value="1_HOUR">Every hour</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last Check
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notifications
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAlerts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No alerts found. Try adjusting your filters.
                  </td>
                </tr>
              )}

              {filteredAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {alert.productName}
                      </span>
                      <a
                        href={alert.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-500 hover:underline"
                      >
                        View supplier page
                      </a>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {alert.supplierName.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-800">
                        {alert.supplierName}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses[alert.status]}`}
                    >
                      {statusLabel[alert.status]}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {alert.lastCheck}
                  </td>

                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {frequencyLabel[alert.frequency]}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-1.5">
                      <NotifyDot active={alert.notifyEmail} label="Email" />
                      <NotifyDot active={alert.notifyWhatsApp} label="WhatsApp" />
                      <NotifyDot active={alert.notifySlack} label="Slack" />
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openView(alert)}
                        className="text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(alert)}
                        className="text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(alert)}
                        className="text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {viewMode !== "NONE" && selectedAlert && (
          <Modal onClose={closeModal}>
            {viewMode === "VIEW" && (
              <ViewAlertModalContent alert={selectedAlert} onClose={closeModal} />
            )}

            {viewMode === "EDIT" && (
              <EditAlertModalContent
                form={editForm}
                onChange={handleEditChange}
                onCancel={closeModal}
                onSave={saveEdit}
              />
            )}

            {viewMode === "DELETE" && (
              <DeleteAlertModalContent
                alert={selectedAlert}
                onCancel={closeModal}
                onConfirm={confirmDelete}
              />
            )}
          </Modal>
        )}
      </div>
    </div>
  );
};

interface NotifyDotProps {
  active: boolean;
  label: string;
}

const NotifyDot: React.FC<NotifyDotProps> = ({ active, label }) => {
  return (
    <div
      className={`flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-600"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-indigo-500" : "bg-slate-300"}`} />
      <span>{label}</span>
    </div>
  );
};

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <span className="sr-only">Close</span>✕
        </button>
        {children}
      </div>
    </div>
  );
};

interface ViewAlertModalContentProps {
  alert: RestockAlert;
  onClose: () => void;
}

const ViewAlertModalContent: React.FC<ViewAlertModalContentProps> = ({ alert, onClose }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Alert details</h2>
      <p className="mt-1 text-sm text-slate-500">
        See the current configuration and recent checks for this alert.
      </p>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <div>
          <span className="font-medium text-slate-600">Product:</span>{" "}
          {alert.productName}
        </div>
        <div>
          <span className="font-medium text-slate-600">Supplier:</span>{" "}
          {alert.supplierName}
        </div>
        <div>
          <span className="font-medium text-slate-600">Status:</span>{" "}
          {statusLabel[alert.status]}
        </div>
        <div>
          <span className="font-medium text-slate-600">Last check:</span>{" "}
          {alert.lastCheck}
        </div>
        <div>
          <span className="font-medium text-slate-600">Frequency:</span>{" "}
          {frequencyLabel[alert.frequency]}
        </div>
        <div>
          <span className="font-medium text-slate-600">Notifications:</span>{" "}
          {[
            alert.notifyEmail && "Email",
            alert.notifyWhatsApp && "WhatsApp",
            alert.notifySlack && "Slack",
          ]
            .filter(Boolean)
            .join(", ") || "None"}
        </div>
        <div>
          <span className="font-medium text-slate-600">Supplier URL:</span>{" "}
          <a
            href={alert.productUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Open link
          </a>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

interface EditAlertModalContentProps {
  form: Partial<RestockAlert>;
  onChange: <K extends keyof RestockAlert>(field: K, value: RestockAlert[K]) => void;
  onCancel: () => void;
  onSave: () => void;
}

const EditAlertModalContent: React.FC<EditAlertModalContentProps> = ({
  form,
  onChange,
  onCancel,
  onSave,
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Edit alert</h2>
      <p className="mt-1 text-sm text-slate-500">
        Update the settings for this restock alert.
      </p>

      <div className="mt-4 space-y-4 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Product name
          </label>
          <input
            type="text"
            value={form.productName || ""}
            onChange={(e) => onChange("productName", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Supplier URL
          </label>
          <input
            type="text"
            value={form.productUrl || ""}
            onChange={(e) => onChange("productUrl", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              value={form.status || "IN_STOCK"}
              onChange={(e) => onChange("status", e.target.value as AlertStatus)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="IN_STOCK">In Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="ERROR">Error</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Frequency
            </label>
            <select
              value={form.frequency || "15_MIN"}
              onChange={(e) => onChange("frequency", e.target.value as Frequency)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="REAL_TIME">Real-time</option>
              <option value="15_MIN">Every 15 min</option>
              <option value="1_HOUR">Every hour</option>
              <option value="DAILY">Daily</option>
            </select>
          </div>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Notifications
          </span>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={!!form.notifyEmail}
                onChange={(e) => onChange("notifyEmail", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Email
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={!!form.notifyWhatsApp}
                onChange={(e) => onChange("notifyWhatsApp", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              WhatsApp
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={!!form.notifySlack}
                onChange={(e) => onChange("notifySlack", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Slack
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

interface DeleteAlertModalContentProps {
  alert: RestockAlert;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteAlertModalContent: React.FC<DeleteAlertModalContentProps> = ({
  alert,
  onCancel,
  onConfirm,
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Delete alert</h2>
      <p className="mt-2 text-sm text-slate-600">
        Are you sure you want to delete the alert for{" "}
        <span className="font-semibold">{alert.productName}</span>? This action
        cannot be undone.
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default RestockAlertsPage;
