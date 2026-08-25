import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateDeliveryFee, haversineDistanceKm } from "@/lib/delivery";

type OrderItemInput = { id: string; quantity: number };

type OrderRequest = {
  branchId: string;
  items: OrderItemInput[];
  paymentMethod: "cod" | "online";
  deliveryDetails: {
    name: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
    latitude: number;
    longitude: number;
  };
};

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BG-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;
    const { branchId, items, paymentMethod, deliveryDetails } = body;

    if (!branchId?.trim()) return NextResponse.json({ error: "Branch information is required." }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    if (paymentMethod !== "cod") return NextResponse.json({ error: "Only Cash on Delivery is currently available." }, { status: 400 });
    if (!deliveryDetails) return NextResponse.json({ error: "Delivery details are required." }, { status: 400 });

    const { name, phone, address, city, notes } = deliveryDetails;
    const latitude = Number(deliveryDetails.latitude);
    const longitude = Number(deliveryDetails.longitude);

    if (!name?.trim()) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    if (!address?.trim()) return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });
    if (!city?.trim()) return NextResponse.json({ error: "City or area is required." }, { status: 400 });

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "A valid delivery map location is required." }, { status: 400 });
    }

    for (const cartItem of items) {
      if (!cartItem || typeof cartItem.id !== "string" || !cartItem.id.trim() || !Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
        return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
      }
    }

    const quantityMap = new Map<string, number>();
    for (const cartItem of items) {
      const productId = cartItem.id.trim();
      quantityMap.set(productId, (quantityMap.get(productId) ?? 0) + cartItem.quantity);
    }

    const normalizedItems: OrderItemInput[] = Array.from(quantityMap.entries()).map(([id, quantity]) => ({ id, quantity }));

    const branch = await prisma.branch.findFirst({
      where: { id: branchId.trim(), isActive: true },
      select: { id: true, name: true, code: true, latitude: true, longitude: true, deliveryRadius: true },
    });

    if (!branch) return NextResponse.json({ error: "The selected branch is no longer available." }, { status: 404 });

    const deliveryDistanceKm = haversineDistanceKm(branch.latitude, branch.longitude, latitude, longitude);

    if (deliveryDistanceKm > branch.deliveryRadius) {
      return NextResponse.json({ error: `This location is outside the ${branch.deliveryRadius} km delivery radius of ${branch.name}.` }, { status: 422 });
    }

    const { deliveryFee } = calculateDeliveryFee(deliveryDistanceKm);
    const productIds = normalizedItems.map((item) => item.id);

    const inventory = await prisma.branchInventory.findMany({
      where: { branchId: branch.id, productId: { in: productIds }, isActive: true, product: { isActive: true } },
      include: { product: true },
    });

    const inventoryMap = new Map(inventory.map((inventoryItem) => [inventoryItem.productId, inventoryItem]));

    for (const cartItem of normalizedItems) {
      const stockItem = inventoryMap.get(cartItem.id);
      if (!stockItem) return NextResponse.json({ error: "One of the products in your cart is no longer available at this branch." }, { status: 409 });
      if (stockItem.stock <= 0) return NextResponse.json({ error: `${stockItem.product.name} is currently out of stock.` }, { status: 409 });
      if (stockItem.stock < cartItem.quantity) return NextResponse.json({ error: `${stockItem.product.name} only has ${stockItem.stock} left in stock.` }, { status: 409 });
    }

    let subtotal = 0;
    const orderItems = normalizedItems.map((cartItem) => {
      const stockItem = inventoryMap.get(cartItem.id)!;
      const unitPrice = Number(stockItem.price);
      const itemTotal = unitPrice * cartItem.quantity;
      subtotal += itemTotal;
      return { productId: stockItem.productId, quantity: cartItem.quantity, unitPrice, total: itemTotal };
    });

    const total = subtotal + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
      for (const cartItem of normalizedItems) {
        const stockItem = await tx.branchInventory.findFirst({
          where: { branchId: branch.id, productId: cartItem.id, isActive: true, product: { isActive: true } },
        });

        if (!stockItem) throw new Error(`PRODUCT_UNAVAILABLE:${cartItem.id}`);
        if (stockItem.stock < cartItem.quantity) throw new Error(`INSUFFICIENT_STOCK:${cartItem.id}:${stockItem.stock}`);
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          branchId: branch.id,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotal,
          deliveryFee,
          total,
          deliveryLatitude: latitude,
          deliveryLongitude: longitude,
          deliveryDistanceKm,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          notes: [address.trim(), city.trim(), notes?.trim()].filter(Boolean).join("\n"),
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } }, branch: true },
      });

      for (const cartItem of normalizedItems) {
        const result = await tx.branchInventory.updateMany({
          where: { branchId: branch.id, productId: cartItem.id, isActive: true, stock: { gte: cartItem.quantity } },
          data: { stock: { decrement: cartItem.quantity } },
        });
        if (result.count !== 1) throw new Error(`STOCK_CHANGED:${cartItem.id}`);
      }

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),
        deliveryDistanceKm: Number(order.deliveryDistanceKm),
        deliveryLatitude: order.deliveryLatitude,
        deliveryLongitude: order.deliveryLongitude,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        branch: { id: order.branch.id, name: order.branch.name, code: order.branch.code },
        items: order.items.map((item) => ({ id: item.id, productId: item.productId, name: item.product.name, quantity: item.quantity, unitPrice: Number(item.unitPrice), total: Number(item.total) })),
        createdAt: order.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);

    if (error instanceof Error) {
      if (error.message.startsWith("PRODUCT_UNAVAILABLE:")) return NextResponse.json({ error: "One of the products in your cart is no longer available." }, { status: 409 });
      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const stock = error.message.split(":")[2];
        return NextResponse.json({ error: `The requested quantity is no longer available. Only ${stock} item${stock === "1" ? "" : "s"} remain in stock.` }, { status: 409 });
      }
      if (error.message.startsWith("STOCK_CHANGED:")) return NextResponse.json({ error: "Stock changed while placing your order. Please refresh your cart and try again." }, { status: 409 });
    }

    return NextResponse.json({ error: "Something went wrong while placing your order." }, { status: 500 });
  }
}
