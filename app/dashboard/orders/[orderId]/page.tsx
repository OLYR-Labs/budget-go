import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import OrderAssignmentTable from "@/components/dashboard/order-assignment-table";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const context = await getDashboardContext();
  const permissions = getDashboardPermissions(context.user.role);
  if (!permissions.canViewOperationalOrders && !permissions.canViewCompletedOrders) redirect("/dashboard");

  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(context.scope.type === "GLOBAL" ? {} : { branchId: context.scope.branchId }),
    },
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
      notes: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
      deliveryDistanceKm: true,
    },
  });

  if (!order) notFound();

  const deliveryStaff = await prisma.deliveryStaff.findMany({
    where: { branchId: order.branch.id, isActive: true },
    orderBy: { user: { name: "asc" } },
    select: { id: true, branchId: true, user: { select: { name: true, phone: true } } },
  });

  const orderForClient = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt.toISOString(),
    branch: order.branch,
    deliveryStaff: order.deliveryStaff,
    items: order.items,
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/orders" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to orders</Link>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Order details</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{order.orderNumber}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{order.branch.name} ({order.branch.code}) · {order.customerName}</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wider">{order.status.replaceAll("_", " ")}</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Customer</p><p className="mt-2 text-sm font-bold">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.customerPhone}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Order total</p><p className="mt-2 text-xl font-black">LKR {Number(order.total).toLocaleString("en-LK")}</p><p className="mt-1 text-xs text-muted-foreground">Payment: {order.paymentStatus}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Delivery</p><p className="mt-2 text-sm font-bold">{order.deliveryDistanceKm.toFixed(1)} km</p><p className="mt-1 text-xs text-muted-foreground">{order.deliveryLatitude.toFixed(5)}, {order.deliveryLongitude.toFixed(5)}</p></div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold">Delivery assignment</h2>
          <OrderAssignmentTable orders={[orderForClient]} deliveryStaff={deliveryStaff} canAssign={permissions.canAssignOrders} />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Order notes</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{order.notes || "No customer notes."}</p>
        </div>
      </div>
    </main>
  );
}
