export interface FuelAlertDto {
  id: number;
  vehicleId: number;
  name: string | null;
  thresholdValue: number;
  alertType: FuelAlertTypeDto;
  triggered: boolean;
}

export enum FuelAlertTypeDto {
  Low = 0,
  Critical = 1,
}

export interface PointDto {
  latitude: number;
  longitude: number;
}

export interface GeofenceDto {
  id: number;
  vehicleId: number;
  name: string | null;
  center: PointDto;
  radiusMeters: number;
  triggered: boolean;
}

export interface GpsPositionDto {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  timestampUtc: string;
  odometerKm: number | null;
  speedKph: number | null;
  engineOn: boolean | null;
  fuelLevelLiters: number | null;
}

export interface NotificationDto {
  id?: number;
  tenantId: number | null;
  vehicleId: number;
  title: string | null;
  message: string | null;
  isRead: boolean;
  timestampUtc: string;
}

export interface TenantDto {
  id: number;
  name: string | null;
  address: string | null;
  slug: string | null;
  apiKey: string;
}

export interface VehicleDto {
  id: number;
  plateNumber: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number;
  totalMileage: number;
  tenantId: number;
}

export interface VehicleInsuranceDto {
  id: number;
  vehicleId: number;
  provider: string | null;
  expiryDate: string;
}

export interface VehiclePartDto {
  id: number;
  vehicleId: number;
  name: string | null;
  partNumber: string | null;
  serviceIntervalKm: number;
  lastServiceOdometerKm: number;
  nextServiceOdometerKm: number;
}

export interface VehicleTechnicalInspectionDto {
  id: number;
  vehicleId: number;
  expiryDate: string;
}
