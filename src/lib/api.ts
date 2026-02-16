import type {
  DistanceFromLastStopDto,
  FuelAlertDto,
  GeofenceDto,
  GpsPositionDto,
  NotificationDto,
  TenantDto,
  VehicleDto,
  VehicleInsuranceDto,
  VehiclePartDto,
  VehicleTechnicalInspectionDto,
} from "@/types";
import { ApiError } from "@/lib/api-error";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://falcore-backend-production-4bc7.up.railway.app";

const request = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${BASE_URL}${path}`;
  const method = options?.method ?? "GET";
  const requestBody = typeof options?.body === "string" ? options.body : null;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let responseBody: string | null = null;
    try {
      responseBody = await res.text();
    } catch {
      // ignore read failure
    }

    throw new ApiError({
      status: res.status,
      statusText: res.statusText,
      url: path,
      method,
      requestBody,
      responseBody,
      timestamp: new Date().toISOString(),
    });
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

// ── Fuel Alerts ──────────────────────────────────────────────────────

export const fuelAlerts = {
  create: (data: Omit<FuelAlertDto, "id">) =>
    request<FuelAlertDto>("/api/FuelAlerts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getById: (id: number) =>
    request<FuelAlertDto>(`/api/FuelAlerts/${id}`),
  update: (id: number, data: FuelAlertDto) =>
    request<void>(`/api/FuelAlerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/FuelAlerts/${id}`, { method: "DELETE" }),
  getByVehicle: (vehicleId: number) =>
    request<FuelAlertDto[]>(`/api/FuelAlerts/vehicle/${vehicleId}`),
};

// ── Geofences ────────────────────────────────────────────────────────

export const geofences = {
  getAll: () => request<GeofenceDto[]>("/api/Geofences"),
  create: (data: Omit<GeofenceDto, "id">) =>
    request<GeofenceDto>("/api/Geofences", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getByVehicle: (vehicleId: number) =>
    request<GeofenceDto[]>(`/api/Geofences/vehicle/${vehicleId}`),
  getById: (id: number) =>
    request<GeofenceDto>(`/api/Geofences/${id}`),
  update: (id: number, data: GeofenceDto) =>
    request<void>(`/api/Geofences/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/Geofences/${id}`, { method: "DELETE" }),
  contains: (latitude: number, longitude: number) =>
    request<GeofenceDto[]>(
      `/api/Geofences/contains?latitude=${latitude}&longitude=${longitude}`
    ),
};

// ── GPS Positions ────────────────────────────────────────────────────

export const gpsPositions = {
  create: (data: Omit<GpsPositionDto, "id">) =>
    request<GpsPositionDto>("/api/GpsPositions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDistance: (vehicleId: number, start: string, end: string) =>
    request<number>(
      `/api/GpsPositions/distance?vehicleId=${vehicleId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    ),
  getDistanceFromLastStop: (vehicleId: number) =>
    request<DistanceFromLastStopDto>(
      `/api/GpsPositions/distance-from-last-stop?vehicleId=${vehicleId}`
    ),
};

// ── Notifications ────────────────────────────────────────────────────

