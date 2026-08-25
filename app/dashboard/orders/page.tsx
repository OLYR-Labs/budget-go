import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import OrderAssignmentTable from "@/components/dashboard/order-assignment-table";

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
      total: true,
      customerName: true,
      customerPhone: true,
      createdAt: true,
      branch: { select: { id: true, name: true, code: true } },
      deliveryStaff: { select: { id: true, user: { select: { name: true } } } },
      items: { select: { quantity: true } },
    },
  });

  const deliveryStaff = await prisma.deliveryStaff.findMany({
    where: {
      isActive: true,
      ...(context.scope.type === "GLOBAL" ? {} : { branchId: context.scope.branchId }),
    },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      branchId: true,
      user: { select: { name: true, phone: true } },
    },
  });

  const serializableOrders = orders.map((order) => ({
    ...order,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to dashboard</Link>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Order operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Orders</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {context.scope.type === "GLOBAL" ? "All branches" : `Orders for ${context.branch?.name ?? "your branch"}`}
            </p>
          </div>
          {permissions.canAssignOrders && <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">Assigning a driver to a pending order automatically moves it to <strong className="text-foreground">ASSIGNED</strong>.</p>}
        </div>

        <div className="mt-6">
          <OrderAssignmentTable
            orders={serializableOrders}
            deliveryStaff={deliveryStaff}
            canAssign={permissions.canAssignOrders}
          />
        </div>
      </div>
    </main>
  );
}
