"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationRegistration() {
  const [status, setStatus] = useState<"idle" | "enabled" | "unsupported" | "blocked">("idle");

  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;

      try {
        const permission = Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

        if (permission !== "granted") {
          setStatus("blocked");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const response = await fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });

        if (!response.ok) throw new Error("Could not save push subscription.");
        if (!cancelled) setStatus("enabled");
      } catch (error) {
        console.error("Push notification registration failed:", error);
      }
    }

    void register();
    return () => { cancelled = true; };
  }, []);

  if (status === "unsupported") return null;
  return null;
}
