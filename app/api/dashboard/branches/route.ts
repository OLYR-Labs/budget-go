import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const branches = await prisma.branch.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      latitude: true,
      longitude: true,
      deliveryRadius: true,
      isActive: true,
    },
  });

  return NextResponse.json({ branches });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const branchId = typeof body.branchId === "string" ? body.branchId : "";
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!branchId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "Branch, latitude and longitude are required." }, { status: 400 });
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: "Latitude must be between -90 and 90." }, { status: 400 });
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Longitude must be between -180 and 180." }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: { latitude, longitude },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryRadius: true,
        isActive: true,
      },
    });

    return NextResponse.json({ branch: updated });
  } catch (error) {
    console.error("Branch location update failed:", error);
    return NextResponse.json({ error: "Failed to update branch location." }, { status: 500 });
  }
}
