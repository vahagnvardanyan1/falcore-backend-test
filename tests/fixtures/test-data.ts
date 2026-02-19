const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const uuid = () => crypto.randomUUID();

export function createTenantPayload() {
  const tag = uid();
  return {
    name: `Test Tenant ${tag}`,
    address: `123 Test St ${tag}`,
    slug: `test-tenant-${tag}`,
    apiKey: uuid(),
  };
}

export function createVehiclePayload(tenantId: number) {
  const tag = uid();
  return {
    plateNumber: `TEST-${tag}`,
    vin: `VIN${tag}`.slice(0, 17),
    make: "TestMake",
    model: "TestModel",
    year: 2024,
    totalMileage: 10000,
    tenantId,
  };
}

export function createFuelAlertPayload(vehicleId: number) {
  return {
    vehicleId,
    name: `Fuel Alert ${uid()}`,
    thresholdValue: 15,
    alertType: 0,
    triggered: false,
  };
}

export function createGeofencePayload(vehicleId: number) {
  return {
    vehicleId,
    name: `Geofence ${uid()}`,
    center: { latitude: 40.1772, longitude: 44.5035 },
    radiusMeters: 500,
    triggered: false,
  };
}

export function createGpsPositionPayload(vehicleId: number) {
  return {
    vehicleId,
    latitude: 40.1772 + Math.random() * 0.01,
    longitude: 44.5035 + Math.random() * 0.01,
    timestampUtc: new Date().toISOString(),
    odometerKm: 10000 + Math.floor(Math.random() * 100),
    speedKph: 60,
    engineOn: true,
    fuelLevelLiters: 45,
  };
}

export function createNotificationPayload(
  tenantId: number,
  vehicleId: number
) {
  return {
    tenantId,
    vehicleId,
    title: `Notification ${uid()}`,
    message: `Test message ${uid()}`,
    isRead: false,
    timestampUtc: new Date().toISOString(),
  };
}

export function createVehicleInsurancePayload(vehicleId: number) {
  return {
    vehicleId,
    provider: `Insurance Co ${uid()}`,
    expiryDate: "2026-12-31",
  };
}

export function createVehiclePartPayload(vehicleId: number) {
  return {
    vehicleId,
    name: `Part ${uid()}`,
    partNumber: `PN-${uid()}`,
    serviceIntervalKm: 10000,
    lastServiceOdometerKm: 5000,
    nextServiceOdometerKm: 15000,
  };
}

export function createVehicleTechnicalInspectionPayload(vehicleId: number) {
  return {
    vehicleId,
    expiryDate: "2026-12-31",
  };
}
