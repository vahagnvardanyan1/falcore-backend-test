"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/tenants", label: "Tenants" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/fuel-alerts", label: "Fuel Alerts" },
  { href: "/geofences", label: "Geofences" },
  { href: "/gps-positions", label: "GPS Tracking" },
  { href: "/notifications", label: "Notifications" },
  { href: "/vehicle-insurances", label: "Insurances" },
  { href: "/vehicle-parts", label: "Vehicle Parts" },
  { href: "/vehicle-inspections", label: "Inspections" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">Falcore VTS</h1>
        <p className="text-xs text-gray-400 mt-1">Vehicle Tracking System</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
