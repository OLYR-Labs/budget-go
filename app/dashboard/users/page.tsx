import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAFF_ROLES = ["ADMIN", "BRANCH_ADMIN", "BRANCH_STAFF", "DELIVERY_STAFF"] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

function roleLabel(role: StaffRole) {
  if (role === "ADMIN") return "Administrator";
  if (role === "BRANCH_ADMIN") return "Branch Manager";
  if (role === "BRANCH_STAFF") return "Branch Staff";
  return "Delivery Staff";
}

function roleClass(role: StaffRole) {
  if (role === "ADMIN") return "bg-purple-500/10 text-purple-600";
  if (role === "BRANCH_ADMIN") return "bg-blue-500/10 text-blue-600";
  if (role === "BRANCH_STAFF") return "bg-slate-500/10 text-slate-600";
  return "bg-emerald-500/10 text-emerald-600";
}

export default async function DashboardUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      banned: true,
      createdAt: true,
      branchAdmin: { select: { branch: { select: { name: true, code: true } } } },
      branchStaff: { select: { branch: { select: { name: true, code: true } } } },
      deliveryStaff: { select: { isActive: true, branch: { select: { name: true, code: true } } } },
    },
  });

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Administration</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Staff & Accounts</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage the people who operate Budget Go. Branch managers, branch staff, and delivery staff are all tied to their assigned branch.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/branches" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-muted/40">
              Branch Locations
            </Link>
            <Link href="/dashboard/users/create?type=branch" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
              Create Branch Account
            </Link>
            <Link href="/dashboard/users/create?type=delivery" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-muted/40">
              Create Delivery Account
            </Link>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-bold">Registered staff</p>
            <p className="mt-1 text-xs text-muted-foreground">{users.length} managed account{users.length === 1 ? "" : "s"}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-5 py-4">Staff member</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Branch</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No staff accounts have been created yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const role = user.role as StaffRole;
                    const branch = user.branchAdmin?.branch ?? user.branchStaff?.branch ?? user.deliveryStaff?.branch ?? null;
                    const active = role === "DELIVERY_STAFF" ? user.deliveryStaff?.isActive === true : !user.banned;

                    return (
                      <tr key={user.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold">{user.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${roleClass(role)}`}>
                            {roleLabel(role)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {branch ? <>{branch.name} <span className="text-xs text-muted-foreground">({branch.code})</span></> : "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{user.phone || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(user.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
