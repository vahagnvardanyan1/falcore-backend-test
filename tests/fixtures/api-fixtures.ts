import { test as base, type APIRequestContext } from "@playwright/test";
import {
  createTenantPayload,
  createVehiclePayload,
} from "./test-data";

export const BASE_URL =
  process.env.API_BASE_URL ||
  "https://falcore-backend-production-4bc7.up.railway.app";

interface ApiFixtures {
  api: APIRequestContext;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(request);
  },
});

export async function setupTenant(api: APIRequestContext) {
  const res = await api.post("/api/Tenants", {
    data: createTenantPayload(),
  });
  return (await res.json()).id as number;
}

export async function setupTenantAndVehicle(api: APIRequestContext) {
  const tenantId = await setupTenant(api);
  const res = await api.post("/api/Vehicles", {
    data: createVehiclePayload(tenantId),
  });
  const vehicleId = (await res.json()).id as number;
  return { tenantId, vehicleId };
}

export async function deleteResource(endpoint: string, id: number) {
  try {
    await fetch(`${BASE_URL}${endpoint}/${id}`, { method: "DELETE" });
  } catch {
    // Ignore cleanup failures
  }
}

export { expect } from "@playwright/test";
