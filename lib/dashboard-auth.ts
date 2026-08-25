import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/generated/prisma/client";

type DashboardScope =
  | {
      type: "GLOBAL";
      branchId: null;
    }
  | {
      type: "BRANCH";
      branchId: string;
    };

export async function getDashboardContext() {
  /*
   * --------------------------------------------------
   * Get the current request headers
   * --------------------------------------------------
   *
   * Better Auth needs the request headers/cookies to
   * resolve the current session on the server.
   */
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  /*
   * --------------------------------------------------
   * Authentication
   * --------------------------------------------------
   */

  if (!session?.user) {
    throw new Error(
      "You must be logged in to access the dashboard.",
    );
  }

  const userId = session.user.id;

  /*
   * --------------------------------------------------
   * Get the complete user from Prisma
   * --------------------------------------------------
   *
   * The role is always read from the database.
   * We never trust a client-provided role.
   */
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      banned: true,
    },
  });

  if (!user) {
    throw new Error(
      "This account does not have dashboard access.",
    );
  }

  /*
   * --------------------------------------------------
   * Banned accounts
   * --------------------------------------------------
   */

  if (user.banned) {
    throw new Error(
      "This account does not have dashboard access.",
    );
  }

  /*
   * --------------------------------------------------
   * Dashboard role check
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * Delivery staff do NOT have dashboard access.
   *
   * Dashboard roles are only:
   *
   * ADMIN
   * BRANCH_ADMIN
   * BRANCH_STAFF
   */
  const dashboardRoles: UserRole[] = [
    "ADMIN",
    "BRANCH_ADMIN",
    "BRANCH_STAFF",
  ];

  if (!dashboardRoles.includes(user.role)) {
    throw new Error(
      "This account does not have dashboard access.",
    );
  }

  /*
   * --------------------------------------------------
   * GLOBAL ADMIN
   * --------------------------------------------------
   */

  if (user.role === "ADMIN") {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
      },

      scope: {
        type: "GLOBAL" as const,
        branchId: null,
      },

      branch: null,
    };
  }

  /*
   * --------------------------------------------------
   * Branch administrator
   * --------------------------------------------------
   */

  if (user.role === "BRANCH_ADMIN") {
    const branchAdmin =
      await prisma.branchAdmin.findUnique({
        where: {
          userId: user.id,
        },

        select: {
          branchId: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              latitude: true,
              longitude: true,
              deliveryRadius: true,
              isActive: true,
            },
          },
        },
      });

    if (!branchAdmin) {
      throw new Error(
        "This branch administrator is not assigned to a branch.",
      );
    }

    /*
     * A branch administrator must belong to an active branch.
     */
    if (!branchAdmin.branch.isActive) {
      throw new Error(
        "This branch is currently inactive.",
      );
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
      },

      scope: {
        type: "BRANCH" as const,
        branchId: branchAdmin.branchId,
      },

      branch: branchAdmin.branch,
    };
  }

  /*
   * --------------------------------------------------
   * Branch staff
   * --------------------------------------------------
   */

  if (user.role === "BRANCH_STAFF") {
    const branchStaff =
      await prisma.branchStaff.findUnique({
        where: {
          userId: user.id,
        },

        select: {
          branchId: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              latitude: true,
              longitude: true,
              deliveryRadius: true,
              isActive: true,
            },
          },
        },
      });

    if (!branchStaff) {
      throw new Error(
        "This branch staff member is not assigned to a branch.",
      );
    }

    /*
     * Staff must belong to an active branch as well.
     */
    if (!branchStaff.branch.isActive) {
      throw new Error(
        "This branch is currently inactive.",
      );
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
      },

      scope: {
        type: "BRANCH" as const,
        branchId: branchStaff.branchId,
      },

      branch: branchStaff.branch,
    };
  }

  /*
   * --------------------------------------------------
   * Safety fallback
   * --------------------------------------------------
   *
   * This should never be reached because the role check
   * above already limits dashboard access.
   */
  throw new Error(
    "This account does not have dashboard access.",
  );
}