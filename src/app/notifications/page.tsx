"use client";

import { useState, useEffect, useCallback } from "react";
import { notifications } from "@/lib/api";
import type { NotificationDto } from "@/types";
import { useNotificationHub } from "@/hooks/useNotificationHub";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = { tenantId: "", vehicleId: "", title: "", message: "" };

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filterTenantId, setFilterTenantId] = useState("");
  const [filterVehicleId, setFilterVehicleId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"none" | "tenant" | "vehicle">("none");

  // Quick sample state
  const [quickTenantId, setQuickTenantId] = useState("");
  const [quickVehicleId, setQuickVehicleId] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  // SignalR real-time notifications
  const handleRealTimeNotification = useCallback(
    (notification: NotificationDto) => {
      setData((prev) => [notification, ...prev]);
    },
    []
  );
  const { connected } = useNotificationHub(handleRealTimeNotification);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const result = await notifications.getAll();
      setData(result);
      setActiveFilter("none");
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchByTenant = async () => {
    const id = Number(filterTenantId);
    if (!id) return;
    setLoading(true);
    try {
      const result = await notifications.getByTenant(id);
      setData(result);
      setActiveFilter("tenant");
    } catch (err) {
      console.error("Failed to filter by tenant", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchByVehicle = async () => {
    const id = Number(filterVehicleId);
    if (!id) return;
    setLoading(true);
    try {
      const result = await notifications.getByVehicle(id);
      setData(result);
      setActiveFilter("vehicle");
    } catch (err) {
      console.error("Failed to filter by vehicle", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notifications.markAsRead(id);
      if (activeFilter === "tenant") {
        await fetchByTenant();
      } else if (activeFilter === "vehicle") {
        await fetchByVehicle();
      } else {
        await fetchAll();
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: NotificationDto = {
        tenantId: form.tenantId ? Number(form.tenantId) : null,
        vehicleId: Number(form.vehicleId),
        title: form.title || null,
        message: form.message || null,
        isRead: false,
        timestampUtc: new Date().toISOString(),
      };
      await notifications.createSample(payload);
      closeModal();
      if (activeFilter === "tenant") {
        await fetchByTenant();
      } else if (activeFilter === "vehicle") {
        await fetchByVehicle();
      } else {
        await fetchAll();
      }
    } catch (err) {
      console.error("Failed to create notification", err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSample = async () => {
    const tId = Number(quickTenantId);
    const vId = Number(quickVehicleId);
    if (!tId || !vId) return;
    setQuickSaving(true);
    try {
      await notifications.createSampleForTenantVehicle(tId, vId);
      if (activeFilter === "tenant") {
        await fetchByTenant();
      } else if (activeFilter === "vehicle") {
        await fetchByVehicle();
      } else {
        await fetchAll();
      }
    } catch (err) {
      console.error("Failed to create quick sample", err);
    } finally {
      setQuickSaving(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="View and manage vehicle notifications"
        action={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-400"
                }`}
              />
              {connected ? "Live" : "Disconnected"}
            </span>
            <button className={btnPrimary} onClick={openCreate}>
              Create Sample Notification
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-end gap-2">
            <FormField label="Tenant ID">
              <input
                className={inputClass}
                type="number"
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
                placeholder="e.g. 1"
              />
            </FormField>
            <button
              className={btnPrimary}
              onClick={fetchByTenant}
              disabled={!filterTenantId}
            >
              Filter
            </button>
          </div>

          <div className="flex items-end gap-2">
            <FormField label="Vehicle ID">
              <input
                className={inputClass}
                type="number"
                value={filterVehicleId}
                onChange={(e) => setFilterVehicleId(e.target.value)}
                placeholder="e.g. 1"
              />
            </FormField>
            <button
              className={btnPrimary}
              onClick={fetchByVehicle}
              disabled={!filterVehicleId}
            >
              Filter
            </button>
          </div>

          <button className={btnSecondary} onClick={fetchAll}>
            Show All
          </button>
        </div>
        {activeFilter !== "none" && (
          <p className="text-xs text-blue-600 mt-2">
            Filtering by {activeFilter === "tenant" ? `Tenant ID: ${filterTenantId}` : `Vehicle ID: ${filterVehicleId}`}
          </p>
        )}
      </div>

      {/* Quick Sample */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Sample</h3>
        <p className="text-xs text-gray-500 mb-3">
          Create a server-generated sample notification for a specific tenant and vehicle.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <FormField label="Tenant ID">
            <input
              className={inputClass}
              type="number"
              value={quickTenantId}
              onChange={(e) => setQuickTenantId(e.target.value)}
              placeholder="e.g. 1"
            />
          </FormField>
          <FormField label="Vehicle ID">
            <input
              className={inputClass}
              type="number"
              value={quickVehicleId}
              onChange={(e) => setQuickVehicleId(e.target.value)}
              placeholder="e.g. 1"
            />
          </FormField>
          <button
            className={btnPrimary}
            onClick={handleQuickSample}
            disabled={!quickTenantId || !quickVehicleId || quickSaving}
          >
            {quickSaving ? "Creating..." : "Create Quick Sample"}
          </button>
        </div>
      </div>

      {/* Notification Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No notifications found.</div>
      ) : (
        <div className="space-y-3">
          {data.map((n, idx) => (
            <div
              key={n.id ?? idx}
              className={`rounded-lg border p-4 transition-colors ${
                n.isRead
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-l-4 border-l-blue-500 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {n.title ?? "Untitled Notification"}
                    </h4>
                    {!n.isRead && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Unread
                      </span>
                    )}
                    {n.isRead && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Read
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {n.message ?? "No message"}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Vehicle ID: <span className="font-medium text-gray-700">{n.vehicleId}</span></span>
                    <span>Tenant ID: <span className="font-medium text-gray-700">{n.tenantId ?? "N/A"}</span></span>
                    <span>Timestamp: <span className="font-medium text-gray-700">{formatTimestamp(n.timestampUtc)}</span></span>
                    {n.id !== undefined && (
                      <span>ID: <span className="font-medium text-gray-700">{n.id}</span></span>
                    )}
                  </div>
                </div>
                {!n.isRead && n.id !== undefined && (
                  <button
                    className="shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => handleMarkAsRead(n.id!)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Sample Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Create Sample Notification"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tenant ID">
            <input
              className={inputClass}
              type="number"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              placeholder="Optional"
            />
          </FormField>

          <FormField label="Vehicle ID">
            <input
              className={inputClass}
              type="number"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              placeholder="Required"
              required
            />
          </FormField>

          <FormField label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notification title"
            />
          </FormField>

          <FormField label="Message">
            <textarea
              className={inputClass}
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Notification message"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnSecondary} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
