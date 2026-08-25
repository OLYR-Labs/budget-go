import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserCreationForm from "@/components/dashboard/user-creation-form";

export default async function DashboardUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <a href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            ← Back to dashboard
          </a>
          <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Create branch account</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create a Branch Manager or Branch Staff account and assign it to an active branch. Delivery staff do not receive dashboard accounts.
          </p>
        </div>

        <UserCreationForm branches={branches} />
      </div>
    </main>
  );
}
