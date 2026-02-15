"use client";

import { useState, useEffect } from "react";

import { gpsPositions, vehicles } from "@/lib/api";
import type { GpsPositionDto, VehicleDto } from "@/types";
import { useToast } from "@/context/toast-context";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = {
  vehicleId: "",
  latitude: "",
  longitude: "",
  timestampUtc: "",
  odometerKm: "",
  speedKph: "",
  engineOn: false,
  fuelLevelLiters: "",
};

export default function GpsPositionsPage() {
  const [vehicleList, setVehicleList] = useState<VehicleDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // ── Report GPS Position ──────────────────────────────────────────────
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Calculate Distance ───────────────────────────────────────────────
  const [distVehicleId, setDistVehicleId] = useState("");
  const [distStart, setDistStart] = useState("");
  const [distEnd, setDistEnd] = useState("");
  const [distResult, setDistResult] = useState<number | null>(null);
  const [distLoading, setDistLoading] = useState(false);
  const [distError, setDistError] = useState("");

  // ── Distance From Last Stop ──────────────────────────────────────────
  const [lastStopVehicleId, setLastStopVehicleId] = useState("");
  const [lastStopResult, setLastStopResult] = useState<number | null>(null);
  const [lastStopLoading, setLastStopLoading] = useState(false);
  const [lastStopError, setLastStopError] = useState("");

  const { showError } = useToast();

  useEffect(() => {
    async function loadVehicles() {
      try {
        const list = await vehicles.getAll();
        setVehicleList(list);
      } catch (err) {
        showError(err);
      } finally {
        setLoadingVehicles(false);
      }
    }
    loadVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Report GPS Position handler ──────────────────────────────────────
  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const payload: Omit<GpsPositionDto, "id"> = {
        vehicleId: Number(form.vehicleId),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        timestampUtc: new Date(form.timestampUtc).toISOString(),
        odometerKm: form.odometerKm ? Number(form.odometerKm) : null,
        speedKph: form.speedKph ? Number(form.speedKph) : null,
        engineOn: form.engineOn,
        fuelLevelLiters: form.fuelLevelLiters ? Number(form.fuelLevelLiters) : null,
      };
      const created = await gpsPositions.create(payload);
      setSubmitMsg({ type: "success", text: `GPS position reported successfully (ID: ${created.id}).` });
      setForm(emptyForm);
    } catch (err: unknown) {
      showError(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitMsg({ type: "error", text: `Failed to report position: ${message}` });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Calculate Distance handler ───────────────────────────────────────
  async function handleCalculateDistance() {
    setDistLoading(true);
    setDistResult(null);
    setDistError("");
    try {
      const start = new Date(distStart).toISOString();
      const end = new Date(distEnd).toISOString();
      const distance = await gpsPositions.getDistance(Number(distVehicleId), start, end);
      setDistResult(distance);
    } catch (err: unknown) {
      showError(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setDistError(`Failed to calculate distance: ${message}`);
    } finally {
      setDistLoading(false);
    }
  }

  // ── Distance From Last Stop handler ──────────────────────────────────
  async function handleLastStopDistance() {
    setLastStopLoading(true);
    setLastStopResult(null);
    setLastStopError("");
    try {
      const distance = await gpsPositions.getDistanceFromLastStop(Number(lastStopVehicleId));
      setLastStopResult(distance);
    } catch (err: unknown) {
      showError(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setLastStopError(`Failed to get distance: ${message}`);
    } finally {
      setLastStopLoading(false);
    }
  }

  function vehicleLabel(v: VehicleDto) {
    const parts = [v.plateNumber, v.make, v.model].filter(Boolean);
    return parts.length > 0 ? `${parts.join(" - ")} (ID: ${v.id})` : `Vehicle #${v.id}`;
  }

  return (
    <div>
      <PageHeader
        title="GPS Positions"
        description="Report GPS positions and calculate distances"
      />

      <div className="space-y-8">
        {/* ── Section 1: Report GPS Position ─────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report GPS Position</h2>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <FormField label="Vehicle">
              <select
                className={inputClass}
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                required
              >
                <option value="">Select a vehicle</option>
                {vehicleList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Latitude">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="e.g. 40.7128"
                  required
                />
              </FormField>

              <FormField label="Longitude">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="e.g. -74.0060"
                  required
                />
              </FormField>
            </div>

            <FormField label="Timestamp (UTC)">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.timestampUtc}
                onChange={(e) => setForm({ ...form, timestampUtc: e.target.value })}
                required
              />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Odometer (km)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.odometerKm}
                  onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>

              <FormField label="Speed (kph)">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.speedKph}
                  onChange={(e) => setForm({ ...form, speedKph: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>

              <FormField label="Fuel Level (L)">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.fuelLevelLiters}
                  onChange={(e) => setForm({ ...form, fuelLevelLiters: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>
            </div>

            <FormField label="Engine On">
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.engineOn}
                  onChange={(e) => setForm({ ...form, engineOn: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Engine is currently running</span>
              </div>
            </FormField>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" className={btnPrimary} disabled={submitting}>
                {submitting ? "Submitting..." : "Report Position"}
              </button>

              {submitMsg && (
                <span
                  className={`text-sm font-medium ${
                    submitMsg.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {submitMsg.text}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ── Section 2: Calculate Distance ──────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculate Distance</h2>

          <div className="space-y-4">
            <FormField label="Vehicle">
              <select
                className={inputClass}
                value={distVehicleId}
                onChange={(e) => setDistVehicleId(e.target.value)}
              >
                <option value="">Select a vehicle</option>
                {vehicleList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={distStart}
                  onChange={(e) => setDistStart(e.target.value)}
                />
              </FormField>

              <FormField label="End Date">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={distEnd}
                  onChange={(e) => setDistEnd(e.target.value)}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                className={btnPrimary}
                disabled={!distVehicleId || !distStart || !distEnd || distLoading}
                onClick={handleCalculateDistance}
              >
                {distLoading ? "Calculating..." : "Calculate"}
              </button>

              {distResult !== null && (
                <span className="text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-1.5 rounded-lg">
                  Distance: {distResult.toFixed(2)} km
                </span>
              )}

              {distError && (
                <span className="text-sm font-medium text-red-600">{distError}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Distance From Last Stop ─────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distance From Last Stop</h2>

          <div className="space-y-4">
            <FormField label="Vehicle">
              <select
                className={inputClass}
                value={lastStopVehicleId}
                onChange={(e) => setLastStopVehicleId(e.target.value)}
              >
                <option value="">Select a vehicle</option>
                {vehicleList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex items-center gap-4 pt-2">
              <button
                className={btnPrimary}
                disabled={!lastStopVehicleId || lastStopLoading}
                onClick={handleLastStopDistance}
              >
                {lastStopLoading ? "Checking..." : "Check"}
              </button>

              {lastStopResult !== null && (
                <span className="text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-1.5 rounded-lg">
                  Distance from last stop: {lastStopResult.toFixed(2)} km
                </span>
              )}

              {lastStopError && (
                <span className="text-sm font-medium text-red-600">{lastStopError}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
