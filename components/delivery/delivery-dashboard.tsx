"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import ThemeToggle from "@/components/home/theme-toggle";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  status: "ASSIGNED" | "OUT_FOR_DELIVERY";
  paymentStatus: string;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryDistanceKm: number;
  notes: string | null;
  createdAt: string;
  branch: { name: string; code: string; address: string | null };
  items: Array<{ quantity: number; product: { name: string; sku: string } }>;
};

type DeliveryResponse = {
  staff: { id: string; branch: { name: string; code: string } };
  orders: DeliveryOrder[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapsDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}&travelmode=driving`;
}

export default function DeliveryDashboard() {
  const [data, setData] = useState<DeliveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (background = false) => {
    try {
      if (background) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await fetch("/api/delivery/orders", { cache: "no-store" });
      const result = (await response.json().catch(() => null)) as DeliveryResponse & { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load your deliveries.");
      }

      setData(result as DeliveryResponse);
    } catch (loadError) {
      console.error("Delivery workspace load failed:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load deliveries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const assignedCount = useMemo(
    () => data?.orders.filter((order) => order.status === "ASSIGNED").length ?? 0,
    [data],
  );
  const activeCount = data?.orders.length ?? 0;
  const outForDeliveryCount = activeCount - assignedCount;

  async function updateStatus(order: DeliveryOrder, nextStatus: "OUT_FOR_DELIVERY" | "DELIVERED") {
    setUpdatingId(order.id);
    setError("");

    try {
      const response = await fetch(`/api/delivery/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to update delivery status.");
      }

      await loadOrders(true);
    } catch (updateError) {
      console.error("Delivery status update failed:", updateError);
      setError(updateError instanceof Error ? updateError.message : "Unable to update delivery status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#08080b] dark:text-white">
      <div className="mx-auto min-h-screen max-w-3xl">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#08080b]/90 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-sm font-black text-white">B</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">Delivery</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {data?.staff.branch.name ?? "Delivery workspace"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void loadOrders(true)}
                disabled={refreshing || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300"
                aria-label="Refresh deliveries"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 sm:py-8">
          <section className="rounded-[2rem] bg-purple-600 p-5 text-white shadow-xl shadow-purple-600/15 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Today&apos;s route</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Your deliveries</h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
                  Open a delivery, start navigation, then mark it delivered when the customer receives the order.
                </p>
              </div>
              <Truck className="mt-1 hidden h-10 w-10 text-white/30 sm:block" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Assigned" value={String(assignedCount)} />
              <Stat label="On route" value={String(outForDeliveryCount)} />
              <Stat label="Active" value={String(activeCount)} />
            </div>
          </section>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </div>
          )}

          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-500">Assigned orders</p>
                <h2 className="mt-1 text-xl font-black">Deliveries to complete</h2>
              </div>
              {data && <p className="text-xs font-medium text-zinc-500">{data.staff.branch.code}</p>}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-[1.5rem] bg-zinc-200 dark:bg-white/[0.06]" />
                ))}
              </div>
            ) : data?.orders.length ? (
              <div className="space-y-4">
                {data.orders.map((order) => (
                  <DeliveryCard
                    key={order.id}
                    order={order}
                    updating={updatingId === order.id}
                    onStart={() => void updateStatus(order, "OUT_FOR_DELIVERY")}
                    onComplete={() => void updateStatus(order, "DELIVERED")}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-white/[0.1] dark:bg-white/[0.025]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-black">You&apos;re all caught up</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  There are no assigned deliveries waiting for you right now. Pull down or refresh to check again.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3 sm:px-4">
      <p className="text-[10px] font-semibold text-white/55">{label}</p>
      <p className="mt-1 text-xl font-black sm:text-2xl">{value}</p>
    </div>
  );
}

function DeliveryCard({
  order,
  updating,
  onStart,
  onComplete,
}: {
  order: DeliveryOrder;
  updating: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const directionsUrl = mapsDirectionsUrl(order.deliveryLatitude, order.deliveryLongitude);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#101014]">
      <div className="border-b border-zinc-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-black">{order.orderNumber}</p>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">{itemCount} item{itemCount === 1 ? "" : "s"} · {order.branch.name}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${order.status === "ASSIGNED" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
            {order.status === "ASSIGNED" ? "Assigned" : "Out for delivery"}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.035]">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{order.customerName}</p>
              <p className="mt-1 text-xs text-zinc-500">Customer delivery location</p>
              <p className="mt-2 break-all font-mono text-[10px] text-zinc-400">
                {order.deliveryLatitude.toFixed(6)}, {order.deliveryLongitude.toFixed(6)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <Navigation className="h-3.5 w-3.5 text-purple-500" />
                {order.deliveryDistanceKm.toFixed(1)} km road distance
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`tel:${order.customerPhone}`}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.04]"
          >
            <Phone className="h-4 w-4" />
            Call customer
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-lg shadow-purple-600/15 hover:bg-purple-700"
          >
            <Navigation className="h-4 w-4" />
            Get directions
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>

        <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-white/[0.07]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Cash on delivery</p>
              <p className="mt-1 text-lg font-black">{money(order.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-400">Payment</p>
              <p className="mt-1 text-xs font-bold">{order.paymentStatus}</p>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="flex gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{order.notes}</span>
          </div>
        )}

        {order.status === "ASSIGNED" ? (
          <button
            type="button"
            onClick={onStart}
            disabled={updating}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-black text-white shadow-lg hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Start delivery
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            disabled={updating}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Order completed · Delivered
          </button>
        )}
      </div>
    </article>
  );
}
