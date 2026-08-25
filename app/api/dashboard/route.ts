import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getDashboardContext();
    const permissions = getDashboardPermissions(context.user.role);

    // Branch staff are inventory-only users. Do not expose dashboard
    // aggregates such as revenue, orders, or delivery information through
    // this endpoint even if they call it directly.
    if (context.user.role === "BRANCH_STAFF") {
      if (!permissions.canViewInventory || context.scope.type !== "BRANCH") {
        return NextResponse.json(
          { error: "You do not have permission to view this dashboard." },
          { status: 403 },
        );
      }

      const inventory = await prisma.branchInventory.findMany({
        where: {
          branchId: context.scope.branchId,
          isActive: true,
        },
        select: { stock: true },
      });

      const lowStockThreshold = 5;
      const totalProducts = inventory.length;
      const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
      const lowStockProducts = inventory.filter(
        (item) => item.stock > 0 && item.stock <= lowStockThreshold,
      ).length;
      const outOfStockProducts = inventory.filter(
        (item) => item.stock === 0,
      ).length;

      return NextResponse.json({
        user: context.user,
        scope: context.scope,
        branch: context.branch,
        stats: {
          totalProducts,
          totalStock,
          lowStockProducts,
          outOfStockProducts,
        },
      });
    }

    if (!permissions.canViewDashboard) {
      return NextResponse.json(
        { error: "You do not have permission to view this dashboard." },
        { status: 403 },
      );
    }

    const branchFilter =
      context.scope.type === "GLOBAL"
        ? {}
        : { branchId: context.scope.branchId };

    const branchWhere =
      context.scope.type === "GLOBAL"
        ? {}
        : { id: context.scope.branchId };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

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
      prisma.branch.count({ where: branchWhere }),
      prisma.branch.count({
        where:
          context.scope.type === "GLOBAL"
            ? { isActive: true }
            : { id: context.scope.branchId, isActive: true },
      }),
      prisma.order.count({ where: branchFilter }),
      prisma.order.count({ where: { ...branchFilter, status: "PENDING" } }),
      prisma.order.count({
        where: { ...branchFilter, createdAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      prisma.branchStaff.count({
        where:
          context.scope.type === "GLOBAL"
            ? {}
            : { branchId: context.scope.branchId },
      }),
      prisma.deliveryStaff.count({
        where:
          context.scope.type === "GLOBAL"
            ? { isActive: true }
            : { branchId: context.scope.branchId, isActive: true },
      }),
      prisma.order.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
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
          branch: { select: { id: true, name: true, code: true } },
          deliveryStaff: {
            select: {
              id: true,
              user: { select: { id: true, name: true } },
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              total: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.branch.findMany({
        where: branchWhere,
        orderBy: { name: "asc" },
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
        revenue: Number(revenueResult._sum.total ?? 0),
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
        deliveryStaff: order.deliveryStaff?.user ?? null,
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
    console.error("Dashboard API error:", error);

    const message = error instanceof Error ? error.message : "";

    if (message === "You must be logged in to access the dashboard.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (
      message === "This account does not have dashboard access." ||
      message === "This branch administrator is not assigned to a branch." ||
      message === "This branch staff member is not assigned to a branch." ||
      message === "This branch is currently inactive."
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: "Failed to load dashboard.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}
