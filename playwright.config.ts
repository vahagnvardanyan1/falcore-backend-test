import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["html"], ["list"]],
  use: {
    baseURL:
      process.env.API_BASE_URL ||
      "https://falcore-backend-production-4bc7.up.railway.app",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
});
