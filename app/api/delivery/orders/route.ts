import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "DELIVERY_STAFF") {
      return NextResponse.json({ error: "Delivery staff access required." }, { status: 403 });
    }

    const deliveryStaff = await prisma.deliveryStaff.findUnique({
      where: { userId: session.user.id },
      select: { id: true, branchId: true, isActive: true, branch: { select: { name: true, code: true } } },
    });

    if (!deliveryStaff?.isActive) {
      return NextResponse.json({ error: "Your delivery staff account is inactive." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryStaffId: deliveryStaff.id,
        branchId: deliveryStaff.branchId,
        status: { in: ["ASSIGNED", "OUT_FOR_DELIVERY"] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        customerName: true,
        customerPhone: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        deliveryDistanceKm: true,
        notes: true,
        createdAt: true,
        branch: { select: { name: true, code: true, address: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    return NextResponse.json({
      staff: { id: deliveryStaff.id, branch: deliveryStaff.branch },
      orders: orders.map((order) => ({ ...order, total: Number(order.total) })),
    });
  } catch (error) {
    console.error("Delivery orders fetch failed:", error);
    return NextResponse.json({ error: "Failed to load assigned delivery orders." }, { status: 500 });
  }
}
