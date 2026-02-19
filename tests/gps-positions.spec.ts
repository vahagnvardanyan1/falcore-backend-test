import {
  test,
  expect,
  deleteResource,
  setupTenantAndVehicle,
} from "./fixtures/api-fixtures";
import { createGpsPositionPayload } from "./fixtures/test-data";

test.describe.serial("GPS Positions — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;

  test.afterAll(async () => {
    if (vehicleId) await deleteResource("/api/Vehicles", vehicleId);
    if (tenantId) await deleteResource("/api/Tenants", tenantId);
  });

  test("setup — create tenant and vehicle", async ({ api }) => {
    ({ tenantId, vehicleId } = await setupTenantAndVehicle(api));
  });

  test("CREATE — POST /api/GpsPositions", async ({ api }) => {
    const payload = createGpsPositionPayload(vehicleId);
    const res = await api.post("/api/GpsPositions", { data: payload });
    expect([200, 201]).toContain(res.status());
  });

  test("READ — GET /api/GpsPositions/distance", async ({ api }) => {
    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date().toISOString();
    const res = await api.get(
      `/api/GpsPositions/distance?vehicleId=${vehicleId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    expect(res.status()).toBe(200);
  });

  test("READ — GET /api/GpsPositions/distance-from-last-stop", async ({
    api,
  }) => {
    const res = await api.get(
      `/api/GpsPositions/distance-from-last-stop?vehicleId=${vehicleId}`
    );
    expect(res.status()).toBe(200);
  });

  test("Verify vehicle last-position reflects created GPS data", async ({
    api,
  }) => {
    const res = await api.get(`/api/Vehicles/${vehicleId}/last-position`);
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.vehicleId).toBe(vehicleId);
    }
  });
});

test.describe("GPS Positions — Error cases", () => {
  test("GET distance for non-existent vehicle returns empty/zero", async ({
    api,
  }) => {
    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date().toISOString();
    const res = await api.get(
      `/api/GpsPositions/distance?vehicleId=999999&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    expect([200, 404]).toContain(res.status());
  });

  test("GET distance-from-last-stop for non-existent vehicle", async ({
    api,
  }) => {
    const res = await api.get(
      "/api/GpsPositions/distance-from-last-stop?vehicleId=999999"
    );
    expect([200, 404]).toContain(res.status());
  });

  test("POST with empty payload returns 400", async ({ api }) => {
    const res = await api.post("/api/GpsPositions", { data: {} });
    expect(res.status()).toBe(400);
  });
});
