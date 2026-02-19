import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
  createVehiclePartPayload,
} from "./fixtures/test-data";

test.describe.serial("Vehicle Parts — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;
  let partId: number;
  let partPayload: ReturnType<typeof createVehiclePartPayload>;

  test.afterAll(async () => {
    if (partId) await deleteResource("/api/VehicleParts", partId);
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

  test("CREATE — POST /api/VehicleParts", async ({ api }) => {
    partPayload = createVehiclePartPayload(vehicleId);
    const res = await api.post("/api/VehicleParts", { data: partPayload });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(partPayload.name);
    expect(body.partNumber).toBe(partPayload.partNumber);
    partId = body.id;
  });

  test("READ — GET /api/VehicleParts (list all)", async ({ api }) => {
    const res = await api.get("/api/VehicleParts");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((p: { id: number }) => p.id === partId)).toBe(true);
  });

  test("READ — GET /api/VehicleParts/vehicle/:vehicleId", async ({ api }) => {
    const res = await api.get(`/api/VehicleParts/vehicle/${vehicleId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((p: { id: number }) => p.id === partId)).toBe(true);
  });

  test("READ — GET /api/VehicleParts/:id", async ({ api }) => {
    const res = await api.get(`/api/VehicleParts/${partId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(partId);
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.name).toBe(partPayload.name);
  });

  test("UPDATE — PUT /api/VehicleParts/:id", async ({ api }) => {
    const updated = {
      ...partPayload,
      id: partId,
      name: "Updated Part",
    };
    const putRes = await api.put(`/api/VehicleParts/${partId}`, {
      data: updated,
    });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/VehicleParts/${partId}`);
    const body = await getRes.json();
    expect(body.name).toBe("Updated Part");
  });

  test("DELETE — DELETE /api/VehicleParts/:id", async ({ api }) => {
    const p = createVehiclePartPayload(vehicleId);
    const createRes = await api.post("/api/VehicleParts", { data: p });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/VehicleParts/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/VehicleParts/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe("Vehicle Parts — Error cases", () => {
  test("GET non-existent part returns 404", async ({ api }) => {
    const res = await api.get("/api/VehicleParts/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent part returns 404", async ({ api }) => {
    const res = await api.put("/api/VehicleParts/999999", {
      data: { id: 999999, ...createVehiclePartPayload(1) },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent part returns 404", async ({ api }) => {
    const res = await api.delete("/api/VehicleParts/999999");
    expect(res.status()).toBe(404);
  });
});
