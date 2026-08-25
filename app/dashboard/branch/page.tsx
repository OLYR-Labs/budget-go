import { redirect } from "next/navigation";

import BranchInventory from "@/components/dashboard/branch-inventory";
import { getBranchDashboardContext } from "@/lib/branch-dashboard-auth";

export default async function BranchDashboardPage() {
  let context: Awaited<ReturnType<typeof getBranchDashboardContext>>;

  try {
    context = await getBranchDashboardContext();
  } catch {
    redirect("/login");
  }

  return (
    <BranchInventory
      branchName={context.branch.name}
      branchCode={context.branch.code}
    />
  );
}
