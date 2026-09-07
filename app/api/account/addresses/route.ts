import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCustomerId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "CUSTOMER" ? session.user.id : null;
}

function validCoordinates(latitude: unknown, longitude: unknown) {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export async function POST(request: Request) {
  try {
    const userId = await getCustomerId();
    if (!userId) return NextResponse.json({ error: "Please sign in to manage addresses." }, { status: 401 });
    const body = (await request.json()) as { label?: string; recipientName?: string; phone?: string; address?: string; city?: string; latitude?: number; longitude?: number; isDefault?: boolean };
    const label = body.label?.trim() || "Home";
    const recipientName = body.recipientName?.trim();
    const phone = body.phone?.trim();
    const address = body.address?.trim();
    const city = body.city?.trim();
    if (!recipientName || !phone || !address || !city) return NextResponse.json({ error: "Name, phone, address and city are required." }, { status: 400 });
    if (!validCoordinates(body.latitude, body.longitude)) return NextResponse.json({ error: "A valid map location is required." }, { status: 400 });

    const makeDefault = Boolean(body.isDefault) || (await prisma.customerAddress.count({ where: { userId } })) === 0;
    const created = await prisma.$transaction(async (tx) => {
      if (makeDefault) await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.customerAddress.create({ data: { userId, label, recipientName, phone, address, city, latitude: body.latitude!, longitude: body.longitude!, isDefault: makeDefault }, select: { id: true, label: true, recipientName: true, phone: true, address: true, city: true, latitude: true, longitude: true, isDefault: true } });
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer address:", error);
    return NextResponse.json({ error: "Unable to save this address." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCustomerId();
    if (!userId) return NextResponse.json({ error: "Please sign in to manage addresses." }, { status: 401 });
    const body = (await request.json()) as { id?: string; label?: string; recipientName?: string; phone?: string; address?: string; city?: string; latitude?: number; longitude?: number; isDefault?: boolean };
    if (!body.id) return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
    const existing = await prisma.customerAddress.findFirst({ where: { id: body.id, userId } });
    if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    const data = {
      label: body.label?.trim() || existing.label,
      recipientName: body.recipientName?.trim() || existing.recipientName,
      phone: body.phone?.trim() || existing.phone,
      address: body.address?.trim() || existing.address,
      city: body.city?.trim() || existing.city,
      latitude: body.latitude ?? existing.latitude,
      longitude: body.longitude ?? existing.longitude,
    };
    if (!validCoordinates(data.latitude, data.longitude)) return NextResponse.json({ error: "A valid map location is required." }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.customerAddress.update({ where: { id: existing.id }, data: { ...data, ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}) }, select: { id: true, label: true, recipientName: true, phone: true, address: true, city: true, latitude: true, longitude: true, isDefault: true } });
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update customer address:", error);
    return NextResponse.json({ error: "Unable to update this address." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCustomerId();
    if (!userId) return NextResponse.json({ error: "Please sign in to manage addresses." }, { status: 401 });
    const body = (await request.json()) as { id?: string };
    if (!body.id) return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
    const existing = await prisma.customerAddress.findFirst({ where: { id: body.id, userId } });
    if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    await prisma.customerAddress.delete({ where: { id: existing.id } });
    if (existing.isDefault) {
      const replacement = await prisma.customerAddress.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
      if (replacement) await prisma.customerAddress.update({ where: { id: replacement.id }, data: { isDefault: true } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete customer address:", error);
    return NextResponse.json({ error: "Unable to delete this address." }, { status: 500 });
  }
}
