import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getDashboardContext();

    /*
     * --------------------------------------------------
     * Build scope filters
     * --------------------------------------------------
     *
     * ADMIN:
     *   sees everything
     *
     * BRANCH_ADMIN / BRANCH_STAFF / DELIVERY_STAFF:
     *   only see their assigned branch
     */

    const branchFilter =
      context.scope.type === "GLOBAL"
        ? {}
        : {
            branchId: context.scope.branchId,
          };

    const branchWhere =
      context.scope.type === "GLOBAL"
        ? {}
        : {
            id: context.scope.branchId,
          };

    /*
     * --------------------------------------------------
     * Dashboard queries
     * --------------------------------------------------
     */

    const [
      totalBranches,
      activeBranches,
      totalOrders,
      pendingOrders,
      ordersToday,
      revenueResult,
      activeBranchStaff,
      activeDeliveryStaff,
      recentOrders,
      branches,
    ] = await Promise.all([
      /*
       * Branch count
       */
      prisma.branch.count({
        where: branchWhere,
      }),

      /*
       * Active branches
       */
      prisma.branch.count({
        where:
          context.scope.type === "GLOBAL"
            ? {
                isActive: true,
              }
            : {
                id: context.scope.branchId,
                isActive: true,
              },
      }),

      /*
       * Total orders
       */
      prisma.order.count({
        where: branchFilter,
      }),

      /*
       * Pending orders
       */
      prisma.order.count({
        where: {
          ...branchFilter,
          status: "PENDING",
        },
      }),

      /*
       * Orders today
       */
      prisma.order.count({
        where: {
          ...branchFilter,
          createdAt: {
            gte: new Date(
              new Date().setHours(0, 0, 0, 0),
            ),
          },
        },
      }),

      /*
       * Revenue
       *
       * Only PAID orders count toward revenue.
       */
      prisma.order.aggregate({
        where: {
          ...branchFilter,
          paymentStatus: "PAID",
        },

        _sum: {
          total: true,
        },
      }),

      /*
       * Branch staff
       */
      prisma.branchStaff.count({
        where:
          context.scope.type === "GLOBAL"
            ? {}
            : {
                branchId: context.scope.branchId,
              },
      }),

      /*
       * Active delivery staff
       */
      prisma.deliveryStaff.count({
        where:
          context.scope.type === "GLOBAL"
            ? {
                isActive: true,
              }
            : {
                branchId: context.scope.branchId,
                isActive: true,
              },
      }),

      /*
       * Recent orders
       */
      prisma.order.findMany({
        where: branchFilter,

        orderBy: {
          createdAt: "desc",
        },

        take: 10,

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          deliveryFee: true,
          total: true,
          customerName: true,
          customerPhone: true,
          createdAt: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          deliveryStaff: {
            select: {
              id: true,

              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              total: true,

              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      /*
       * Branches
       */
      prisma.branch.findMany({
        where: branchWhere,

        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          isActive: true,

          _count: {
            select: {
              staff: true,
              deliveryStaff: true,
              orders: true,
              inventory: true,
            },
          },
        },
      }),
    ]);

    /*
     * --------------------------------------------------
     * Response
     * --------------------------------------------------
     */

    return NextResponse.json({
      user: context.user,

      scope: context.scope,

      branch: context.branch,

      stats: {
        totalBranches,
        activeBranches,
        totalOrders,
        pendingOrders,
        ordersToday,

        revenue: Number(
          revenueResult._sum.total ?? 0,
        ),

        activeBranchStaff,
        activeDeliveryStaff,
      },

      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,

        status: order.status,
        paymentStatus: order.paymentStatus,

        customer: {
          name: order.customerName,
          phone: order.customerPhone,
        },

        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),

        createdAt: order.createdAt,

        branch: order.branch,

        deliveryStaff:
          order.deliveryStaff?.user ?? null,

        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),

          product: item.product,
        })),
      })),

      branches,
    });

  } catch (error) {
    console.error("========== DASHBOARD API ERROR ==========");
    console.error(error);
    console.error("=========================================");

    if (
      error instanceof Error &&
      error.message ===
        "You must be logged in to access the dashboard."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "This account does not have dashboard access."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    if (
      error instanceof Error &&
      (
        error.message ===
          "This branch administrator is not assigned to a branch." ||
        error.message ===
          "This branch staff member is not assigned to a branch." ||
        error.message ===
          "This delivery staff member is not assigned to a branch." ||
        error.message ===
          "This delivery staff account is inactive."
      )
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load dashboard.",
        details:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}