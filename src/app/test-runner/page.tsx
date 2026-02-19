"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";

const SUITES = [
  { key: "tenants", label: "Tenants" },
  { key: "vehicles", label: "Vehicles" },
  { key: "fuel-alerts", label: "Fuel Alerts" },
  { key: "geofences", label: "Geofences" },
  { key: "gps-positions", label: "GPS Positions" },
  { key: "notifications", label: "Notifications" },
  { key: "vehicle-insurances", label: "Vehicle Insurances" },
  { key: "vehicle-parts", label: "Vehicle Parts" },
  { key: "vehicle-technical-inspections", label: "Technical Inspections" },
];

type Status = "idle" | "running" | "passed" | "failed";

interface SuiteResult {
  status: Status;
  summary?: string;
  output?: string;
}

export default function TestRunnerPage() {
  const [results, setResults] = useState<Record<string, SuiteResult>>({});
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [runAllActive, setRunAllActive] = useState(false);
  const abortRef = useRef(false);

  const runSuite = async (key: string) => {
    setResults((prev) => ({ ...prev, [key]: { status: "running" } }));
    setSelectedSuite(key);
    try {
      const res = await fetch(`/api/tests/run?suite=${key}`);
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [key]: { status: data.passed ? "passed" : "failed", summary: data.summary, output: data.output },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [key]: { status: "failed", summary: "Network error", output: "Failed to reach the test API." },
      }));
    }
  };

  const runAll = async () => {
    abortRef.current = false;
    setRunAllActive(true);
    for (const suite of SUITES) {
      if (abortRef.current) break;
      await runSuite(suite.key);
    }
    setRunAllActive(false);
  };

  const stopAll = () => {
    abortRef.current = true;
  };

  const statusColor: Record<Status, string> = {
    idle: "bg-gray-100 text-gray-600",
    running: "bg-blue-50 text-blue-700 animate-pulse",
    passed: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
  };

  const statusDot: Record<Status, string> = {
    idle: "bg-gray-300",
    running: "bg-blue-500 animate-pulse",
    passed: "bg-green-500",
    failed: "bg-red-500",
  };

  const statusLabel: Record<Status, string> = {
    idle: "Idle",
    running: "Running...",
    passed: "Passed",
    failed: "Failed",
  };

  const selected = selectedSuite ? results[selectedSuite] : null;

  return (
    <div>
      <PageHeader
        title="Test Runner"
        description="Run Playwright API test suites and view results"
        action={
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              runAllActive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            onClick={runAllActive ? stopAll : runAll}
          >
            {runAllActive ? "Stop" : "Run All Suites"}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SUITES.map(({ key, label }) => {
          const result = results[key] ?? { status: "idle" as Status };
          const isRunning = result.status === "running";
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 transition-all ${
                selectedSuite === key ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
              } ${statusColor[result.status]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDot[result.status]}`} />
                  <h3 className="font-semibold text-sm text-gray-900">{label}</h3>
                </div>
                <span className="text-xs font-medium">{statusLabel[result.status]}</span>
              </div>
              {result.summary && (
                <p className="text-xs text-gray-600 mb-3 truncate">{result.summary}</p>
              )}
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => runSuite(key)}
                  disabled={isRunning || runAllActive}
                >
                  {isRunning ? "Running..." : "Run"}
                </button>
                {result.output && (
                  <button
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedSuite(key)}
                  >
                    View Output
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected?.output && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Output — {SUITES.find((s) => s.key === selectedSuite)?.label}
            </h3>
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedSuite(null)}
            >
              Close
            </button>
          </div>
          <pre className="p-4 text-xs leading-relaxed bg-gray-900 text-gray-200 overflow-auto max-h-[500px] whitespace-pre-wrap">
            {selected.output}
          </pre>
        </div>
      )}
    </div>
  );
}
