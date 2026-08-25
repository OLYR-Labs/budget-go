import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { branchId } = await params;

  if (!branchId) {
    return NextResponse.json(
      { error: "Branch ID is required." },
      { status: 400 },
    );
  }

  try {
    // Check the branch separately so a missing/invalid branch
    // is distinguishable from a database/query failure.
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, isActive: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found." },
        { status: 404 },
      );
    }

    if (!branch.isActive) {
      return NextResponse.json(
        { error: "This branch is currently inactive." },
        { status: 409 },
      );
    }

    // Read inventory first because price and stock belong to the
    // branch-specific inventory record, not the global Product.
    const inventory = await prisma.branchInventory.findMany({
      where: {
        branchId: branch.id,
        isActive: true,
        product: {
          isActive: true,
        },
      },
      select: {
        price: true,
        stock: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const products = inventory
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        imageUrl: item.product.imageUrl,
        price: Number(item.price),
        stock: item.stock,
        category: item.product.category
          ? { name: item.product.category.name }
          : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(products, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to fetch branch products:", error);

    const details =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Failed to fetch products.",
        ...(process.env.NODE_ENV !== "production" ? { details } : {}),
      },
      { status: 500 },
    );
  }
}
