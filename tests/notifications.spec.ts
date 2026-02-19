import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
  createNotificationPayload,
} from "./fixtures/test-data";

test.describe.serial("Notifications — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;

  test.afterAll(async () => {
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

  test("CREATE — POST /api/Notifications/sample (with body)", async ({
    api,
  }) => {
    const payload = createNotificationPayload(tenantId, vehicleId);
    const res = await api.post("/api/Notifications/sample", { data: payload });
    expect([200, 201, 202]).toContain(res.status());
  });

  test("CREATE — POST /api/Notifications/sample/:tenantId/:vehicleId", async ({
    api,
  }) => {
    const res = await api.post(
      `/api/Notifications/sample/${tenantId}/${vehicleId}`
    );
    expect([200, 201, 202]).toContain(res.status());
  });

  test("READ — GET /api/Notifications (list all)", async ({ api }) => {
    const res = await api.get("/api/Notifications");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("READ — GET /api/Notifications/tenant/:tenantId", async ({ api }) => {
    const res = await api.get(`/api/Notifications/tenant/${tenantId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("READ — GET /api/Notifications/vehicle/:vehicleId", async ({ api }) => {
    // Wait for async notification processing
    await new Promise((r) => setTimeout(r, 1000));
    const res = await api.get(`/api/Notifications/vehicle/${vehicleId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].vehicleId).toBe(vehicleId);
  });

  test("READ — GET /api/Notifications/:id (known valid id)", async ({
    api,
  }) => {
    // Try to find a notification that has an id
    const listRes = await api.get("/api/Notifications");
    const notifications = await listRes.json();
    const withId = notifications.find(
      (n: { id?: number }) => n.id !== undefined
    );

    if (withId) {
      const res = await api.get(`/api/Notifications/${withId.id}`);
      expect(res.status()).toBe(200);
    }
  });

  test("UPDATE — PUT /api/Notifications/:id/mark-as-read (known valid id)", async ({
    api,
  }) => {
    const listRes = await api.get("/api/Notifications");
    const notifications = await listRes.json();
    const withId = notifications.find(
      (n: { id?: number }) => n.id !== undefined
    );

    if (withId) {
      const putRes = await api.put(
        `/api/Notifications/${withId.id}/mark-as-read`
      );
      expect([200, 204]).toContain(putRes.status());
    }
  });
});

test.describe("Notifications — Error cases", () => {
  test("GET non-existent notification returns 404", async ({ api }) => {
    const res = await api.get("/api/Notifications/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT mark-as-read non-existent notification returns 404", async ({
    api,
  }) => {
    const res = await api.put("/api/Notifications/999999/mark-as-read");
    expect(res.status()).toBe(404);
  });
});
