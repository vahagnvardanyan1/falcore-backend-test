"use client";

import { useState, useEffect } from "react";

import { vehicleInsurances } from "@/lib/api";
import type { VehicleInsuranceDto } from "@/types";
import { useToast } from "@/context/toast-context";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = {
  vehicleId: 1,
  provider: "",
  expiryDate: "",
};

function isExpired(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + "T00:00:00");
  return expiry < today;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function VehicleInsurancesPage() {
  const [data, setData] = useState<VehicleInsuranceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleInsuranceDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterVehicleId, setFilterVehicleId] = useState("");
  const { showError } = useToast();

  async function load() {
    setLoading(true);
    try {
      if (filterVehicleId.trim() !== "") {
        const vid = Number(filterVehicleId);
        if (!isNaN(vid) && vid > 0) {
          const list = await vehicleInsurances.getByVehicle(vid);
          setData(list);
        } else {
          setData([]);
        }
      } else {
        const list = await vehicleInsurances.getAll();
        setData(list);
      }
    } catch (err) {
      showError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVehicleId]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(insurance: VehicleInsuranceDto) {
    setEditing(insurance);
    setForm({
      vehicleId: insurance.vehicleId,
      provider: insurance.provider ?? "",
      expiryDate: insurance.expiryDate.split("T")[0],
    });
    setModalOpen(true);
  }

  async function handleDelete(insurance: VehicleInsuranceDto) {
    if (!confirm(`Delete insurance #${insurance.id} for vehicle ${insurance.vehicleId}?`)) return;
    try {
      await vehicleInsurances.delete(insurance.id);
      await load();
    } catch (err) {
      showError(err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(form.vehicleId),
        provider: form.provider || null,
        expiryDate: form.expiryDate,
      };
      if (editing) {
        await vehicleInsurances.update(editing.id, { id: editing.id, ...payload });
      } else {
        await vehicleInsurances.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "vehicleId", header: "Vehicle ID" },
    {
      key: "provider",
      header: "Provider",
      render: (ins: VehicleInsuranceDto) => ins.provider ?? "-",
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (ins: VehicleInsuranceDto) => formatDate(ins.expiryDate.split("T")[0]),
    },
    {
      key: "status",
      header: "Status",
      render: (ins: VehicleInsuranceDto) => {
        const dateStr = ins.expiryDate.split("T")[0];
        const expired = isExpired(dateStr);
        return (
          <span
            className={
              expired
                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            }
          >
            {expired ? "Expired" : "Active"}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Insurances"
        description="Manage insurance policies for your vehicles"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Insurance
          </button>
        }
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FormField label="Filter by Vehicle ID">
            <input
              type="number"
              className={inputClass}
              placeholder="Enter Vehicle ID to filter..."
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              min={1}
              style={{ width: 240 }}
            />
          </FormField>
          {filterVehicleId && (
            <button
              className={btnSecondary + " mt-6"}
              onClick={() => setFilterVehicleId("")}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Insurance" : "Add Insurance"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle ID">
            <input
              type="number"
              className={inputClass}
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: Number(e.target.value) })}
              min={1}
              required
            />
          </FormField>

          <FormField label="Provider">
            <input
              className={inputClass}
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="e.g. Allianz, AXA, State Farm"
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
