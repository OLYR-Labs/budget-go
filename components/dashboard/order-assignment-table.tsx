"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type DeliveryStaff = {
  id: string;
  branchId: string;
  user: { name: string; phone: string | null };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  branch: { id: string; name: string; code: string };
  deliveryStaff: { id: string; user: { name: string } } | null;
  items: { quantity: number }[];
};

export default function OrderAssignmentTable({ orders, deliveryStaff, canAssign }: { orders: Order[]; deliveryStaff: DeliveryStaff[]; canAssign: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>(Object.fromEntries(orders.map((order) => [order.id, order.deliveryStaff?.id ?? ""])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function assign(orderId: string) {
    setBusy(orderId);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryStaffId: selected[orderId] || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update the order.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the order.");
    } finally {
      setBusy(null);
    }
  }

  function statusClass(status: string) {
    if (status === "PENDING") return "bg-amber-500/10 text-amber-600";
    if (status === "ASSIGNED") return "bg-blue-500/10 text-blue-600";
    if (status === "DELIVERED") return "bg-emerald-500/10 text-emerald-600";
    if (status === "CANCELLED") return "bg-red-500/10 text-red-600";
    return "bg-purple-500/10 text-purple-600";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {error && <div className="border-b border-destructive/20 bg-destructive/10 px-5 py-3 text-sm text-destructive">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Items</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Status</th>{canAssign && <th className="px-5 py-4">Delivery</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 ? <tr><td colSpan={canAssign ? 8 : 7} className="px-5 py-12 text-center text-sm text-muted-foreground">No orders found.</td></tr> : orders.map((order) => {
              const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const branchStaff = deliveryStaff.filter((staff) => staff.branchId === order.branch.id);
              const isPending = order.status === "PENDING";
              return (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4"><Link href={`/dashboard/orders/${order.id}`} className="text-sm font-semibold hover:text-accent">{order.orderNumber}</Link><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></td>
                  <td className="px-5 py-4"><p className="text-sm font-semibold">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.customerPhone}</p></td>
                  <td className="px-5 py-4 text-sm">{order.branch.name} <span className="text-xs text-muted-foreground">({order.branch.code})</span></td>
                  <td className="px-5 py-4 text-sm">{items}</td>
                  <td className="px-5 py-4 text-sm font-bold">LKR {order.total.toLocaleString("en-LK")}</td>
                  <td className="px-5 py-4 text-xs font-semibold">{order.paymentStatus}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusClass(order.status)}`}>{order.status.replaceAll("_", " ")}</span>{order.deliveryStaff && <p className="mt-2 text-[10px] text-muted-foreground">Driver: {order.deliveryStaff.user.name}</p>}</td>
                  {canAssign && <td className="px-5 py-4"><div className="flex min-w-[250px] gap-2"><select value={selected[order.id] ?? ""} onChange={(event) => setSelected((current) => ({ ...current, [order.id]: event.target.value }))} disabled={busy === order.id || order.status === "DELIVERED" || order.status === "CANCELLED"} className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent/50 disabled:opacity-50"><option value="">{branchStaff.length ? "Unassigned" : "No drivers"}</option>{branchStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.user.name}{staff.user.phone ? ` · ${staff.user.phone}` : ""}</option>)}</select><button type="button" onClick={() => assign(order.id)} disabled={busy === order.id || !branchStaff.length || order.status === "DELIVERED" || order.status === "CANCELLED"} className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">{busy === order.id ? "Saving" : isPending ? "Assign" : "Save"}</button></div></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
