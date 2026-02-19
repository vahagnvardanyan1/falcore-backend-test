import {
  test,
  expect,
  deleteResource,
  setupTenantAndVehicle,
} from "./fixtures/api-fixtures";
import { createVehicleTechnicalInspectionPayload } from "./fixtures/test-data";

test.describe.serial(
  "Vehicle Technical Inspections — CRUD lifecycle",
  () => {
    let tenantId: number;
    let vehicleId: number;
    let inspectionId: number;
    let inspectionPayload: ReturnType<
      typeof createVehicleTechnicalInspectionPayload
    >;

    test.afterAll(async () => {
      if (inspectionId)
        await deleteResource(
          "/api/VehicleTechnicalInspections",
          inspectionId
        );
      if (vehicleId) await deleteResource("/api/Vehicles", vehicleId);
      if (tenantId) await deleteResource("/api/Tenants", tenantId);
    });

    test("setup — create tenant and vehicle", async ({ api }) => {
      ({ tenantId, vehicleId } = await setupTenantAndVehicle(api));
    });

    test("CREATE — POST /api/VehicleTechnicalInspections", async ({
      api,
    }) => {
      inspectionPayload =
        createVehicleTechnicalInspectionPayload(vehicleId);
      const res = await api.post("/api/VehicleTechnicalInspections", {
        data: inspectionPayload,
      });
      expect([200, 201]).toContain(res.status());

      const body = await res.json();
      expect(body).toHaveProperty("id");
      expect(body.vehicleId).toBe(vehicleId);
      inspectionId = body.id;
    });

    test("READ — GET /api/VehicleTechnicalInspections (list all)", async ({
      api,
    }) => {
      const res = await api.get("/api/VehicleTechnicalInspections");
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((i: { id: number }) => i.id === inspectionId)).toBe(
        true
      );
    });

    test("READ — GET /api/VehicleTechnicalInspections/vehicle/:vehicleId", async ({
      api,
    }) => {
      const res = await api.get(
        `/api/VehicleTechnicalInspections/vehicle/${vehicleId}`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((i: { id: number }) => i.id === inspectionId)).toBe(
        true
      );
    });

    test("READ — GET /api/VehicleTechnicalInspections/:id", async ({
      api,
    }) => {
      const res = await api.get(
        `/api/VehicleTechnicalInspections/${inspectionId}`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.id).toBe(inspectionId);
      expect(body.vehicleId).toBe(vehicleId);
    });

    test("UPDATE — PUT /api/VehicleTechnicalInspections/:id", async ({
      api,
    }) => {
      const updated = {
        ...inspectionPayload,
        id: inspectionId,
        expiryDate: "2028-01-15",
      };
      const putRes = await api.put(
        `/api/VehicleTechnicalInspections/${inspectionId}`,
        { data: updated }
      );
      expect([200, 204]).toContain(putRes.status());

      const getRes = await api.get(
        `/api/VehicleTechnicalInspections/${inspectionId}`
      );
      const body = await getRes.json();
      expect(body.expiryDate).toContain("2028");
    });

    test("DELETE — DELETE /api/VehicleTechnicalInspections/:id", async ({
      api,
    }) => {
      const p = createVehicleTechnicalInspectionPayload(vehicleId);
      const createRes = await api.post("/api/VehicleTechnicalInspections", {
        data: p,
      });
      const created = await createRes.json();

      const delRes = await api.delete(
        `/api/VehicleTechnicalInspections/${created.id}`
      );
      expect([200, 204]).toContain(delRes.status());

      const getRes = await api.get(
        `/api/VehicleTechnicalInspections/${created.id}`
      );
      expect(getRes.status()).toBe(404);
    });
  }
);

test.describe("Vehicle Technical Inspections — Error cases", () => {
  test("GET non-existent inspection returns 404", async ({ api }) => {
    const res = await api.get("/api/VehicleTechnicalInspections/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent inspection returns 404", async ({ api }) => {
    const res = await api.put("/api/VehicleTechnicalInspections/999999", {
      data: {
        id: 999999,
        ...createVehicleTechnicalInspectionPayload(1),
      },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent inspection returns 404", async ({ api }) => {
    const res = await api.delete("/api/VehicleTechnicalInspections/999999");
    expect(res.status()).toBe(404);
  });
});
