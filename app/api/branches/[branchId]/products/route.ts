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
  try {
    const { branchId } = await params;

    if (!branchId) {
      return NextResponse.json(
        {
          error: "Branch ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const inventory =
      await prisma.branchInventory.findMany({
        where: {
          branchId,
          isActive: true,

          // IMPORTANT:
          // Do NOT filter by stock > 0.
          // Products with 0 stock must still appear
          // so the frontend can display "Out of stock".

          product: {
            isActive: true,
          },
        },

        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

    /*
     * Convert the database structure into the
     * simpler structure expected by the frontend.
     */
    const products = inventory
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        imageUrl: item.product.imageUrl,
        price: Number(item.price),
        stock: item.stock,
        category: item.product.category
          ? {
              name: item.product.category.name,
            }
          : null,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      );

    return NextResponse.json(products, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch branch products:",
      error,
    );

    /*
     * Keep the actual error in the server console,
     * but give the frontend a useful response.
     */
    return NextResponse.json(
      {
        error: "Failed to fetch products.",
      },
      {
        status: 500,
      },
    );
  }
}