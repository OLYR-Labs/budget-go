import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  Prisma,
} from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const context = await getDashboardContext();

    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    /*
     * --------------------------------------------------
     * Build branch scope
     * --------------------------------------------------
     */

    const branchFilter: Prisma.OrderWhereInput =
      context.scope.type === "GLOBAL"
        ? {}
        : {
            branchId: context.scope.branchId,
          };

    /*
     * --------------------------------------------------
     * Validate status
     * --------------------------------------------------
     */

    let requestedStatus: OrderStatus | undefined;

    if (statusParam) {
      const isValidStatus = Object.values(
        OrderStatus,
      ).includes(statusParam as OrderStatus);

      if (!isValidStatus) {
        return NextResponse.json(
          {
            error: "Invalid order status.",
          },
          {
            status: 400,
          },
        );
      }

      requestedStatus =
        statusParam as OrderStatus;
    }

    /*
     * --------------------------------------------------
     * Build filters
     * --------------------------------------------------
     */

    const where: Prisma.OrderWhereInput = {
      ...branchFilter,

      ...(requestedStatus
        ? {
            status: requestedStatus,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                orderNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                customerName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                customerPhone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    /*
     * --------------------------------------------------
     * Fetch orders
     * --------------------------------------------------
     */

    const orders = await prisma.order.findMany({
      where,

      orderBy: {
        createdAt: "desc",
      },

      take: 100,

      select: {
        id: true,
        orderNumber: true,

        status: true,
        paymentStatus: true,

        subtotal: true,
        deliveryFee: true,
        total: true,

        customerId: true,
        customerName: true,
        customerPhone: true,

        notes: true,

        deliveryLatitude: true,
        deliveryLongitude: true,
        deliveryDistanceKm: true,

        createdAt: true,
        updatedAt: true,

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
            isActive: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },

        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            total: true,

            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    /*
     * --------------------------------------------------
     * Response
     * --------------------------------------------------
     */

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,

        orderNumber: order.orderNumber,

        status: order.status,
        paymentStatus: order.paymentStatus,

        customer: {
          id: order.customerId,
          name: order.customerName,
          phone: order.customerPhone,
        },

        pricing: {
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
        },

        delivery: {
          latitude: order.deliveryLatitude,
          longitude: order.deliveryLongitude,
          distanceKm: order.deliveryDistanceKm,
        },

        notes: order.notes,

        branch: order.branch,

        deliveryStaff: order.deliveryStaff
          ? {
              id: order.deliveryStaff.id,
              isActive:
                order.deliveryStaff.isActive,
              user: order.deliveryStaff.user,
            }
          : null,

        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,

          quantity: item.quantity,

          unitPrice: Number(item.unitPrice),
          total: Number(item.total),

          product: item.product,
        })),

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),

      count: orders.length,

      scope: context.scope,
    });
  } catch (error) {
    console.error(
      "Failed to fetch dashboard orders:",
      error,
    );

    /*
     * --------------------------------------------------
     * Authentication errors
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * Dashboard access errors
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * Branch assignment errors
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * Generic error
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        error: "Failed to load orders.",

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