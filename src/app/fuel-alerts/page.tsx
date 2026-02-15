"use client";

import { useState, useEffect } from "react";
import { fuelAlerts, vehicles } from "@/lib/api";
import type { FuelAlertDto, VehicleDto, FuelAlertTypeDto } from "@/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = { name: "", thresholdValue: "", alertType: "0" };

export default function FuelAlertsPage() {
  const [vehicleList, setVehicleList] = useState<VehicleDto[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [data, setData] = useState<FuelAlertDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FuelAlertDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<FuelAlertDto | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const result = await vehicles.getAll();
        setVehicleList(result);
      } catch (err) {
        console.error("Failed to load vehicles", err);
      } finally {
        setLoadingVehicles(false);
      }
    }
    loadVehicles();
  }, []);

  const fetchAlerts = async (vehicleId: number) => {
    setLoading(true);
    try {
      const result = await fuelAlerts.getByVehicle(vehicleId);
      setData(result);
    } catch (err) {
      console.error("Failed to load fuel alerts", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSelectedVehicleId(null);
      setData([]);
    } else {
      const id = Number(value);
      setSelectedVehicleId(id);
      fetchAlerts(id);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (alert: FuelAlertDto) => {
    setEditing(alert);
    setForm({
      name: alert.name ?? "",
      thresholdValue: String(alert.thresholdValue),
      alertType: String(alert.alertType),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setSaving(true);
    try {
      const payload = {
        vehicleId: selectedVehicleId,
        name: form.name || null,
        thresholdValue: parseFloat(form.thresholdValue) || 0,
        alertType: Number(form.alertType) as FuelAlertTypeDto,
        triggered: false,
      };

      if (editing) {
        await fuelAlerts.update(editing.id, {
          id: editing.id,
          ...payload,
          triggered: editing.triggered,
        });
      } else {
        await fuelAlerts.create(payload);
      }

      closeModal();
      await fetchAlerts(selectedVehicleId);
    } catch (err) {
      console.error("Failed to save fuel alert", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !selectedVehicleId) return;
    setSaving(true);
    try {
      await fuelAlerts.delete(confirmDelete.id);
      setConfirmDelete(null);
      await fetchAlerts(selectedVehicleId);
    } catch (err) {
      console.error("Failed to delete fuel alert", err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    {
      key: "thresholdValue",
      header: "Threshold",
      render: (a: FuelAlertDto) => a.thresholdValue.toFixed(2),
    },
    {
      key: "alertType",
      header: "Alert Type",
      render: (a: FuelAlertDto) => (a.alertType === 1 ? "Critical" : "Low"),
    },
    {
      key: "triggered",
      header: "Triggered",
      render: (a: FuelAlertDto) => (
        <span
          className={
            a.triggered
              ? "text-red-600 font-medium"
              : "text-green-600 font-medium"
          }
        >
          {a.triggered ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fuel Alerts"
        description="Manage fuel level alerts per vehicle"
        action={
          selectedVehicleId ? (
            <button className={btnPrimary} onClick={openCreate}>
              Add Fuel Alert
            </button>
          ) : undefined
        }
      />

      {/* Vehicle Selector */}
      <div className="mb-6">
        <FormField label="Select Vehicle">
          {loadingVehicles ? (
            <p className="text-sm text-gray-500 py-2">Loading vehicles...</p>
          ) : (
            <select
              className={inputClass}
              value={selectedVehicleId ?? ""}
              onChange={handleVehicleChange}
            >
              <option value="">-- Select a vehicle --</option>
              {vehicleList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.year}) - {v.plateNumber || `ID ${v.id}`}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {/* Data Table */}
      {selectedVehicleId ? (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={(a) => setConfirmDelete(a)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Please select a vehicle to view its fuel alerts.
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Fuel Alert" : "Add Fuel Alert"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alert name"
            />
          </FormField>

          <FormField label="Threshold Value">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={form.thresholdValue}
              onChange={(e) =>
                setForm({ ...form, thresholdValue: e.target.value })
              }
              placeholder="e.g. 15.0"
              required
            />
          </FormField>

          <FormField label="Alert Type">
            <select
              className={inputClass}
              value={form.alertType}
              onChange={(e) => setForm({ ...form, alertType: e.target.value })}
            >
              <option value="0">Low</option>
              <option value="1">Critical</option>
            </select>
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnSecondary} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Fuel Alert"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete fuel alert{" "}
          <span className="font-semibold text-gray-900">
            {confirmDelete?.name ?? `#${confirmDelete?.id}`}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className={btnSecondary}
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
