import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
  createGeofencePayload,
} from "./fixtures/test-data";

test.describe.serial("Geofences — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;
  let geofenceId: number;
  let geofencePayload: ReturnType<typeof createGeofencePayload>;

  test.afterAll(async () => {
    if (geofenceId) await deleteResource("/api/Geofences", geofenceId);
    if (vehicleId) await deleteResource("/api/Vehicles", vehicleId);
    if (tenantId) await deleteResource("/api/Tenants", tenantId);
  });

  test("setup — create tenant and vehicle", async ({ api }) => {
    const tRes = await api.post("/api/Tenants", {
      data: createTenantPayload(),
    });
    tenantId = (await tRes.json()).id;

    const vRes = await api.post("/api/Vehicles", {
      data: createVehiclePayload(tenantId),
    });
    vehicleId = (await vRes.json()).id;
  });

  test("CREATE — POST /api/Geofences", async ({ api }) => {
    geofencePayload = createGeofencePayload(vehicleId);
    const res = await api.post("/api/Geofences", { data: geofencePayload });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(geofencePayload.name);
    expect(body.radiusMeters).toBe(geofencePayload.radiusMeters);
    geofenceId = body.id;
  });

  test("READ — GET /api/Geofences (list all)", async ({ api }) => {
    const res = await api.get("/api/Geofences");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((g: { id: number }) => g.id === geofenceId)).toBe(true);
  });

  test("READ — GET /api/Geofences/vehicle/:vehicleId", async ({ api }) => {
    const res = await api.get(`/api/Geofences/vehicle/${vehicleId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((g: { id: number }) => g.id === geofenceId)).toBe(true);
  });

  test("READ — GET /api/Geofences/:id", async ({ api }) => {
    const res = await api.get(`/api/Geofences/${geofenceId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(geofenceId);
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(geofencePayload.name);
    expect(body.center.latitude).toBe(geofencePayload.center.latitude);
    expect(body.center.longitude).toBe(geofencePayload.center.longitude);
  });

  test("UPDATE — PUT /api/Geofences/:id", async ({ api }) => {
    const updated = {
      ...geofencePayload,
      id: geofenceId,
      name: "Updated Geofence",
      radiusMeters: 1000,
    };
    const putRes = await api.put(`/api/Geofences/${geofenceId}`, {
      data: updated,
    });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/Geofences/${geofenceId}`);
    const body = await getRes.json();
    expect(body.name).toBe("Updated Geofence");
    expect(body.radiusMeters).toBe(1000);
  });

  test("READ — GET /api/Geofences/contains", async ({ api }) => {
    const res = await api.get(
      `/api/Geofences/contains?latitude=40.1772&longitude=44.5035`
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("DELETE — DELETE /api/Geofences/:id", async ({ api }) => {
    // Create a separate geofence to delete
    const p = createGeofencePayload(vehicleId);
    const createRes = await api.post("/api/Geofences", { data: p });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/Geofences/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/Geofences/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe("Geofences — Error cases", () => {
  test("GET non-existent geofence returns 404", async ({ api }) => {
    const res = await api.get("/api/Geofences/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent geofence returns 404", async ({ api }) => {
    const res = await api.put("/api/Geofences/999999", {
      data: { id: 999999, ...createGeofencePayload(1) },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent geofence returns 404", async ({ api }) => {
    const res = await api.delete("/api/Geofences/999999");
    expect(res.status()).toBe(404);
  });
});
