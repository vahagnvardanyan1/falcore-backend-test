import { test as base, type APIRequestContext } from "@playwright/test";

const BASE_URL =
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

export async function deleteResource(endpoint: string, id: number) {
  try {
    await fetch(`${BASE_URL}${endpoint}/${id}`, { method: "DELETE" });
  } catch {
    // Ignore cleanup failures
  }
}

export { expect } from "@playwright/test";
