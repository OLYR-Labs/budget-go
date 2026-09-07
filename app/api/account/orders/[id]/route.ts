import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Please sign in to view this order." }, { status: 401 });
    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, customerId: session.user.id },
      select: {
        id: true, orderNumber: true, status: true, paymentStatus: true, subtotal: true, deliveryFee: true, total: true, deliveryLatitude: true, deliveryLongitude: true, deliveryDistanceKm: true, customerName: true, customerPhone: true, notes: true, createdAt: true, updatedAt: true,
        branch: { select: { id: true, name: true, code: true } },
        items: { select: { id: true, quantity: true, unitPrice: true, total: true, product: { select: { name: true, imageUrl: true, sku: true } } } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ...order, subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), total: Number(order.total), deliveryDistanceKm: Number(order.deliveryDistanceKm), items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), total: Number(item.total) })) });
  } catch (error) {
    console.error("Failed to load customer order:", error);
    return NextResponse.json({ error: "Unable to load this order." }, { status: 500 });
  }
}
