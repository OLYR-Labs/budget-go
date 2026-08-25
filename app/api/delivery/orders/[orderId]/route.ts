import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";

type RouteContext = { params: Promise<{ orderId: string }> };

type RequestBody = {
  status?: OrderStatus;
  paymentCollected?: boolean;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "DELIVERY_STAFF") {
      return NextResponse.json({ error: "Delivery staff access required." }, { status: 403 });
    }

    const { orderId } = await params;
    if (!orderId?.trim()) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

    let body: RequestBody;
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (body.status !== OrderStatus.OUT_FOR_DELIVERY && body.status !== OrderStatus.DELIVERED) {
      return NextResponse.json({ error: "Delivery staff can only move an assigned order to OUT_FOR_DELIVERY or DELIVERED." }, { status: 400 });
    }

    const deliveryStaff = await prisma.deliveryStaff.findUnique({
      where: { userId: session.user.id },
      select: { id: true, branchId: true, isActive: true },
    });

    if (!deliveryStaff?.isActive) {
      return NextResponse.json({ error: "Your delivery staff account is inactive." }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId.trim(), deliveryStaffId: deliveryStaff.id, branchId: deliveryStaff.branchId },
      select: { id: true, status: true, orderNumber: true, paymentStatus: true, total: true },
    });

    if (!order) {
      return NextResponse.json({ error: "This order is not assigned to you." }, { status: 404 });
    }

    const expectedPrevious = body.status === OrderStatus.OUT_FOR_DELIVERY ? OrderStatus.ASSIGNED : OrderStatus.OUT_FOR_DELIVERY;
    if (order.status !== expectedPrevious) {
      return NextResponse.json({ error: `Order must be ${expectedPrevious.replaceAll("_", " ")} before it can move to ${body.status.replaceAll("_", " ")}.` }, { status: 409 });
    }

    if (body.status === OrderStatus.DELIVERED && order.paymentStatus !== "PAID" && body.paymentCollected !== true) {
      return NextResponse.json(
        { error: `COD payment of LKR ${Number(order.total).toLocaleString("en-LK")} must be collected before completing this order. Confirm that payment was collected and try again.` },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: body.status,
          ...(body.status === OrderStatus.DELIVERED && order.paymentStatus !== "PAID"
            ? { paymentStatus: "PAID", paidAt: new Date() }
            : {}),
        },
        select: { id: true, orderNumber: true, status: true, paymentStatus: true, paidAt: true, updatedAt: true },
      });
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Delivery order update failed:", error);
    return NextResponse.json({ error: "Failed to update delivery status." }, { status: 500 });
  }
}
