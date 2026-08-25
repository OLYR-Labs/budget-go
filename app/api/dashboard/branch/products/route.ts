import { NextResponse } from "next/server";

import { getBranchDashboardContext } from "@/lib/branch-dashboard-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getBranchDashboardContext();

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        branchInventory: {
          none: {
            branchId: context.branch.id,
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        imageUrl: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to load available branch products:", error);

    return NextResponse.json(
      { error: "Failed to load available products." },
      { status: 500 },
    );
  }
}
