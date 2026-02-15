"use client";

import { useState, useEffect } from "react";
import { vehicleTechnicalInspections } from "@/lib/api";
import type { VehicleTechnicalInspectionDto } from "@/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = { vehicleId: "", expiryDate: "" };

function getStatus(expiryDate: string): { label: string; className: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + "T00:00:00");
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", className: "text-red-600 font-medium" };
  }
  if (diffDays <= 30) {
    return { label: "Expiring Soon", className: "text-orange-500 font-medium" };
  }
  return { label: "Valid", className: "text-green-600 font-medium" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VehicleInspectionsPage() {
  const [data, setData] = useState<VehicleTechnicalInspectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleTechnicalInspectionDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<VehicleTechnicalInspectionDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterVehicleId, setFilterVehicleId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await vehicleTechnicalInspections.getAll();
      setData(result);
    } catch (err) {
      console.error("Failed to load inspections", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = filterVehicleId
    ? data.filter((d) => d.vehicleId === Number(filterVehicleId))
    : data;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (inspection: VehicleTechnicalInspectionDto) => {
    setEditing(inspection);
    setForm({
      vehicleId: String(inspection.vehicleId),
      expiryDate: inspection.expiryDate,
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
        vehicleId: Number(form.vehicleId),
        expiryDate: form.expiryDate,
      };

      if (editing) {
        await vehicleTechnicalInspections.update(editing.id, {
          id: editing.id,
          ...payload,
        });
      } else {
        await vehicleTechnicalInspections.create(payload);
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Failed to save inspection", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await vehicleTechnicalInspections.delete(confirmDelete.id);
      setConfirmDelete(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete inspection", err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "vehicleId", header: "Vehicle ID" },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (item: VehicleTechnicalInspectionDto) => formatDate(item.expiryDate),
    },
    {
      key: "status",
      header: "Status",
      render: (item: VehicleTechnicalInspectionDto) => {
        const status = getStatus(item.expiryDate);
        return <span className={status.className}>{status.label}</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Technical Inspections"
        description="Manage vehicle technical inspection records and track expiry dates"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Inspection
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
        data={filteredData}
        loading={loading}
        onEdit={openEdit}
        onDelete={(item) => setConfirmDelete(item)}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Inspection" : "Add Inspection"}
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

          <FormField label="Expiry Date">
            <input
              type="date"
              className={inputClass}
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
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
        title="Delete Inspection"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete inspection{" "}
          <span className="font-semibold text-gray-900">
            #{confirmDelete?.id}
          </span>{" "}
          for vehicle{" "}
          <span className="font-semibold text-gray-900">
            #{confirmDelete?.vehicleId}
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
