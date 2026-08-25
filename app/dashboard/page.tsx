import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import { LogoutButton } from "@/components/dashboard/logout-button";
import ThemeToggle from "@/components/home/theme-toggle";

function money(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function statusClass(status: string) {
  if (status === "PENDING") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (status === "DELIVERED") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (status === "CANCELLED") return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      branchAdmin: { select: { branch: { select: { id: true, name: true, code: true } } } },
      branchStaff: { select: { branch: { select: { id: true, name: true, code: true } } } },
    },
  });

  if (!user) redirect("/login");

  // Branch staff have an inventory-only workspace. They never see sales/orders.
  if (user.role === "BRANCH_STAFF") redirect("/dashboard/branch");

  const permissions = getDashboardPermissions(user.role);
  if (!permissions.canViewDashboard) redirect("/");

  const isAdmin = user.role === "ADMIN";
  const branch = user.branchAdmin?.branch ?? null;
  if (!isAdmin && !branch) redirect("/login");

  const branchFilter = isAdmin ? {} : { branchId: branch!.id };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, pendingOrders, ordersToday, paidOrders, paidRevenue, todayRevenue, inventoryRows, branchCount, activeBranchCount, branchStaffCount, deliveryStaffCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: branchFilter }),
    prisma.order.count({ where: { ...branchFilter, status: "PENDING" } }),
    prisma.order.count({ where: { ...branchFilter, createdAt: { gte: today } } }),
    prisma.order.count({ where: { ...branchFilter, paymentStatus: "PAID" } }),
    prisma.order.aggregate({ where: { ...branchFilter, paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...branchFilter, paymentStatus: "PAID", createdAt: { gte: today } }, _sum: { total: true } }),
    prisma.branchInventory.findMany({ where: { ...branchFilter, isActive: true, product: { isActive: true } }, select: { price: true, stock: true } }),
    prisma.branch.count({ where: isAdmin ? {} : { id: branch!.id } }),
    prisma.branch.count({ where: isAdmin ? { isActive: true } : { id: branch!.id, isActive: true } }),
    prisma.branchStaff.count({ where: isAdmin ? {} : { branchId: branch!.id } }),
    prisma.deliveryStaff.count({ where: isAdmin ? { isActive: true } : { branchId: branch!.id, isActive: true } }),
    prisma.order.findMany({
      where: branchFilter,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, status: true, total: true, customerName: true, branch: { select: { name: true } }, items: { select: { quantity: true } } },
    }),
  ]);

  const inventoryValue = inventoryRows.reduce((sum, row) => sum + Number(row.price) * row.stock, 0);
  const stockUnits = inventoryRows.reduce((sum, row) => sum + row.stock, 0);
  const lowStock = inventoryRows.filter((row) => row.stock <= 5).length;
  const revenue = Number(paidRevenue._sum.total ?? 0);
  const revenueToday = Number(todayRevenue._sum.total ?? 0);
  const averageOrder = paidOrders > 0 ? revenue / paidOrders : 0;
  const staffTotal = branchStaffCount + deliveryStaffCount;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#08080b] dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white px-4 py-5 dark:border-white/[0.07] dark:bg-[#0b0b0f] lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-lg font-black text-white">B</div><div><p className="text-sm font-black">Budget Go</p><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Operations</p></div></div>
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/[0.07] dark:bg-white/[0.025]"><p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Workspace</p><div className="mt-3 rounded-xl bg-purple-500/[0.08] px-3 py-3"><p className="text-xs font-bold">{isAdmin ? "Head Office" : branch?.name}</p><p className="mt-1 text-[10px] text-zinc-500">{isAdmin ? "Global network" : `Branch ${branch?.code}`}</p></div></div>
          <nav className="mt-7 flex-1"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Navigation</p><div className="mt-3 space-y-1"><a href="/dashboard" className="block rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-medium text-white">Overview</a><a href="/dashboard/inventory" className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.04]">Inventory</a><a href="/dashboard/orders" className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.04]">Orders</a>{isAdmin && <a href="/dashboard/users" className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.04]">Staff & accounts</a>}</div></nav>
          <div className="border-t border-zinc-200 pt-4 dark:border-white/[0.07]">{isAdmin && <a href="/dashboard/users" className="mb-3 block rounded-xl bg-purple-600 px-3 py-2.5 text-center text-xs font-bold text-white">+ Create branch account</a>}<div className="flex items-center justify-between rounded-xl px-3 py-2.5"><span className="text-xs text-zinc-500">Theme</span><ThemeToggle /></div><div className="mt-2"><LogoutButton /></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-white/[0.025]"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white">{initials(user.name)}</div><div className="min-w-0"><p className="truncate text-xs font-bold">{user.name}</p><p className="truncate text-[10px] text-zinc-500">{roleLabel(user.role)}</p></div></div></div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#08080b]/90"><div className="flex h-16 items-center justify-between px-5 sm:px-7 lg:px-10"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-500">{isAdmin ? "Head Office" : branch?.name}</p><p className="text-sm font-semibold">{roleLabel(user.role)}</p></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-600 sm:block dark:text-emerald-400">● Systems operational</span><ThemeToggle /></div></div></header>

          <div className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-500">{isAdmin ? "Head Office Dashboard" : `${branch?.name} Dashboard`}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Good to see you, <span className="text-purple-500">{user.name.split(" ")[0]}.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{isAdmin ? "Monitor branches, sales, inventory and staff from one central workspace." : "Monitor your branch sales, orders, inventory and delivery operations."}</p></div>{isAdmin && <a href="/dashboard/users" className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-600 px-5 text-sm font-bold text-white">Manage staff accounts</a>}</div>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Paid revenue" value={money(revenue)} hint={`${paidOrders} paid orders`} /><Kpi label="Revenue today" value={money(revenueToday)} hint={`${ordersToday} orders today`} /><Kpi label="Average paid order" value={money(averageOrder)} hint="Paid revenue ÷ paid orders" /><Kpi label="Inventory value" value={money(inventoryValue)} hint={`${stockUnits} units · ${lowStock} low-stock`} /></section>
            <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total orders" value={String(totalOrders)} hint={`${pendingOrders} pending`} /><Kpi label="Active branches" value={`${activeBranchCount}/${branchCount}`} hint="Network locations" /><Kpi label="Active staff" value={String(staffTotal)} hint={`${branchStaffCount} branch · ${deliveryStaffCount} delivery`} /><Kpi label="Low-stock items" value={String(lowStock)} hint="5 units or fewer" /></section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-[#101014]"><div className="flex items-center justify-between border-b border-zinc-200 px-5 py-5 dark:border-white/[0.06]"><div><p className="text-sm font-bold">Recent orders</p><p className="mt-1 text-xs text-zinc-500">Latest activity within your access scope.</p></div><a href="/dashboard/orders" className="text-xs font-semibold text-purple-500">View all →</a></div><div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">{recentOrders.length === 0 ? <div className="px-5 py-12 text-center text-sm text-zinc-500">No orders yet.</div> : recentOrders.map((order) => { const count = order.items.reduce((sum, item) => sum + item.quantity, 0); return <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02]"><div><p className="text-xs font-bold">{order.orderNumber}</p><p className="mt-1 text-[11px] text-zinc-500">{order.customerName} · {count} item{count === 1 ? "" : "s"}{isAdmin ? ` · ${order.branch.name}` : ""}</p></div><div className="flex items-center gap-3"><span className="text-xs font-bold">{money(Number(order.total))}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusClass(order.status)}`}>{order.status.replaceAll("_", " ")}</span></div></div>; })}</div></section>

            <section className="mt-6 grid gap-4 md:grid-cols-3"><a href="/dashboard/inventory" className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-purple-500/30 dark:border-white/[0.07] dark:bg-[#101014]"><p className="text-sm font-bold">Inventory operations</p><p className="mt-2 text-xs leading-5 text-zinc-500">Monitor branch stock, pricing and calculated inventory value.</p><span className="mt-4 inline-block text-xs font-bold text-purple-500">Open inventory →</span></a><a href="/dashboard/orders" className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-purple-500/30 dark:border-white/[0.07] dark:bg-[#101014]"><p className="text-sm font-bold">Order operations</p><p className="mt-2 text-xs leading-5 text-zinc-500">Review orders, payment status, totals and delivery assignments.</p><span className="mt-4 inline-block text-xs font-bold text-purple-500">Open orders →</span></a>{isAdmin ? <a href="/dashboard/users" className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-purple-500/30 dark:border-white/[0.07] dark:bg-[#101014]"><p className="text-sm font-bold">Staff & accounts</p><p className="mt-2 text-xs leading-5 text-zinc-500">Create Branch Manager and Branch Staff accounts and assign them to active branches.</p><span className="mt-4 inline-block text-xs font-bold text-purple-500">Manage accounts →</span></a> : <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.07] dark:bg-[#101014]"><p className="text-sm font-bold">Calculation rules</p><p className="mt-2 text-xs leading-5 text-zinc-500">Revenue = paid order totals. Average paid order = paid revenue ÷ paid orders. Inventory value = current price × current stock.</p></div>}</section>

            <footer className="py-8 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">Budget Go Operations · Secure workspace</footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.07] dark:bg-[#101014]"><p className="text-xs font-medium text-zinc-500">{label}</p><p className="mt-4 text-2xl font-black tracking-tight">{value}</p><p className="mt-2 text-[11px] text-zinc-500">{hint}</p></div>;
}
