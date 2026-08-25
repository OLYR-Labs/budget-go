import { redirect } from "next/navigation";

import BranchInventory from "@/components/dashboard/branch-inventory";
import BranchQuickProductForm from "@/components/dashboard/branch-quick-product-form";
import { getBranchDashboardContext } from "@/lib/branch-dashboard-auth";
import { getDashboardContext } from "@/lib/dashboard-auth";

export default async function BranchDashboardPage() {
  const dashboardContext = await getDashboardContext().catch(() => null);

  if (dashboardContext?.user.role === "ADMIN") {
    redirect("/dashboard/inventory");
  }

  let context: Awaited<ReturnType<typeof getBranchDashboardContext>>;

  try {
    context = await getBranchDashboardContext();
  } catch {
    redirect("/login");
  }

  return (
    <>
      <BranchQuickProductForm />
      <BranchInventory
        branchName={context.branch.name}
        branchCode={context.branch.code}
      />
    </>
  );
}
