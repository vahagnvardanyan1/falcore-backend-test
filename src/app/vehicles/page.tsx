"use client";

import { useState, useEffect } from "react";

import { vehicles } from "@/lib/api";
import type { VehicleDto } from "@/types";
import { useToast } from "@/context/toast-context";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = {
  plateNumber: "",
  vin: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  totalMileage: 0,
  tenantId: 1,
};

export default function VehiclesPage() {
  const [data, setData] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [infoMap, setInfoMap] = useState<Record<number, string>>({});
  const { showError } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await vehicles.getAll();
      setData(list);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (vehicle: VehicleDto) => {
    setEditing(vehicle);
    setForm({
      plateNumber: vehicle.plateNumber ?? "",
      vin: vehicle.vin ?? "",
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      year: vehicle.year,
      totalMileage: vehicle.totalMileage,
      tenantId: vehicle.tenantId,
    });
    setModalOpen(true);
  };

  const handleDelete = async (vehicle: VehicleDto) => {
    if (!confirm(`Delete vehicle "${vehicle.plateNumber || vehicle.vin || vehicle.id}"?`)) return;
    try {
      await vehicles.delete(vehicle.id);
      await load();
    } catch (err) {
      showError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        plateNumber: form.plateNumber || null,
        vin: form.vin || null,
        make: form.make || null,
        model: form.model || null,
        year: Number(form.year),
        totalMileage: Number(form.totalMileage),
        tenantId: Number(form.tenantId),
      };
      if (editing) {
        await vehicles.update(editing.id, { id: editing.id, ...payload });
      } else {
        await vehicles.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const fetchFuelLevel = async (id: number) => {
    setInfoMap((prev) => ({ ...prev, [id]: "Loading fuel level..." }));
    try {
      const level = await vehicles.getFuelLevel(id);
      setInfoMap((prev) => ({ ...prev, [id]: `Fuel Level: ${level} L` }));
    } catch (err) {
      showError(err);
      setInfoMap((prev) => ({ ...prev, [id]: "Fuel level unavailable" }));
    }
  };

  const fetchLastPosition = async (id: number) => {
    setInfoMap((prev) => ({ ...prev, [id]: "Loading position..." }));
    try {
      const pos = await vehicles.getLastPosition(id);
      setInfoMap((prev) => ({
        ...prev,
        [id]: `Last Position: ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)} | Speed: ${pos.speedKph ?? "N/A"} kph | ${pos.timestampUtc}`,
      }));
    } catch (err) {
      showError(err);
      setInfoMap((prev) => ({ ...prev, [id]: "Position unavailable" }));
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "plateNumber", header: "Plate Number" },
    { key: "vin", header: "VIN" },
    { key: "make", header: "Make" },
    { key: "model", header: "Model" },
    { key: "year", header: "Year" },
    {
      key: "totalMileage",
      header: "Mileage",
      render: (v: VehicleDto) => `${v.totalMileage.toLocaleString()} km`,
    },
    { key: "tenantId", header: "Tenant ID" },
    {
      key: "_actions",
      header: "Info",
      render: (v: VehicleDto) => (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchFuelLevel(v.id);
              }}
              className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              Fuel Level
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchLastPosition(v.id);
              }}
              className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              Last Position
            </button>
          </div>
          {infoMap[v.id] && (
            <span className="text-xs text-gray-600 max-w-xs truncate block">
              {infoMap[v.id]}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage your vehicle fleet"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Vehicle
          </button>
        }
      />

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
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Plate Number">
            <input
              className={inputClass}
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              placeholder="e.g. AB-123-CD"
            />
          </FormField>

          <FormField label="VIN">
            <input
              className={inputClass}
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              placeholder="Vehicle Identification Number"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Make">
              <input
                className={inputClass}
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="e.g. Toyota"
              />
            </FormField>

            <FormField label="Model">
              <input
                className={inputClass}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Corolla"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Year">
              <input
                type="number"
                className={inputClass}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Mileage (km)">
              <input
                type="number"
                className={inputClass}
                value={form.totalMileage}
                onChange={(e) => setForm({ ...form, totalMileage: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Tenant ID">
              <input
                type="number"
                className={inputClass}
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: Number(e.target.value) })}
              />
            </FormField>
          </div>

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
