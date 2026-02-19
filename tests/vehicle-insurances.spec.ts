import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import {
  createTenantPayload,
  createVehiclePayload,
  createVehicleInsurancePayload,
} from "./fixtures/test-data";

test.describe.serial("Vehicle Insurances — CRUD lifecycle", () => {
  let tenantId: number;
  let vehicleId: number;
  let insuranceId: number;
  let insurancePayload: ReturnType<typeof createVehicleInsurancePayload>;

  test.afterAll(async () => {
    if (insuranceId)
      await deleteResource("/api/VehicleInsurances", insuranceId);
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

  test("CREATE — POST /api/VehicleInsurances", async ({ api }) => {
    insurancePayload = createVehicleInsurancePayload(vehicleId);
    const res = await api.post("/api/VehicleInsurances", {
      data: insurancePayload,
    });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.provider).toBe(insurancePayload.provider);
    insuranceId = body.id;
  });

  test("READ — GET /api/VehicleInsurances (list all)", async ({ api }) => {
    const res = await api.get("/api/VehicleInsurances");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((i: { id: number }) => i.id === insuranceId)).toBe(true);
  });

  test("READ — GET /api/VehicleInsurances/vehicle/:vehicleId", async ({
    api,
  }) => {
    const res = await api.get(
      `/api/VehicleInsurances/vehicle/${vehicleId}`
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((i: { id: number }) => i.id === insuranceId)).toBe(true);
  });

  test("READ — GET /api/VehicleInsurances/:id", async ({ api }) => {
    const res = await api.get(`/api/VehicleInsurances/${insuranceId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(insuranceId);
    expect(body.vehicleId).toBe(vehicleId);
    expect(body.provider).toBe(insurancePayload.provider);
  });

  test("UPDATE — PUT /api/VehicleInsurances/:id", async ({ api }) => {
    const updated = {
      ...insurancePayload,
      id: insuranceId,
      provider: "Updated Insurance Co",
      expiryDate: "2027-06-30",
    };
    const putRes = await api.put(`/api/VehicleInsurances/${insuranceId}`, {
      data: updated,
    });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/VehicleInsurances/${insuranceId}`);
    const body = await getRes.json();
    expect(body.provider).toBe("Updated Insurance Co");
  });

  test("DELETE — DELETE /api/VehicleInsurances/:id", async ({ api }) => {
    const p = createVehicleInsurancePayload(vehicleId);
    const createRes = await api.post("/api/VehicleInsurances", { data: p });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/VehicleInsurances/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/VehicleInsurances/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe("Vehicle Insurances — Error cases", () => {
  test("GET non-existent insurance returns 404", async ({ api }) => {
    const res = await api.get("/api/VehicleInsurances/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent insurance returns 404", async ({ api }) => {
    const res = await api.put("/api/VehicleInsurances/999999", {
      data: { id: 999999, ...createVehicleInsurancePayload(1) },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent insurance returns 404", async ({ api }) => {
    const res = await api.delete("/api/VehicleInsurances/999999");
    expect(res.status()).toBe(404);
  });
});
