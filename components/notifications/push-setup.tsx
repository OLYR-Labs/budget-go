"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function registerPushSubscription(publicKey: string) {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  await registration.update().catch(() => undefined);

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("The browser returned an incomplete push subscription.");
  }

  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error || "Could not register this device for notifications.");
  }
}

export function PushSetup() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    let cancelled = false;

    async function initialise() {
      try {
        const response = await fetch("/api/notifications/config", { cache: "no-store" });
        if (!response.ok) return;
        const config = await response.json() as { enabled?: boolean; publicKey?: string | null };
        if (!config.enabled || !config.publicKey || cancelled) return;

        // Keep the service worker installed even before permission is granted.
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        await registration.update().catch(() => undefined);

        if (Notification.permission === "granted") {
          // Re-sync an existing subscription on every authenticated page load.
          // This keeps the server-side subscription tied to the current user even
          // when the dashboard itself is no longer open.
          await registerPushSubscription(config.publicKey);
        } else if (!cancelled) {
          setVisible(true);
        }
      } catch (error) {
        if (!cancelled) console.error("Push notification setup failed:", error);
      }
    }

    void initialise();
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

      const response = await fetch("/api/notifications/config", { cache: "no-store" });
      const config = await response.json() as { enabled?: boolean; publicKey?: string | null };
      if (!config.enabled || !config.publicKey) throw new Error("Push notifications are not configured yet.");

      await registerPushSubscription(config.publicKey);
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
