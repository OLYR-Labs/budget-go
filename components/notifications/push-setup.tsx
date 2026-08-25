"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function PushSetup() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    let cancelled = false;
    fetch("/api/notifications/config")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.enabled) setVisible(Notification.permission !== "granted");
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications are blocked. Please allow them in your browser settings.");
        return;
      }

      const config = await fetch("/api/notifications/config").then((response) => response.json());
      if (!config.enabled || !config.publicKey) throw new Error("Push notifications are not configured yet.");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });

      const json = subscription.toJSON();
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      if (!response.ok) throw new Error("Could not register this device.");
      setVisible(false);
      setMessage("Notifications enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!visible && !message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-2xl">
      {visible ? (
        <>
          <p className="text-sm font-bold">Enable Budget Go notifications</p>
          <p className="mt-1 text-xs text-muted-foreground">Get new-order and delivery-assignment alerts even when the dashboard is not open.</p>
          <button type="button" onClick={enable} disabled={busy} className="mt-3 h-10 w-full rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {busy ? "Enabling…" : "Enable notifications"}
          </button>
        </>
      ) : (
        <p className="text-xs font-medium text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
