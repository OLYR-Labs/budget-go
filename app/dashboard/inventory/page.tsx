import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";

function money(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
}

export default async function InventoryDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const context = await getDashboardContext();
  const permissions = getDashboardPermissions(context.user.role);
  if (!permissions.canViewInventory) redirect("/dashboard");

  const where = context.scope.type === "GLOBAL" ? {} : { branchId: context.scope.branchId };
  const inventory = await prisma.branchInventory.findMany({
    where: { ...where, isActive: true, product: { isActive: true } },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take: 500,
    select: {
      id: true,
      price: true,
      stock: true,
      branch: { select: { name: true, code: true } },
      product: { select: { name: true, sku: true, category: { select: { name: true } } } },
    },
  });

  const units = inventory.reduce((sum, item) => sum + item.stock, 0);
  const value = inventory.reduce((sum, item) => sum + Number(item.price) * item.stock, 0);
  const lowStock = inventory.filter((item) => item.stock <= 5).length;
  const isGlobal = context.scope.type === "GLOBAL";

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <a href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to dashboard</a>
        <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Inventory operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Inventory</h1>
            <p className="mt-2 text-sm text-muted-foreground">{isGlobal ? "Global branch inventory" : `Inventory for ${context.branch.name}`}</p>
          </div>
          {!isGlobal && <a href="/dashboard/branch" className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">Open branch inventory tools</a>}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Inventory value" value={money(value)} />
          <Stat label="Stock units" value={units.toLocaleString("en-LK")} />
          <Stat label="Low stock" value={String(lowStock)} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-border bg-muted/30"><tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><th className="px-5 py-4">Product</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Value</th></tr></thead>
              <tbody className="divide-y divide-border">
                {inventory.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No active inventory found.</td></tr> : inventory.map((item) => {
                  const itemValue = Number(item.price) * item.stock;
                  return <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4"><p className="text-sm font-semibold">{item.product.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.product.sku}{item.product.category ? ` · ${item.product.category.name}` : ""}</p></td>
                    <td className="px-5 py-4 text-sm">{item.branch.name} <span className="text-xs text-muted-foreground">({item.branch.code})</span></td>
                    <td className="px-5 py-4 text-sm font-semibold">{money(Number(item.price))}</td>
                    <td className={`px-5 py-4 text-sm font-bold ${item.stock <= 5 ? "text-destructive" : ""}`}>{item.stock}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{money(itemValue)}</td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-black">{value}</p></div>;
}
