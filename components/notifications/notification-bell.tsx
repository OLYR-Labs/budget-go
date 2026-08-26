"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const pathname = usePathname();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // These notifications are internal staff/delivery notifications.
  // Customer-facing pages must not render or poll the notification feed.
  const isStaffArea =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/delivery";

  useEffect(() => {
    if (!isStaffArea) {
      setEnabled(false);
      setItems([]);
      setOpen(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        setItems(data.notifications ?? []);
        setEnabled(true);
      } catch {
        // Notifications are optional and must never break the dashboard.
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 20000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isStaffArea]);

  if (!isStaffArea || !enabled) return null;

  const unread = items.filter((item) => !item.readAt).length;

  async function markRead() {
    if (!unread) return;
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => undefined);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value);
          void markRead();
        }}
        className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 h-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-black">Notifications</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              items.map((item) => (
                <a
                  key={item.id}
                  href={item.url ?? "#"}
                  className="block border-b border-border px-4 py-3 hover:bg-muted"
                >
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
