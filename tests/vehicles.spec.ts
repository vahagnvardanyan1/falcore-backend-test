import {
  test,
  expect,
  deleteResource,
  setupTenant,
} from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
} from "./fixtures/test-data";

test.describe.serial("Vehicles — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;
  let vehiclePayload: ReturnType<typeof createVehiclePayload>;

  test.afterAll(async () => {
    if (vehicleId) await deleteResource("/api/Vehicles", vehicleId);
    if (tenantId) await deleteResource("/api/Tenants", tenantId);
  });

  test("setup — create tenant", async ({ api }) => {
    tenantId = await setupTenant(api);
  });

  test("CREATE — POST /api/Vehicles", async ({ api }) => {
    vehiclePayload = createVehiclePayload(tenantId);
    const res = await api.post("/api/Vehicles", { data: vehiclePayload });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.plateNumber).toBe(vehiclePayload.plateNumber);
    expect(body.tenantId).toBe(tenantId);
    vehicleId = body.id;
  });

  test("READ — GET /api/Vehicles (list all)", async ({ api }) => {
    const res = await api.get("/api/Vehicles");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((v: { id: number }) => v.id === vehicleId)).toBe(true);
  });

  test("READ — GET /api/Vehicles/tenant/:tenantId", async ({ api }) => {
    const res = await api.get(`/api/Vehicles/tenant/${tenantId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((v: { id: number }) => v.id === vehicleId)).toBe(true);
  });

  test("READ — GET /api/Vehicles/:id", async ({ api }) => {
    const res = await api.get(`/api/Vehicles/${vehicleId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(vehicleId);
    expect(body.plateNumber).toBe(vehiclePayload.plateNumber);
    expect(body.vin).toBe(vehiclePayload.vin);
    expect(body.make).toBe(vehiclePayload.make);
    expect(body.model).toBe(vehiclePayload.model);
    expect(body.year).toBe(vehiclePayload.year);
  });

  test("UPDATE — PUT /api/Vehicles/:id", async ({ api }) => {
    const updated = {
      ...vehiclePayload,
      id: vehicleId,
      make: "UpdatedMake",
      model: "UpdatedModel",
    };
    const putRes = await api.put(`/api/Vehicles/${vehicleId}`, {
      data: updated,
    });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/Vehicles/${vehicleId}`);
    const body = await getRes.json();
    expect(body.make).toBe("UpdatedMake");
    expect(body.model).toBe("UpdatedModel");
  });

  test("READ — GET /api/Vehicles/fuel-level/:id", async ({ api }) => {
    const res = await api.get(`/api/Vehicles/fuel-level/${vehicleId}`);
    expect([200, 204]).toContain(res.status());
  });

  test("READ — GET /api/Vehicles/:id/last-position", async ({ api }) => {
    const res = await api.get(`/api/Vehicles/${vehicleId}/last-position`);
    expect([200, 404]).toContain(res.status());
  });

  test("DELETE — DELETE /api/Vehicles/:id", async ({ api }) => {
    // Create separate tenant+vehicle to delete
    const tRes = await api.post("/api/Tenants", {
      data: createTenantPayload(),
    });
    const tenant = await tRes.json();
    const vPayload = createVehiclePayload(tenant.id);
    const createRes = await api.post("/api/Vehicles", { data: vPayload });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/Vehicles/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/Vehicles/${created.id}`);
    expect(getRes.status()).toBe(404);

    // Clean up parent tenant
    await deleteResource("/api/Tenants", tenant.id);
  });
});

test.describe("Vehicles — Error cases", () => {
  test("GET non-existent vehicle returns 404", async ({ api }) => {
    const res = await api.get("/api/Vehicles/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent vehicle returns 404", async ({ api }) => {
    const res = await api.put("/api/Vehicles/999999", {
      data: { id: 999999, ...createVehiclePayload(1) },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent vehicle returns 404", async ({ api }) => {
    const res = await api.delete("/api/Vehicles/999999");
    expect(res.status()).toBe(404);
  });

  test("POST with empty payload returns 400", async ({ api }) => {
    const res = await api.post("/api/Vehicles", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET vehicles for non-existent tenant returns empty array", async ({
    api,
  }) => {
    const res = await api.get("/api/Vehicles/tenant/999999");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
