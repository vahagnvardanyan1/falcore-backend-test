"use client";

import { useState, useEffect } from "react";
import { vehicleParts } from "@/lib/api";
import type { VehiclePartDto } from "@/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = {
  vehicleId: "",
  name: "",
  partNumber: "",
  serviceIntervalKm: "",
  lastServiceOdometerKm: "",
  nextServiceOdometerKm: "",
};

function getServiceStatus(part: VehiclePartDto) {
  if (part.nextServiceOdometerKm <= part.lastServiceOdometerKm) {
    return { label: "Overdue", color: "text-red-600" };
  }
  if (part.nextServiceOdometerKm - part.lastServiceOdometerKm < 1000) {
    return { label: "Due Soon", color: "text-orange-500" };
  }
  return { label: "OK", color: "text-green-600" };
}

export default function VehiclePartsPage() {
  const [data, setData] = useState<VehiclePartDto[]>([]);
  const [filtered, setFiltered] = useState<VehiclePartDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehiclePartDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<VehiclePartDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterVehicleId, setFilterVehicleId] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const result = await vehicleParts.getAll();
      setData(result);
    } catch (err) {
      console.error("Failed to load vehicle parts", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (filterVehicleId === "") {
      setFiltered(data);
    } else {
      const vid = Number(filterVehicleId);
      setFiltered(data.filter((p) => p.vehicleId === vid));
    }
  }, [data, filterVehicleId]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (part: VehiclePartDto) => {
    setEditing(part);
    setForm({
      vehicleId: String(part.vehicleId),
      name: part.name ?? "",
      partNumber: part.partNumber ?? "",
      serviceIntervalKm: String(part.serviceIntervalKm),
      lastServiceOdometerKm: String(part.lastServiceOdometerKm),
      nextServiceOdometerKm: String(part.nextServiceOdometerKm),
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
    setSaving(true);
    try {
      const payload = {
        vehicleId: parseInt(form.vehicleId) || 0,
        name: form.name || null,
        partNumber: form.partNumber || null,
        serviceIntervalKm: parseInt(form.serviceIntervalKm) || 0,
        lastServiceOdometerKm: parseInt(form.lastServiceOdometerKm) || 0,
        nextServiceOdometerKm: parseInt(form.nextServiceOdometerKm) || 0,
      };

      if (editing) {
        await vehicleParts.update(editing.id, {
          id: editing.id,
          ...payload,
        });
      } else {
        await vehicleParts.create(payload);
      }

      closeModal();
      await fetchAll();
    } catch (err) {
      console.error("Failed to save vehicle part", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await vehicleParts.delete(confirmDelete.id);
      setConfirmDelete(null);
      await fetchAll();
    } catch (err) {
      console.error("Failed to delete vehicle part", err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "vehicleId", header: "Vehicle ID" },
    {
      key: "name",
      header: "Part Name",
      render: (p: VehiclePartDto) => p.name ?? "-",
    },
    {
      key: "partNumber",
      header: "Part Number",
      render: (p: VehiclePartDto) => p.partNumber ?? "-",
    },
    {
      key: "serviceIntervalKm",
      header: "Service Interval (km)",
      render: (p: VehiclePartDto) => p.serviceIntervalKm.toLocaleString(),
    },
    {
      key: "lastServiceOdometerKm",
      header: "Last Service (km)",
      render: (p: VehiclePartDto) => p.lastServiceOdometerKm.toLocaleString(),
    },
    {
      key: "nextServiceOdometerKm",
      header: "Next Service (km)",
      render: (p: VehiclePartDto) => p.nextServiceOdometerKm.toLocaleString(),
    },
    {
      key: "serviceStatus",
      header: "Service Status",
      render: (p: VehiclePartDto) => {
        const status = getServiceStatus(p);
        return (
          <span className={`font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Parts"
        description="Manage vehicle parts and track service intervals"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Part
          </button>
        }
      />

      {/* Filter by Vehicle ID */}
      <div className="mb-6">
        <FormField label="Filter by Vehicle ID">
          <input
            type="number"
            className={inputClass}
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            placeholder="Enter Vehicle ID to filter (leave empty for all)"
          />
        </FormField>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={(p) => setConfirmDelete(p)}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Vehicle Part" : "Add Vehicle Part"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle ID">
            <input
              type="number"
              className={inputClass}
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              placeholder="e.g. 1"
              required
            />
          </FormField>

          <FormField label="Part Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Oil Filter"
            />
          </FormField>

          <FormField label="Part Number">
            <input
              className={inputClass}
              value={form.partNumber}
              onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
              placeholder="e.g. OF-12345"
            />
          </FormField>

          <FormField label="Service Interval (km)">
            <input
              type="number"
              className={inputClass}
              value={form.serviceIntervalKm}
              onChange={(e) =>
                setForm({ ...form, serviceIntervalKm: e.target.value })
              }
              placeholder="e.g. 10000"
              required
            />
          </FormField>

          <FormField label="Last Service Odometer (km)">
            <input
              type="number"
              className={inputClass}
              value={form.lastServiceOdometerKm}
              onChange={(e) =>
                setForm({ ...form, lastServiceOdometerKm: e.target.value })
              }
              placeholder="e.g. 50000"
              required
            />
          </FormField>

          <FormField label="Next Service Odometer (km)">
            <input
              type="number"
              className={inputClass}
              value={form.nextServiceOdometerKm}
              onChange={(e) =>
                setForm({ ...form, nextServiceOdometerKm: e.target.value })
              }
              placeholder="e.g. 60000"
              required
            />
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
        title="Delete Vehicle Part"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete vehicle part{" "}
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
