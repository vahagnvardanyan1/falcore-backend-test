"use client";

import { useState, useEffect } from "react";

import { geofences } from "@/lib/api";
import type { GeofenceDto } from "@/types";
import { useToast } from "@/context/toast-context";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = {
  vehicleId: "",
  name: "",
  centerLatitude: "",
  centerLongitude: "",
  radiusMeters: "",
};

export default function GeofencesPage() {
  const [data, setData] = useState<GeofenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GeofenceDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<GeofenceDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Check Point state
  const [checkLat, setCheckLat] = useState("");
  const [checkLng, setCheckLng] = useState("");
  const [checkResults, setCheckResults] = useState<GeofenceDto[] | null>(null);
  const [checking, setChecking] = useState(false);
  const { showError } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await geofences.getAll();
      setData(result);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (geofence: GeofenceDto) => {
    setEditing(geofence);
    setForm({
      vehicleId: String(geofence.vehicleId),
      name: geofence.name ?? "",
      centerLatitude: String(geofence.center.latitude),
      centerLongitude: String(geofence.center.longitude),
      radiusMeters: String(geofence.radiusMeters),
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
        name: form.name || null,
        center: {
          latitude: Number(form.centerLatitude),
          longitude: Number(form.centerLongitude),
        },
        radiusMeters: Number(form.radiusMeters),
        triggered: editing?.triggered ?? false,
      };

      if (editing) {
        await geofences.update(editing.id, { id: editing.id, ...payload });
      } else {
        await geofences.create(payload);
      }

      closeModal();
      await fetchData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await geofences.delete(confirmDelete.id);
      setConfirmDelete(null);
      await fetchData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckPoint = async () => {
    if (!checkLat || !checkLng) return;
    setChecking(true);
    try {
      const results = await geofences.contains(
        Number(checkLat),
        Number(checkLng)
      );
      setCheckResults(results);
    } catch (err) {
      showError(err);
    } finally {
      setChecking(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "vehicleId", header: "Vehicle ID" },
    { key: "name", header: "Name" },
    {
      key: "centerLat",
      header: "Center Lat",
      render: (g: GeofenceDto) => g.center.latitude.toFixed(6),
    },
    {
      key: "centerLng",
      header: "Center Lng",
      render: (g: GeofenceDto) => g.center.longitude.toFixed(6),
    },
    {
      key: "radiusMeters",
      header: "Radius (m)",
      render: (g: GeofenceDto) => g.radiusMeters.toFixed(1),
    },
    {
      key: "triggered",
      header: "Triggered",
      render: (g: GeofenceDto) =>
        g.triggered ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            No
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Geofences"
        description="Manage geofence zones and check point containment"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Geofence
          </button>
        }
      />

      {/* Check Point Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Check Point Containment
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Latitude
            </label>
            <input
              className={inputClass + " w-40"}
              type="number"
              step="any"
              value={checkLat}
              onChange={(e) => setCheckLat(e.target.value)}
              placeholder="e.g. 40.7128"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Longitude
            </label>
            <input
              className={inputClass + " w-40"}
              type="number"
              step="any"
              value={checkLng}
              onChange={(e) => setCheckLng(e.target.value)}
              placeholder="e.g. -74.0060"
            />
          </div>
          <button
            className={btnPrimary}
            onClick={handleCheckPoint}
            disabled={checking || !checkLat || !checkLng}
          >
            {checking ? "Checking..." : "Check"}
          </button>
        </div>

        {checkResults !== null && (
          <div className="mt-4">
            {checkResults.length === 0 ? (
              <p className="text-sm text-gray-500">
                No geofences contain this point.
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{checkResults.length}</span>{" "}
                  geofence{checkResults.length !== 1 ? "s" : ""} contain this
                  point:
                </p>
                <div className="flex flex-wrap gap-2">
                  {checkResults.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {g.name ?? `Geofence #${g.id}`} (Vehicle {g.vehicleId})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={openEdit}
        onDelete={(g) => setConfirmDelete(g)}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Geofence" : "Add Geofence"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle ID">
            <input
              className={inputClass}
              type="number"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              placeholder="Vehicle ID"
              required
            />
          </FormField>

          <FormField label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Geofence name (optional)"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Center Latitude">
              <input
                className={inputClass}
                type="number"
                step="any"
                value={form.centerLatitude}
                onChange={(e) =>
                  setForm({ ...form, centerLatitude: e.target.value })
                }
                placeholder="e.g. 40.7128"
                required
              />
            </FormField>

            <FormField label="Center Longitude">
              <input
                className={inputClass}
                type="number"
                step="any"
                value={form.centerLongitude}
                onChange={(e) =>
                  setForm({ ...form, centerLongitude: e.target.value })
                }
                placeholder="e.g. -74.0060"
                required
              />
            </FormField>
          </div>

          <FormField label="Radius (meters)">
            <input
              className={inputClass}
              type="number"
              step="any"
              min="0"
              value={form.radiusMeters}
              onChange={(e) =>
                setForm({ ...form, radiusMeters: e.target.value })
              }
              placeholder="e.g. 500"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={closeModal}
            >
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
        title="Delete Geofence"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete geofence{" "}
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
