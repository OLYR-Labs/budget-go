import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type UpdateOrderRequest = {
  status?: OrderStatus;
  deliveryStaffId?: string | null;
};

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const VALID_STATUSES = new Set<OrderStatus>([
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

function canTransitionStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) {
  /*
   * No change.
   */
  if (currentStatus === nextStatus) {
    return true;
  }

  /*
   * Cancelled orders cannot be changed.
   */
  if (currentStatus === OrderStatus.CANCELLED) {
    return false;
  }

  /*
   * Delivered orders cannot be changed.
   */
  if (currentStatus === OrderStatus.DELIVERED) {
    return false;
  }

  /*
   * Cancellation is allowed from any active state.
   */
  if (nextStatus === OrderStatus.CANCELLED) {
    return true;
  }

  /*
   * Normal order progression.
   */
  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus,
  );

  const nextIndex = STATUS_ORDER.indexOf(
    nextStatus,
  );

  if (currentIndex === -1 || nextIndex === -1) {
    return false;
  }

  /*
   * Do not allow orders to move backwards.
   */
  return nextIndex === currentIndex + 1;
}

async function getOrderForScope(
  orderId: string,
  context: Awaited<
    ReturnType<typeof getDashboardContext>
  >,
) {
  const branchFilter =
    context.scope.type === "GLOBAL"
      ? {}
      : {
          branchId: context.scope.branchId,
        };

  return prisma.order.findFirst({
    where: {
      id: orderId,
      ...branchFilter,
    },

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
          address: true,
          latitude: true,
          longitude: true,
          deliveryRadius: true,
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
}

/*
 * --------------------------------------------------
 * GET /api/dashboard/orders/[orderId]
 * --------------------------------------------------
 *
 * Returns one order.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getDashboardContext();

    const { orderId } = await params;

    if (!orderId?.trim()) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const order = await getOrderForScope(
      orderId.trim(),
      context,
    );

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found or you do not have access to this order.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      order: {
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
              isActive: order.deliveryStaff.isActive,
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
      },

      scope: context.scope,
    });
  } catch (error) {
    console.error(
      "Failed to fetch dashboard order:",
      error,
    );

    return handleDashboardError(error);
  }
}

/*
 * --------------------------------------------------
 * PATCH /api/dashboard/orders/[orderId]
 * --------------------------------------------------
 *
 * Supported:
 *
 * {
 *   "status": "CONFIRMED"
 * }
 *
 * or:
 *
 * {
 *   "deliveryStaffId": "staff-id"
 * }
 *
 * or:
 *
 * {
 *   "status": "OUT_FOR_DELIVERY",
 *   "deliveryStaffId": "staff-id"
 * }
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getDashboardContext();

    const { orderId } = await params;

    if (!orderId?.trim()) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    let body: UpdateOrderRequest;

    try {
      body =
        (await request.json()) as UpdateOrderRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const hasStatusUpdate =
      body.status !== undefined;

    const hasDeliveryStaffUpdate =
      Object.prototype.hasOwnProperty.call(
        body,
        "deliveryStaffId",
      );

    if (
      !hasStatusUpdate &&
      !hasDeliveryStaffUpdate
    ) {
      return NextResponse.json(
        {
          error:
            "Nothing to update. Provide a status or deliveryStaffId.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Find order inside the user's branch scope.
     * --------------------------------------------------
     */

    const existingOrder =
      await prisma.order.findFirst({
        where: {
          id: orderId.trim(),

          ...(context.scope.type === "GLOBAL"
            ? {}
            : {
                branchId:
                  context.scope.branchId,
              }),
        },

        select: {
          id: true,
          branchId: true,
          orderNumber: true,
          status: true,
          deliveryStaffId: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error:
            "Order not found or you do not have access to this order.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Validate status
     * --------------------------------------------------
     */

    if (hasStatusUpdate) {
      if (
        typeof body.status !== "string" ||
        !VALID_STATUSES.has(body.status)
      ) {
        return NextResponse.json(
          {
            error: "Invalid order status.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !canTransitionStatus(
          existingOrder.status,
          body.status,
        )
      ) {
        return NextResponse.json(
          {
            error: `Order cannot move from ${existingOrder.status} to ${body.status}.`,
          },
          {
            status: 409,
          },
        );
      }
    }

    /*
     * --------------------------------------------------
     * Validate delivery staff
     * --------------------------------------------------
     */

    let deliveryStaffId =
      existingOrder.deliveryStaffId;

    if (hasDeliveryStaffUpdate) {
      if (
        body.deliveryStaffId !== null &&
        typeof body.deliveryStaffId !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "deliveryStaffId must be a valid ID or null.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * null means unassign delivery staff.
       */
      if (body.deliveryStaffId === null) {
        deliveryStaffId = null;
      } else {
        const requestedStaffId =
          body.deliveryStaffId.trim();

        if (!requestedStaffId) {
          return NextResponse.json(
            {
              error:
                "Delivery staff ID cannot be empty.",
            },
            {
              status: 400,
            },
          );
        }

        const deliveryStaff =
          await prisma.deliveryStaff.findFirst({
            where: {
              id: requestedStaffId,

              branchId: existingOrder.branchId,

              isActive: true,
            },

            select: {
              id: true,
              branchId: true,
              isActive: true,
            },
          });

        if (!deliveryStaff) {
          return NextResponse.json(
            {
              error:
                "The selected delivery staff member is not active or does not belong to this branch.",
            },
            {
              status: 409,
            },
          );
        }

        deliveryStaffId =
          deliveryStaff.id;
      }
    }

    /*
     * --------------------------------------------------
     * Additional delivery rules
     * --------------------------------------------------
     */

    const nextStatus =
      hasStatusUpdate
        ? body.status!
        : existingOrder.status;

    /*
     * OUT_FOR_DELIVERY requires a delivery staff member.
     */
    if (
      nextStatus ===
        OrderStatus.OUT_FOR_DELIVERY &&
      !deliveryStaffId
    ) {
      return NextResponse.json(
        {
          error:
            "A delivery staff member must be assigned before the order can go out for delivery.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * DELIVERED requires a delivery staff member.
     */
    if (
      nextStatus === OrderStatus.DELIVERED &&
      !deliveryStaffId
    ) {
      return NextResponse.json(
        {
          error:
            "A delivery staff member must be assigned before the order can be marked as delivered.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Cancellation
     * --------------------------------------------------
     *
     * If an order is cancelled, restore the exact
     * quantities back into this branch's inventory.
     *
     * Everything happens in ONE transaction.
     */

    const isCancelling =
      hasStatusUpdate &&
      body.status === OrderStatus.CANCELLED &&
      existingOrder.status !== OrderStatus.CANCELLED;

    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          if (isCancelling) {
            const orderItems =
              await tx.orderItem.findMany({
                where: {
                  orderId: existingOrder.id,
                },

                select: {
                  productId: true,
                  quantity: true,
                },
              });

            for (const item of orderItems) {
              const inventory =
                await tx.branchInventory.findFirst({
                  where: {
                    branchId:
                      existingOrder.branchId,

                    productId: item.productId,

                    isActive: true,
                  },

                  select: {
                    id: true,
                    stock: true,
                  },
                });

              /*
               * If the inventory record no longer exists,
               * don't silently cancel and lose the stock.
               */
              if (!inventory) {
                throw new Error(
                  `INVENTORY_NOT_FOUND:${item.productId}`,
                );
              }

              await tx.branchInventory.update({
                where: {
                  id: inventory.id,
                },

                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }

          return tx.order.update({
            where: {
              id: existingOrder.id,
            },

            data: {
              ...(hasStatusUpdate
                ? {
                    status: body.status,
                  }
                : {}),

              ...(hasDeliveryStaffUpdate
                ? {
                    deliveryStaffId,
                  }
                : {}),
            },

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
                  address: true,
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
        },
      );

    /*
     * --------------------------------------------------
     * Response
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message: isCancelling
        ? "Order cancelled and inventory restored."
        : "Order updated successfully.",

      order: {
        id: updatedOrder.id,

        orderNumber:
          updatedOrder.orderNumber,

        status: updatedOrder.status,
        paymentStatus:
          updatedOrder.paymentStatus,

        customer: {
          id: updatedOrder.customerId,
          name: updatedOrder.customerName,
          phone: updatedOrder.customerPhone,
        },

        pricing: {
          subtotal: Number(
            updatedOrder.subtotal,
          ),
          deliveryFee: Number(
            updatedOrder.deliveryFee,
          ),
          total: Number(
            updatedOrder.total,
          ),
        },

        delivery: {
          latitude:
            updatedOrder.deliveryLatitude,
          longitude:
            updatedOrder.deliveryLongitude,
          distanceKm:
            updatedOrder.deliveryDistanceKm,
        },

        notes: updatedOrder.notes,

        branch: updatedOrder.branch,

        deliveryStaff:
          updatedOrder.deliveryStaff
            ? {
                id: updatedOrder
                  .deliveryStaff.id,

                isActive:
                  updatedOrder
                    .deliveryStaff
                    .isActive,

                user:
                  updatedOrder
                    .deliveryStaff
                    .user,
              }
            : null,

        items: updatedOrder.items.map(
          (item) => ({
            id: item.id,
            productId: item.productId,

            quantity: item.quantity,

            unitPrice: Number(
              item.unitPrice,
            ),

            total: Number(item.total),

            product: item.product,
          }),
        ),

        createdAt:
          updatedOrder.createdAt,

        updatedAt:
          updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Failed to update dashboard order:",
      error,
    );

    /*
     * --------------------------------------------------
     * Inventory cancellation error
     * --------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message.startsWith(
        "INVENTORY_NOT_FOUND:",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The order could not be cancelled because one of its inventory records no longer exists. No changes were made.",
        },
        {
          status: 409,
        },
      );
    }

    return handleDashboardError(error);
  }
}

/*
 * --------------------------------------------------
 * Dashboard error handler
 * --------------------------------------------------
 */

function handleDashboardError(
  error: unknown,
) {
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
      error:
        "Something went wrong while processing the order.",

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