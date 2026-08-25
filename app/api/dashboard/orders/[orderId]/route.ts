import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/lib/notifications";
import { OrderStatus } from "@/lib/generated/prisma/client";

type RouteContext = { params: Promise<{ orderId: string }> };
type UpdateOrderRequest = {
  status?: OrderStatus;
  deliveryStaffId?: string | null;
};

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ASSIGNED,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const VALID_STATUSES = new Set<OrderStatus>([...STATUS_ORDER, OrderStatus.CANCELLED]);

function canTransitionStatus(current: OrderStatus, next: OrderStatus) {
  if (current === next) return true;
  if (current === OrderStatus.CANCELLED || current === OrderStatus.DELIVERED) return false;
  if (next === OrderStatus.CANCELLED) return true;
  const currentIndex = STATUS_ORDER.indexOf(current);
  const nextIndex = STATUS_ORDER.indexOf(next);
  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

function serializeOrder(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customer: { id: order.customerId, name: order.customerName, phone: order.customerPhone },
    pricing: { subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), total: Number(order.total) },
    delivery: { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude, distanceKm: order.deliveryDistanceKm },
    notes: order.notes,
    branch: order.branch,
    deliveryStaff: order.deliveryStaff ? { id: order.deliveryStaff.id, isActive: order.deliveryStaff.isActive, user: order.deliveryStaff.user } : null,
    items: order.items.map((item: any) => ({ id: item.id, productId: item.productId, quantity: item.quantity, unitPrice: Number(item.unitPrice), total: Number(item.total), product: item.product })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function getOrder(orderId: string, branchId: string | null) {
  return prisma.order.findFirst({
    where: { id: orderId, ...(branchId ? { branchId } : {}) },
    select: {
      id: true, orderNumber: true, status: true, paymentStatus: true, subtotal: true, deliveryFee: true, total: true,
      customerId: true, customerName: true, customerPhone: true, notes: true, deliveryLatitude: true, deliveryLongitude: true,
      deliveryDistanceKm: true, createdAt: true, updatedAt: true,
      branch: { select: { id: true, name: true, code: true, address: true, latitude: true, longitude: true, deliveryRadius: true } },
      deliveryStaff: { select: { id: true, isActive: true, user: { select: { id: true, name: true, email: true, phone: true } } } },
      items: { select: { id: true, productId: true, quantity: true, unitPrice: true, total: true, product: { select: { id: true, name: true, sku: true, imageUrl: true } } } },
    },
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getDashboardContext();
    const permissions = getDashboardPermissions(context.user.role);
    if (!permissions.canViewOperationalOrders && !permissions.canViewCompletedOrders) return NextResponse.json({ error: "You do not have permission to view orders." }, { status: 403 });
    const { orderId } = await params;
    if (!orderId?.trim()) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    const order = await getOrder(orderId.trim(), context.scope.type === "GLOBAL" ? null : context.scope.branchId);
    if (!order) return NextResponse.json({ error: "Order not found or you do not have access to this order." }, { status: 404 });
    return NextResponse.json({ order: serializeOrder(order), scope: context.scope });
  } catch (error) {
    return handleDashboardError(error, "Failed to fetch dashboard order.");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await getDashboardContext();
    const permissions = getDashboardPermissions(context.user.role);
    if (!permissions.canAssignOrders) return NextResponse.json({ error: "You do not have permission to manage orders." }, { status: 403 });
    const { orderId } = await params;
    if (!orderId?.trim()) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

    let body: UpdateOrderRequest;
    try { body = (await request.json()) as UpdateOrderRequest; } catch { return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 }); }

    const hasStatusUpdate = body.status !== undefined;
    const hasDeliveryStaffUpdate = Object.prototype.hasOwnProperty.call(body, "deliveryStaffId");
    if (!hasStatusUpdate && !hasDeliveryStaffUpdate) return NextResponse.json({ error: "Nothing to update. Provide a status or deliveryStaffId." }, { status: 400 });

    const branchId = context.scope.type === "GLOBAL" ? null : context.scope.branchId;
    const existingOrder = await prisma.order.findFirst({ where: { id: orderId.trim(), ...(branchId ? { branchId } : {}) }, select: { id: true, branchId: true, status: true, deliveryStaffId: true } });
    if (!existingOrder) return NextResponse.json({ error: "Order not found or you do not have access to this order." }, { status: 404 });

    if (hasStatusUpdate) {
      if (typeof body.status !== "string" || !VALID_STATUSES.has(body.status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
      if (!canTransitionStatus(existingOrder.status, body.status)) return NextResponse.json({ error: `Order cannot move from ${existingOrder.status} to ${body.status}.` }, { status: 409 });
    }

    let deliveryStaffId = existingOrder.deliveryStaffId;
    if (hasDeliveryStaffUpdate) {
      if (body.deliveryStaffId !== null && typeof body.deliveryStaffId !== "string") return NextResponse.json({ error: "deliveryStaffId must be a valid ID or null." }, { status: 400 });
      if (body.deliveryStaffId === null) {
        deliveryStaffId = null;
      } else {
        const requestedStaffId = body.deliveryStaffId.trim();
        if (!requestedStaffId) return NextResponse.json({ error: "Delivery staff ID cannot be empty." }, { status: 400 });
        const staff = await prisma.deliveryStaff.findFirst({ where: { id: requestedStaffId, branchId: existingOrder.branchId, isActive: true }, select: { id: true } });
        if (!staff) return NextResponse.json({ error: "The selected delivery staff member is not active or does not belong to this branch." }, { status: 409 });
        deliveryStaffId = staff.id;
      }
    }

    let nextStatus = hasStatusUpdate ? body.status! : existingOrder.status;
    if (hasDeliveryStaffUpdate && !hasStatusUpdate) {
      if (existingOrder.status === OrderStatus.PENDING && deliveryStaffId) nextStatus = OrderStatus.ASSIGNED;
      if (existingOrder.status === OrderStatus.ASSIGNED && !deliveryStaffId) nextStatus = OrderStatus.PENDING;
    }
    if (nextStatus !== existingOrder.status && !canTransitionStatus(existingOrder.status, nextStatus)) return NextResponse.json({ error: `Order cannot move from ${existingOrder.status} to ${nextStatus}.` }, { status: 409 });
    if ((nextStatus === OrderStatus.ASSIGNED || nextStatus === OrderStatus.OUT_FOR_DELIVERY || nextStatus === OrderStatus.DELIVERED) && !deliveryStaffId) return NextResponse.json({ error: "A delivery staff member must be assigned for this delivery stage." }, { status: 409 });

    const isCancelling = hasStatusUpdate && body.status === OrderStatus.CANCELLED && existingOrder.status !== OrderStatus.CANCELLED;

    await prisma.$transaction(async (tx) => {
      if (isCancelling) {
        const items = await tx.orderItem.findMany({ where: { orderId: existingOrder.id }, select: { productId: true, quantity: true } });
        for (const item of items) {
          const inventory = await tx.branchInventory.findUnique({ where: { branchId_productId: { branchId: existingOrder.branchId, productId: item.productId } }, select: { id: true } });
          if (!inventory) throw new Error(`INVENTORY_NOT_FOUND:${item.productId}`);
          await tx.branchInventory.update({ where: { id: inventory.id }, data: { stock: { increment: item.quantity } } });
        }
      }
      await tx.order.update({ where: { id: existingOrder.id }, data: { ...(nextStatus !== existingOrder.status ? { status: nextStatus } : {}), ...(hasDeliveryStaffUpdate ? { deliveryStaffId } : {}) } });
    });

    if (hasDeliveryStaffUpdate && deliveryStaffId && deliveryStaffId !== existingOrder.deliveryStaffId) {
      const staff = await prisma.deliveryStaff.findUnique({ where: { id: deliveryStaffId }, select: { userId: true } });
      if (staff) {
        const orderForNotification = await prisma.order.findUnique({ where: { id: existingOrder.id }, select: { orderNumber: true, total: true } });
        if (orderForNotification) {
          await notifyUsers({
            userIds: [staff.userId],
            type: "DELIVERY_ASSIGNED",
            title: "New delivery assigned",
            body: `${orderForNotification.orderNumber} • Collect LKR ${Number(orderForNotification.total).toFixed(2)}`,
            url: `/delivery?order=${existingOrder.id}`,
            orderId: existingOrder.id,
          });
        }
      }
    }

    const updatedOrder = await getOrder(existingOrder.id, branchId);
    if (!updatedOrder) return NextResponse.json({ error: "Updated order could not be loaded." }, { status: 500 });

    return NextResponse.json({ success: true, message: isCancelling ? "Order cancelled and inventory restored." : "Order updated successfully.", order: serializeOrder(updatedOrder) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVENTORY_NOT_FOUND:")) return NextResponse.json({ error: "The order could not be cancelled because one of its inventory records no longer exists. No changes were made." }, { status: 409 });
    return handleDashboardError(error, "Failed to update dashboard order.");
  }
}

function handleDashboardError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message === "You must be logged in to access the dashboard.") return NextResponse.json({ error: message }, { status: 401 });
  if (message === "This account does not have dashboard access." || message === "This branch administrator is not assigned to a branch." || message === "This branch staff member is not assigned to a branch." || message === "This branch is currently inactive.") return NextResponse.json({ error: message }, { status: 403 });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback, details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined }, { status: 500 });
}