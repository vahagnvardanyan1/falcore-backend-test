"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tenants, vehicles, notifications } from "@/lib/api";
import type { VehicleDto, NotificationDto } from "@/types";
import PageHeader from "@/components/PageHeader";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tenants: 0,
    vehicles: 0,
    unreadNotifications: 0,
  });
  const [recentVehicles, setRecentVehicles] = useState<VehicleDto[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [t, v, n] = await Promise.all([
          tenants.getAll(),
          vehicles.getAll(),
          notifications.getAll(),
        ]);
        setStats({
          tenants: t.length,
          vehicles: v.length,
          unreadNotifications: n.filter((x) => !x.isRead).length,
        });
        setRecentVehicles(v.slice(0, 5));
        setRecentNotifications(n.slice(0, 5));
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Tenants", value: stats.tenants, href: "/tenants", color: "bg-blue-500" },
    { label: "Vehicles", value: stats.vehicles, href: "/vehicles", color: "bg-green-500" },
    { label: "Unread Alerts", value: stats.unreadNotifications, href: "/notifications", color: "bg-orange-500" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your Vehicle Tracking System"
      />

      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${c.color} rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
                    {c.value}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{c.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Vehicles
              </h2>
              {recentVehicles.length === 0 ? (
                <p className="text-gray-500 text-sm">No vehicles found</p>
              ) : (
                <div className="space-y-3">
                  {recentVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {v.make} {v.model} ({v.year})
                        </p>
                        <p className="text-xs text-gray-500">
                          Plate: {v.plateNumber || "N/A"} | VIN: {v.vin || "N/A"}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {v.totalMileage.toLocaleString()} km
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Notifications
              </h2>
              {recentNotifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((n, i) => (
                    <div
                      key={i}
                      className={`py-2 border-b border-gray-100 last:border-0 ${
                        !n.isRead ? "bg-blue-50 -mx-2 px-2 rounded" : ""
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {n.title || "Notification"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.message || "No message"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
