import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryRadius: true,
        _count: {
          select: {
            inventory: {
              where: {
                isActive: true,
                stock: { gt: 0 },
                product: { isActive: true },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        latitude: branch.latitude,
        longitude: branch.longitude,
        deliveryRadiusKm: branch.deliveryRadius,
        availableProductCount: branch._count.inventory,
      })),
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch branches:", error);

    return NextResponse.json(
      { error: "Failed to load branches." },
      { status: 500 },
    );
  }
}
