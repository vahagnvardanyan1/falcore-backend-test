"use client";

import { useEffect, useRef, useState } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { NotificationDto } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://falcore-backend-production-4bc7.up.railway.app";

const HUB_URL = `${BASE_URL}/hubs/notifications`;

export function useNotificationHub(
  onNotification?: (notification: NotificationDto) => void
) {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onNotification);

  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        return;
      }

      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      connection.on(
        "ReceiveNotification",
        (notification: NotificationDto) => {
          callbackRef.current?.(notification);
        }
      );

      connection.onreconnected(() => {
        if (!cancelled) setConnected(true);
      });
      connection.onreconnecting(() => {
        if (!cancelled) setConnected(false);
      });
      connection.onclose(() => {
        if (!cancelled) setConnected(false);
      });

      try {
        await connection.start();
        if (!cancelled) {
          connectionRef.current = connection;
          setConnected(true);
        } else {
          connection.stop();
        }
      } catch (err) {
        console.error("SignalR connection failed:", err);
        if (!cancelled) setConnected(false);
      }
    }

    connect();

    return () => {
      cancelled = true;
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, []);

  return { connected };
}
