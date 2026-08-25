import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";

function money(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
}

function statusClass(status: string) {
  if (status === "PENDING") return "bg-amber-500/10 text-amber-600";
  if (status === "DELIVERED") return "bg-emerald-500/10 text-emerald-600";
  if (status === "CANCELLED") return "bg-red-500/10 text-red-600";
  return "bg-purple-500/10 text-purple-600";
}

export default async function OrdersDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const context = await getDashboardContext();
  const permissions = getDashboardPermissions(context.user.role);
  if (!permissions.canViewOperationalOrders && !permissions.canViewCompletedOrders) redirect("/dashboard");

  const where = context.scope.type === "GLOBAL" ? {} : { branchId: context.scope.branchId };
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      customerName: true,
      customerPhone: true,
      createdAt: true,
      branch: { select: { name: true, code: true } },
      deliveryStaff: { select: { user: { select: { name: true } } } },
      items: { select: { quantity: true } },
    },
  });

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <a href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to dashboard</a>
        <div className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Order operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">{context.scope.type === "GLOBAL" ? "All branches" : `Orders for ${context.branch.name}`}</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-border bg-muted/30"><tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Items</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Status</th></tr></thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No orders found.</td></tr> : orders.map((order) => {
                  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4"><p className="text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p></td>
                    <td className="px-5 py-4"><p className="text-sm font-semibold">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.customerPhone}</p></td>
                    <td className="px-5 py-4 text-sm">{order.branch.name} <span className="text-xs text-muted-foreground">({order.branch.code})</span></td>
                    <td className="px-5 py-4 text-sm">{items}</td>
                    <td className="px-5 py-4 text-sm font-bold">{money(Number(order.total))}</td>
                    <td className="px-5 py-4 text-xs font-semibold">{order.paymentStatus}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusClass(order.status)}`}>{order.status.replaceAll("_", " ")}</span>{order.deliveryStaff && <p className="mt-2 text-[10px] text-muted-foreground">Driver: {order.deliveryStaff.user.name}</p>}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
