import { test, expect, deleteResource } from "./fixtures/api-fixtures";
import { createTenantPayload } from "./fixtures/test-data";

test.describe.serial("Tenants — CRUD lifecycle", () => {
  let tenantId: number;
  const payload = createTenantPayload();

  test.afterAll(async () => {
    if (tenantId) await deleteResource("/api/Tenants", tenantId);
  });

  test("CREATE — POST /api/Tenants", async ({ api }) => {
    const res = await api.post("/api/Tenants", { data: payload });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(payload.name);
    expect(body.slug).toBe(payload.slug);
    tenantId = body.id;
  });

  test("READ — GET /api/Tenants (list all)", async ({ api }) => {
    const res = await api.get("/api/Tenants");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((t: { id: number }) => t.id === tenantId)).toBe(true);
  });

  test("READ — GET /api/Tenants/:id", async ({ api }) => {
    const res = await api.get(`/api/Tenants/${tenantId}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(tenantId);
    expect(body.name).toBe(payload.name);
    expect(body.address).toBe(payload.address);
    expect(body.slug).toBe(payload.slug);
    expect(body.apiKey).toBe(payload.apiKey);
  });

  test("UPDATE — PUT /api/Tenants/:id", async ({ api }) => {
    const updated = { ...payload, id: tenantId, name: "Updated Tenant Name" };
    const putRes = await api.put(`/api/Tenants/${tenantId}`, { data: updated });
    expect([200, 204]).toContain(putRes.status());

    const getRes = await api.get(`/api/Tenants/${tenantId}`);
    const body = await getRes.json();
    expect(body.name).toBe("Updated Tenant Name");
  });

  test("DELETE — DELETE /api/Tenants/:id", async ({ api }) => {
    // Create a separate tenant to delete
    const delPayload = createTenantPayload();
    const createRes = await api.post("/api/Tenants", { data: delPayload });
    const created = await createRes.json();

    const delRes = await api.delete(`/api/Tenants/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const getRes = await api.get(`/api/Tenants/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe("Tenants — Error cases", () => {
  test("GET non-existent tenant returns 404", async ({ api }) => {
    const res = await api.get("/api/Tenants/999999");
    expect(res.status()).toBe(404);
  });

  test("PUT non-existent tenant returns 404", async ({ api }) => {
    const res = await api.put("/api/Tenants/999999", {
      data: { id: 999999, ...createTenantPayload() },
    });
    expect(res.status()).toBe(404);
  });

  test("DELETE non-existent tenant returns 404", async ({ api }) => {
    const res = await api.delete("/api/Tenants/999999");
    expect(res.status()).toBe(404);
  });

  test("POST with empty payload returns 400", async ({ api }) => {
    const res = await api.post("/api/Tenants", { data: {} });
    expect(res.status()).toBe(400);
  });
});
