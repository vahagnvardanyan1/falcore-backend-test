import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
  createFuelAlertPayload,
} from "./fixtures/test-data";

test.describe.serial("Fuel Alerts — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;
  let alertId: number;
  let alertPayload: ReturnType<typeof createFuelAlertPayload>;

  test.afterAll(async () => {
    if (alertId) await deleteResource("/api/FuelAlerts", alertId);
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

  test("CREATE — POST /api/FuelAlerts", async ({ api }) => {
    alertPayload = createFuelAlertPayload(vehicleId);
    const res = await api.post("/api/FuelAlerts", { data: alertPayload });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(alertPayload.name);
    expect(body.thresholdValue).toBe(alertPayload.thresholdValue);
    alertId = body.id;
  });

  test("READ — GET /api/FuelAlerts/vehicle/:vehicleId", async ({ api }) => {
    const res = await api.get(`/api/FuelAlerts/vehicle/${vehicleId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((a: { id: number }) => a.id === alertId)).toBe(true);
  });

  test("READ — GET /api/FuelAlerts/:id", async ({ api }) => {
    const res = await api.get(`/api/FuelAlerts/${alertId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(alertId);
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(alertPayload.name);
  });

  test("UPDATE — PUT /api/FuelAlerts/:id", async ({ api }) => {
    const updated = {
      ...alertPayload,
      id: alertId,
      name: "Updated Alert",
      thresholdValue: 25,
    };
    const putRes = await api.put(`/api/FuelAlerts/${alertId}`, {
      data: updated,
    });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/FuelAlerts/${alertId}`);
    const body = await getRes.json();
    expect(body.name).toBe("Updated Alert");
    expect(body.thresholdValue).toBe(25);
  });

  test("DELETE — DELETE /api/FuelAlerts/:id", async ({ api }) => {
    // Create a separate alert to delete
    const p = createFuelAlertPayload(vehicleId);
    const createRes = await api.post("/api/FuelAlerts", { data: p });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/FuelAlerts/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/FuelAlerts/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe("Fuel Alerts — Error cases", () => {
  test("GET non-existent fuel alert returns 404", async ({ api }) => {
    const res = await api.get("/api/FuelAlerts/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent fuel alert returns 404", async ({ api }) => {
    const res = await api.put("/api/FuelAlerts/999999", {
      data: { id: 999999, ...createFuelAlertPayload(1) },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent fuel alert returns 404", async ({ api }) => {
    const res = await api.delete("/api/FuelAlerts/999999");
    expect(res.status()).toBe(404);
  });
});
