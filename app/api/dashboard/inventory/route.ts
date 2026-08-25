import { NextResponse } from "next/server";

import { getDashboardContext } from "@/lib/dashboard-auth";
import { getDashboardPermissions } from "@/lib/dashboard-permission";
import { prisma } from "@/lib/prisma";

/*
 * --------------------------------------------------
 * GET
 * --------------------------------------------------
 *
 * Returns inventory for the user's dashboard scope.
 *
 * ADMIN:
 *   Can see inventory across all branches.
 *
 * BRANCH_ADMIN:
 *   Can only see their assigned branch.
 *
 * BRANCH_STAFF:
 *   Can only see their assigned branch.
 *
 * DELIVERY_STAFF / CUSTOMER:
 *   Rejected.
 */
export async function GET(request: Request) {
  try {
    const context = await getDashboardContext();

    const permissions = getDashboardPermissions(
      context.user.role,
    );

    if (!permissions.canViewInventory) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view inventory.",
        },
        {
          status: 403,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim();
    const includeInactive =
      searchParams.get("includeInactive") === "true";

    /*
     * --------------------------------------------------
     * Branch scope
     * --------------------------------------------------
     */

    const branchFilter =
      context.scope.type === "GLOBAL"
        ? {}
        : {
            branchId: context.scope.branchId,
          };

    /*
     * --------------------------------------------------
     * Inventory filters
     * --------------------------------------------------
     */

    const where = {
      ...branchFilter,

      ...(includeInactive
        ? {}
        : {
            isActive: true,
          }),

      ...(search
        ? {
            product: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  sku: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
    };

    /*
     * --------------------------------------------------
     * Fetch inventory
     * --------------------------------------------------
     */

    const inventory =
      await prisma.branchInventory.findMany({
        where,

        orderBy: [
          {
            isActive: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],

        take: 500,

        select: {
          id: true,

          branchId: true,
          productId: true,

          price: true,
          stock: true,

          isActive: true,

          updatedAt: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },

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
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

    /*
     * --------------------------------------------------
     * Response
     * --------------------------------------------------
     */

    return NextResponse.json({
      inventory: inventory.map((item) => ({
        id: item.id,

        branchId: item.branchId,
        productId: item.productId,

        price: Number(item.price),
        stock: item.stock,

        isActive: item.isActive,

        updatedAt: item.updatedAt,

        branch: item.branch,

        product: item.product,
      })),

      count: inventory.length,

      scope: context.scope,
    });
  } catch (error) {
    console.error(
      "Failed to fetch dashboard inventory:",
      error,
    );

    /*
     * --------------------------------------------------
     * Authentication
     * --------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message ===
        "You must be logged in to access the dashboard."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Dashboard access
     * --------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message ===
        "This account does not have dashboard access."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Branch assignment
     * --------------------------------------------------
     */

    if (
      error instanceof Error &&
      (
        error.message ===
          "This branch administrator is not assigned to a branch." ||
        error.message ===
          "This branch staff member is not assigned to a branch."
      )
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Generic error
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        error: "Failed to load inventory.",

        details:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * --------------------------------------------------
 * POST
 * --------------------------------------------------
 *
 * Adds an existing product to a branch's inventory.
 *
 * Required:
 *   productId
 *   price
 *
 * Optional:
 *   stock
 *
 * Only ADMIN, BRANCH_ADMIN and BRANCH_STAFF with
 * inventory permissions can perform this operation.
 */
export async function POST(request: Request) {
  try {
    const context = await getDashboardContext();

    const permissions = getDashboardPermissions(
      context.user.role,
    );

    if (!permissions.canAddProduct) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to add products to inventory.",
        },
        {
          status: 403,
        },
      );
    }

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
        : body.stock === undefined
          ? 0
          : Number(body.stock);

    /*
     * --------------------------------------------------
     * Validate input
     * --------------------------------------------------
     */

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
          error:
            "Price must be a valid number greater than or equal to 0.",
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
            "Stock must be a whole number greater than or equal to 0.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Determine branch
     * --------------------------------------------------
     *
     * Branch users are restricted to their own branch.
     *
     * ADMIN must provide branchId because there is no
     * single assigned branch for a global administrator.
     */

    let branchId: string;

    if (context.scope.type === "GLOBAL") {
      const requestedBranchId =
        typeof body.branchId === "string"
          ? body.branchId.trim()
          : "";

      if (!requestedBranchId) {
        return NextResponse.json(
          {
            error:
              "Branch ID is required for global administrators.",
          },
          {
            status: 400,
          },
        );
      }

      branchId = requestedBranchId;
    } else {
      branchId = context.scope.branchId;
    }

    /*
     * --------------------------------------------------
     * Verify branch
     * --------------------------------------------------
     */

    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        {
          error: "Branch not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!branch.isActive) {
      return NextResponse.json(
        {
          error:
            "Inventory cannot be modified for an inactive branch.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Verify product
     * --------------------------------------------------
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

    if (!product.isActive) {
      return NextResponse.json(
        {
          error:
            "This product is inactive and cannot be added to inventory.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Prevent duplicate inventory
     * --------------------------------------------------
     */

    const existing =
      await prisma.branchInventory.findUnique({
        where: {
          branchId_productId: {
            branchId,
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
          error: existing.isActive
            ? "This product is already in this branch's inventory."
            : "This product already exists in this branch's inventory but is inactive. Reactivate it instead.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Create branch inventory
     * --------------------------------------------------
     */

    const inventory =
      await prisma.branchInventory.create({
        data: {
          branchId,
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

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message: "Product added to inventory successfully.",

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
      "Failed to add product to dashboard inventory:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "You must be logged in to access the dashboard."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "This account does not have dashboard access."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to add product to inventory.",

        details:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * --------------------------------------------------
 * PATCH
 * --------------------------------------------------
 *
 * Updates an existing branch inventory record.
 *
 * Supported fields:
 *
 *   stock
 *   price
 *   isActive
 *
 * The request can also use:
 *
 *   stockChange
 *
 * Example:
 *
 * {
 *   "inventoryId": "...",
 *   "stockChange": 5
 * }
 *
 * or:
 *
 * {
 *   "inventoryId": "...",
 *   "stock": 25
 * }
 */
export async function PATCH(request: Request) {
  try {
    const context = await getDashboardContext();

    const permissions = getDashboardPermissions(
      context.user.role,
    );

    if (
      !permissions.canUpdateStock &&
      !permissions.canRemoveStock
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to update inventory.",
        },
        {
          status: 403,
        },
      );
    }

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

    /*
     * --------------------------------------------------
     * Find inventory
     * --------------------------------------------------
     */

    const inventory =
      await prisma.branchInventory.findUnique({
        where: {
          id: inventoryId,
        },

        select: {
          id: true,
          branchId: true,
          productId: true,
          stock: true,
          price: true,
          isActive: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
            },
          },
        },
      });

    if (!inventory) {
      return NextResponse.json(
        {
          error: "Inventory item not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Branch security
     * --------------------------------------------------
     *
     * Non-admin users can NEVER modify another branch's
     * inventory.
     */

    if (
      context.scope.type === "BRANCH" &&
      inventory.branchId !== context.scope.branchId
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to modify inventory outside your assigned branch.",
        },
        {
          status: 403,
        },
      );
    }

    if (!inventory.branch.isActive) {
      return NextResponse.json(
        {
          error:
            "Inventory cannot be modified for an inactive branch.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Build update data
     * --------------------------------------------------
     */

    const data: {
      stock?: number;
      price?: number;
      isActive?: boolean;
    } = {};

    /*
     * --------------------------------------------------
     * Absolute stock update
     * --------------------------------------------------
     */

    if (body.stock !== undefined) {
      if (!permissions.canUpdateStock) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to update stock.",
          },
          {
            status: 403,
          },
        );
      }

      const stock = Number(body.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          {
            error:
              "Stock must be a whole number greater than or equal to 0.",
          },
          {
            status: 400,
          },
        );
      }

      data.stock = stock;
    }

    /*
     * --------------------------------------------------
     * Relative stock update
     * --------------------------------------------------
     */

    if (body.stockChange !== undefined) {
      if (!permissions.canUpdateStock) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to update stock.",
          },
          {
            status: 403,
          },
        );
      }

      const stockChange = Number(body.stockChange);

      if (
        !Number.isInteger(stockChange) ||
        stockChange === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Stock change must be a non-zero whole number.",
          },
          {
            status: 400,
          },
        );
      }

      const newStock =
        inventory.stock + stockChange;

      if (newStock < 0) {
        return NextResponse.json(
          {
            error:
              "Stock cannot be reduced below 0.",
          },
          {
            status: 400,
          },
        );
      }

      data.stock = newStock;
    }

    /*
     * --------------------------------------------------
     * Price update
     * --------------------------------------------------
     */

    if (body.price !== undefined) {
      if (!permissions.canUpdateStock) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to update inventory pricing.",
          },
          {
            status: 403,
          },
        );
      }

      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            error:
              "Price must be a valid number greater than or equal to 0.",
          },
          {
            status: 400,
          },
        );
      }

      data.price = price;
    }

    /*
     * --------------------------------------------------
     * Active / inactive status
     * --------------------------------------------------
     */

    if (body.isActive !== undefined) {
      if (
        body.isActive !== true &&
        body.isActive !== false
      ) {
        return NextResponse.json(
          {
            error: "isActive must be a boolean.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Deactivating inventory is treated as removing
       * the product from the branch.
       */
      if (
        body.isActive === false &&
        !permissions.canRemoveStock
      ) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to remove inventory.",
          },
          {
            status: 403,
          },
        );
      }

      /*
       * Reactivating inventory is an inventory update.
       */
      if (
        body.isActive === true &&
        !permissions.canUpdateStock
      ) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to reactivate inventory.",
          },
          {
            status: 403,
          },
        );
      }

      data.isActive = body.isActive;
    }

    /*
     * --------------------------------------------------
     * Prevent empty update
     * --------------------------------------------------
     */

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error:
            "No inventory changes were provided.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Update inventory
     * --------------------------------------------------
     */

    const updated =
      await prisma.branchInventory.update({
        where: {
          id: inventory.id,
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

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
            },
          },
        },
      });

    return NextResponse.json({
      message: "Inventory updated successfully.",

      inventory: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    console.error(
      "Failed to update dashboard inventory:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "You must be logged in to access the dashboard."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "This account does not have dashboard access."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update inventory.",

        details:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * --------------------------------------------------
 * DELETE
 * --------------------------------------------------
 *
 * Soft-removes an inventory item from the branch.
 *
 * IMPORTANT:
 * We do NOT physically delete the BranchInventory
 * record because the unique branch/product relationship
 * should remain available for future reactivation.
 */
export async function DELETE(request: Request) {
  try {
    const context = await getDashboardContext();

    const permissions = getDashboardPermissions(
      context.user.role,
    );

    if (!permissions.canRemoveStock) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to remove inventory.",
        },
        {
          status: 403,
        },
      );
    }

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

    /*
     * --------------------------------------------------
     * Find inventory
     * --------------------------------------------------
     */

    const inventory =
      await prisma.branchInventory.findUnique({
        where: {
          id: inventoryId,
        },

        select: {
          id: true,
          branchId: true,
          isActive: true,

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });

    if (!inventory) {
      return NextResponse.json(
        {
          error: "Inventory item not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * --------------------------------------------------
     * Branch security
     * --------------------------------------------------
     */

    if (
      context.scope.type === "BRANCH" &&
      inventory.branchId !== context.scope.branchId
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to remove inventory outside your assigned branch.",
        },
        {
          status: 403,
        },
      );
    }

    if (!inventory.isActive) {
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

    /*
     * --------------------------------------------------
     * Soft delete
     * --------------------------------------------------
     */

    const updated =
      await prisma.branchInventory.update({
        where: {
          id: inventory.id,
        },

        data: {
          isActive: false,
        },

        select: {
          id: true,
          branchId: true,
          productId: true,
          price: true,
          stock: true,
          isActive: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      message:
        "Product removed from branch inventory.",

      inventory: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    console.error(
      "Failed to remove dashboard inventory:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "You must be logged in to access the dashboard."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "This account does not have dashboard access."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to remove inventory.",

        details:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}