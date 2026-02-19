import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

const SUITES: Record<string, string> = {
  tenants: "tests/tenants.spec.ts",
  vehicles: "tests/vehicles.spec.ts",
  "fuel-alerts": "tests/fuel-alerts.spec.ts",
  geofences: "tests/geofences.spec.ts",
  "gps-positions": "tests/gps-positions.spec.ts",
  notifications: "tests/notifications.spec.ts",
  "vehicle-insurances": "tests/vehicle-insurances.spec.ts",
  "vehicle-parts": "tests/vehicle-parts.spec.ts",
  "vehicle-technical-inspections": "tests/vehicle-technical-inspections.spec.ts",
};

export async function GET(request: NextRequest) {
  const suite = request.nextUrl.searchParams.get("suite");

  if (suite && !SUITES[suite]) {
    return NextResponse.json(
      { passed: false, summary: "Unknown suite", output: `Suite "${suite}" not found.` },
      { status: 400 },
    );
  }

  const playwrightBin = path.resolve(process.cwd(), "node_modules", ".bin", "playwright");
  const args = ["test", "--reporter=list"];
  if (suite) args.push(SUITES[suite]);

  return new Promise<NextResponse>((resolve) => {
    execFile(playwrightBin, args, { timeout: 120_000, maxBuffer: 5 * 1024 * 1024, cwd: process.cwd() }, (error, stdout, stderr) => {
      const output = stdout + (stderr ? `\n${stderr}` : "");
      const passed = !error;
      const lines = output.trim().split("\n");
      const summary = lines.findLast((l) => /\d+ passed/.test(l)) ?? (passed ? "All passed" : "Failed");

      resolve(NextResponse.json({ passed, summary, output }));
    });
  });
}
