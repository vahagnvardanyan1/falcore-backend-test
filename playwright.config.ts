import { defineConfig } from "@playwright/test";
import { BASE_URL } from "./tests/fixtures/api-fixtures";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
});
