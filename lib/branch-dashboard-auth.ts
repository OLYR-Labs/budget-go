import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BranchDashboardRole =
  | "BRANCH_ADMIN"
  | "BRANCH_STAFF";

export type BranchDashboardContext = {
  user: {
    id: string;
    name: string;
    email: string;
    role: BranchDashboardRole;
  };

  branch: {
    id: string;
    name: string;
    code: string;
  };

  isManager: boolean;
  isStaff: boolean;
};

/**
 * Get the authenticated branch-dashboard user.
 *
 * Allowed:
 * - BRANCH_ADMIN
 * - BRANCH_STAFF
 *
 * Not allowed:
 * - ADMIN
 * - CUSTOMER
 * - DELIVERY_STAFF
 *
 * Delivery staff do NOT get access to the branch dashboard.
 */
export async function getBranchDashboardContext(): Promise<BranchDashboardContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,

      branchAdmin: {
        select: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      branchStaff: {
        select: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      deliveryStaff: {
        select: {
          isActive: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  /*
   * --------------------------------------------------
   * Reject users who are not branch-dashboard users
   * --------------------------------------------------
   */

  if (
    user.role !== "BRANCH_ADMIN" &&
    user.role !== "BRANCH_STAFF"
  ) {
    redirect("/login");
  }

  /*
   * --------------------------------------------------
   * Resolve branch
   * --------------------------------------------------
   */

  const branch =
    user.role === "BRANCH_ADMIN"
      ? user.branchAdmin?.branch
      : user.branchStaff?.branch;

  /*
   * --------------------------------------------------
   * Branch assignment is mandatory
   * --------------------------------------------------
   */

  if (!branch) {
    redirect("/login");
  }

  /*
   * --------------------------------------------------
   * Final context
   * --------------------------------------------------
   */

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },

    branch,

    isManager: user.role === "BRANCH_ADMIN",
    isStaff: user.role === "BRANCH_STAFF",
  };
}