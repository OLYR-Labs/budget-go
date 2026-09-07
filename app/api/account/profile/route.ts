import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCustomer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "CUSTOMER") return null;
  return session.user;
}

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return NextResponse.json({ error: "Please sign in to access your account." }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          select: { id: true, label: true, recipientName: true, phone: true, address: true, city: true, latitude: true, longitude: true, isDefault: true },
        },
      },
    });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to load customer profile:", error);
    return NextResponse.json({ error: "Unable to load your account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCustomer();
    if (!user) return NextResponse.json({ error: "Please sign in to access your account." }, { status: 401 });
    const body = (await request.json()) as { name?: string; phone?: string };
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    if (!name) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name, phone }, select: { id: true, name: true, email: true, phone: true } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update customer profile:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
