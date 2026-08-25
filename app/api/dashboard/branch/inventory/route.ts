import { NextResponse } from "next/server";

import { getBranchDashboardContext } from "@/lib/branch-dashboard-auth";
import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Returns inventory for the authenticated user's branch.
 *
 * Allowed:
 * - BRANCH_ADMIN
 * - BRANCH_STAFF
 *
 * Delivery staff cannot reach this route.
 */
export async function GET(request: Request) {
  try {
    const context = await getBranchDashboardContext();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const activeOnly =
      searchParams.get("activeOnly") !== "false";

    const inventory = await prisma.branchInventory.findMany({
      where: {
        branchId: context.branch.id,

        ...(activeOnly
          ? {
              isActive: true,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  product: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  product: {
                    sku: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: {
        product: {
          name: "asc",
        },
      },

      select: {
        id: true,
        branchId: true,
        productId: true,
        price: true,
        stock: true,
        isActive: true,
        updatedAt: true,

        product: {
          select: {
            id: true,
            name: true,
            description: true,
            sku: true,
            imageUrl: true,
            isActive: true,

            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,

      branch: context.branch,

      inventory: inventory.map((item) => ({
        id: item.id,
        branchId: item.branchId,
        productId: item.productId,

        price: Number(item.price),
        stock: item.stock,

        isActive: item.isActive,

        updatedAt: item.updatedAt,

        product: item.product,
      })),

      count: inventory.length,
    });
  } catch (error) {
    console.error(
      "Failed to fetch branch inventory:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load branch inventory.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * Adds an existing product to the authenticated branch.
 *
 * Both:
 * - BRANCH_ADMIN
 * - BRANCH_STAFF
 *
 * are allowed.
 *
 * This does NOT create a global Product.
 * It creates the branch-specific inventory record.
 */
export async function POST(request: Request) {
  try {
    const context = await getBranchDashboardContext();

    const body = await request.json();

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    const price =
      typeof body.price === "number"
        ? body.price
        : Number(body.price);

    const stock =
      typeof body.stock === "number"
        ? body.stock
        : Number(body.stock ?? 0);

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          error: "Price must be a valid non-negative number.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          error:
            "Stock must be a valid non-negative whole number.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Verify that the product exists.
     */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Do not allow inactive global products to be added.
     */

    if (!product.isActive) {
      return NextResponse.json(
        {
          error:
            "This product is inactive and cannot be added to the branch.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Prevent duplicate branch inventory.
     */

    const existing =
      await prisma.branchInventory.findUnique({
        where: {
          branchId_productId: {
            branchId: context.branch.id,
            productId,
          },
        },

        select: {
          id: true,
          isActive: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "This product already exists in this branch inventory.",
        },
        {
          status: 409,
        },
      );
    }

    const inventory =
      await prisma.branchInventory.create({
        data: {
          branchId: context.branch.id,
          productId,
          price,
          stock,
          isActive: true,
        },

        select: {
          id: true,
          branchId: true,
          productId: true,
          price: true,
          stock: true,
          isActive: true,
          updatedAt: true,

          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              imageUrl: true,
              isActive: true,

              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        inventory: {
          ...inventory,
          price: Number(inventory.price),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to add product to branch inventory:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to add product to inventory.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ============================================================
 * PATCH
 * ============================================================
 *
 * Updates branch-specific inventory.
 *
 * Both:
 * - BRANCH_ADMIN
 * - BRANCH_STAFF
 *
 * can:
 * - update price
 * - set stock
 * - activate/deactivate branch inventory
 */
export async function PATCH(request: Request) {
  try {
    const context = await getBranchDashboardContext();

    const body = await request.json();

    const inventoryId =
      typeof body.inventoryId === "string"
        ? body.inventoryId.trim()
        : "";

    if (!inventoryId) {
      return NextResponse.json(
        {
          error: "Inventory ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.branchInventory.findFirst({
        where: {
          id: inventoryId,
          branchId: context.branch.id,
        },

        select: {
          id: true,
          branchId: true,
          productId: true,
          price: true,
          stock: true,
          isActive: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Inventory item was not found in your branch.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Build update object only from supplied fields.
     */

    const data: {
      price?: number;
      stock?: number;
      isActive?: boolean;
    } = {};

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            error:
              "Price must be a valid non-negative number.",
          },
          {
            status: 400,
          },
        );
      }

      data.price = price;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          {
            error:
              "Stock must be a valid non-negative whole number.",
          },
          {
            status: 400,
          },
        );
      }

      data.stock = stock;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            error: "isActive must be a boolean.",
          },
          {
            status: 400,
          },
        );
      }

      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one inventory field must be provided.",
        },
        {
          status: 400,
        },
      );
    }

    const inventory =
      await prisma.branchInventory.update({
        where: {
          id: existing.id,
        },

        data,

        select: {
          id: true,
          branchId: true,
          productId: true,
          price: true,
          stock: true,
          isActive: true,
          updatedAt: true,

          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              imageUrl: true,
              isActive: true,

              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      inventory: {
        ...inventory,
        price: Number(inventory.price),
      },
    });
  } catch (error) {
    console.error(
      "Failed to update branch inventory:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to update inventory.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ============================================================
 * DELETE
 * ============================================================
 *
 * Removes a product from the branch inventory.
 *
 * IMPORTANT:
 * We do a soft delete by setting isActive=false.
 *
 * We do NOT physically delete the BranchInventory row because
 * historical orders may reference the Product and we want to
 * preserve inventory history.
 *
 * Both manager and staff can perform this operation.
 */
export async function DELETE(request: Request) {
  try {
    const context = await getBranchDashboardContext();

    const { searchParams } = new URL(request.url);

    const inventoryId =
      searchParams.get("inventoryId")?.trim();

    if (!inventoryId) {
      return NextResponse.json(
        {
          error: "Inventory ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.branchInventory.findFirst({
        where: {
          id: inventoryId,
          branchId: context.branch.id,
        },

        select: {
          id: true,
          isActive: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Inventory item was not found in your branch.",
        },
        {
          status: 404,
        },
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        {
          error:
            "This inventory item is already inactive.",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.branchInventory.update({
      where: {
        id: existing.id,
      },

      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Product removed from branch inventory.",
    });
  } catch (error) {
    console.error(
      "Failed to remove branch inventory:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to remove product from inventory.",
      },
      {
        status: 500,
      },
    );
  }
}