export const notifications = {
  getAll: () => request<NotificationDto[]>("/api/Notifications"),
  getById: (id: number) =>
    request<NotificationDto>(`/api/Notifications/${id}`),
  getByTenant: (tenantId: number) =>
    request<NotificationDto[]>(`/api/Notifications/tenant/${tenantId}`),
  getByVehicle: (vehicleId: number) =>
    request<NotificationDto[]>(`/api/Notifications/vehicle/${vehicleId}`),
  createSample: (data: NotificationDto) =>
    request<NotificationDto>("/api/Notifications/sample", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createSampleForTenantVehicle: (tenantId: number, vehicleId: number) =>
    request<NotificationDto>(
      `/api/Notifications/sample/${tenantId}/${vehicleId}`,
      { method: "POST" }
    ),
  markAsRead: (id: number) =>
    request<void>(`/api/Notifications/${id}/mark-as-read`, {
      method: "PUT",
    }),
};

// ── Tenants ──────────────────────────────────────────────────────────

export const tenants = {
  getAll: () => request<TenantDto[]>("/api/Tenants"),
  create: (data: Omit<TenantDto, "id">) =>
    request<TenantDto>("/api/Tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getById: (id: number) => request<TenantDto>(`/api/Tenants/${id}`),
  update: (id: number, data: TenantDto) =>
    request<void>(`/api/Tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/Tenants/${id}`, { method: "DELETE" }),
};

// ── Vehicles ─────────────────────────────────────────────────────────

export const vehicles = {
  getAll: () => request<VehicleDto[]>("/api/Vehicles"),
  create: (data: Omit<VehicleDto, "id">) =>
    request<VehicleDto>("/api/Vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getByTenant: (tenantId: number) =>
    request<VehicleDto[]>(`/api/Vehicles/tenant/${tenantId}`),
  getById: (id: number) => request<VehicleDto>(`/api/Vehicles/${id}`),
  update: (id: number, data: VehicleDto) =>
    request<void>(`/api/Vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/Vehicles/${id}`, { method: "DELETE" }),
  getFuelLevel: (id: number) =>
    request<number>(`/api/Vehicles/fuel-level/${id}`),
  getLastPosition: (id: number) =>
    request<GpsPositionDto>(`/api/Vehicles/${id}/last-position`),
};

// ── Vehicle Insurances ───────────────────────────────────────────────

export const vehicleInsurances = {
  getAll: () => request<VehicleInsuranceDto[]>("/api/VehicleInsurances"),
  create: (data: Omit<VehicleInsuranceDto, "id">) =>
    request<VehicleInsuranceDto>("/api/VehicleInsurances", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getByVehicle: (vehicleId: number) =>
    request<VehicleInsuranceDto[]>(
      `/api/VehicleInsurances/vehicle/${vehicleId}`
    ),
  getById: (id: number) =>
    request<VehicleInsuranceDto>(`/api/VehicleInsurances/${id}`),
  update: (id: number, data: VehicleInsuranceDto) =>
    request<void>(`/api/VehicleInsurances/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/VehicleInsurances/${id}`, { method: "DELETE" }),
};

// ── Vehicle Parts ────────────────────────────────────────────────────

export const vehicleParts = {
  getAll: () => request<VehiclePartDto[]>("/api/VehicleParts"),
  create: (data: Omit<VehiclePartDto, "id">) =>
    request<VehiclePartDto>("/api/VehicleParts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getByVehicle: (vehicleId: number) =>
    request<VehiclePartDto[]>(`/api/VehicleParts/vehicle/${vehicleId}`),
  getById: (id: number) =>
    request<VehiclePartDto>(`/api/VehicleParts/${id}`),
  update: (id: number, data: VehiclePartDto) =>
    request<void>(`/api/VehicleParts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/VehicleParts/${id}`, { method: "DELETE" }),
};

// ── Vehicle Technical Inspections ────────────────────────────────────

export const vehicleTechnicalInspections = {
  getAll: () =>
    request<VehicleTechnicalInspectionDto[]>(
      "/api/VehicleTechnicalInspections"
    ),
  create: (data: Omit<VehicleTechnicalInspectionDto, "id">) =>
    request<VehicleTechnicalInspectionDto>(
      "/api/VehicleTechnicalInspections",
      { method: "POST", body: JSON.stringify(data) }
    ),
  getByVehicle: (vehicleId: number) =>
    request<VehicleTechnicalInspectionDto[]>(
      `/api/VehicleTechnicalInspections/vehicle/${vehicleId}`
    ),
  getById: (id: number) =>
    request<VehicleTechnicalInspectionDto>(
      `/api/VehicleTechnicalInspections/${id}`
    ),
  update: (id: number, data: VehicleTechnicalInspectionDto) =>
    request<void>(`/api/VehicleTechnicalInspections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/VehicleTechnicalInspections/${id}`, {
      method: "DELETE",
    }),
};
