import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OrderItemInput = {
  id: string;
  quantity: number;
};

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
  };
};

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `BG-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Parse request
    // --------------------------------------------------

    const body = (await request.json()) as OrderRequest;

    const {
      branchId,
      items,
      paymentMethod,
      deliveryDetails,
    } = body;

    // --------------------------------------------------
    // Validate branch
    // --------------------------------------------------

    if (!branchId?.trim()) {
      return NextResponse.json(
        {
          error:
            "Branch information is required. Please return to the shop and try again.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Validate cart
    // --------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Validate payment method
    // --------------------------------------------------

    if (paymentMethod !== "cod") {
      return NextResponse.json(
        {
          error:
            "Only Cash on Delivery is currently available.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Validate delivery details
    // --------------------------------------------------

    if (!deliveryDetails) {
      return NextResponse.json(
        {
          error: "Delivery details are required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      name,
      phone,
      address,
      city,
      notes,
    } = deliveryDetails;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        {
          error: "Phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        {
          error: "Delivery address is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!city?.trim()) {
      return NextResponse.json(
        {
          error: "City or area is required.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Validate cart item structure
    // --------------------------------------------------

    for (const cartItem of items) {
      if (
        !cartItem ||
        typeof cartItem.id !== "string" ||
        !cartItem.id.trim() ||
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error: "Invalid cart item.",
          },
          {
            status: 400,
          },
        );
      }
    }

    // --------------------------------------------------
    // Combine duplicate product IDs
    //
    // This protects against a cart accidentally containing
    // the same product more than once.
    // --------------------------------------------------

    const quantityMap = new Map<string, number>();

    for (const cartItem of items) {
      const productId = cartItem.id.trim();

      quantityMap.set(
        productId,
        (quantityMap.get(productId) ?? 0) +
          cartItem.quantity,
      );
    }

    const normalizedItems: OrderItemInput[] = Array.from(
      quantityMap.entries(),
    ).map(([id, quantity]) => ({
      id,
      quantity,
    }));

    // --------------------------------------------------
    // Find the EXACT branch used by the storefront
    // --------------------------------------------------

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId.trim(),
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        {
          error:
            "The selected branch is no longer available. Please refresh the shop and try again.",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // Get inventory for THIS branch only
    // --------------------------------------------------

    const productIds = normalizedItems.map(
      (item) => item.id,
    );

    const inventory =
      await prisma.branchInventory.findMany({
        where: {
          branchId: branch.id,

          productId: {
            in: productIds,
          },

          isActive: true,

          product: {
            isActive: true,
          },
        },

        include: {
          product: true,
        },
      });

    // --------------------------------------------------
    // Create inventory lookup map
    // --------------------------------------------------

    const inventoryMap = new Map(
      inventory.map((inventoryItem) => [
        inventoryItem.productId,
        inventoryItem,
      ]),
    );

    // --------------------------------------------------
    // Validate every product
    // --------------------------------------------------

    for (const cartItem of normalizedItems) {
      const stockItem = inventoryMap.get(
        cartItem.id,
      );

      // Product doesn't exist in this branch
      if (!stockItem) {
        return NextResponse.json(
          {
            error:
              "One of the products in your cart is no longer available at this branch. Please refresh your cart and try again.",
          },
          {
            status: 409,
          },
        );
      }

      // Product is out of stock
      if (stockItem.stock <= 0) {
        return NextResponse.json(
          {
            error: `${stockItem.product.name} is currently out of stock.`,
          },
          {
            status: 409,
          },
        );
      }

      // Not enough stock
      if (
        stockItem.stock <
        cartItem.quantity
      ) {
        return NextResponse.json(
          {
            error: `${stockItem.product.name} only has ${stockItem.stock} left in stock.`,
          },
          {
            status: 409,
          },
        );
      }
    }

    // --------------------------------------------------
    // Calculate total using DATABASE prices
    //
    // Never trust prices sent from the browser.
    // --------------------------------------------------

    let subtotal = 0;

    const orderItems = normalizedItems.map(
      (cartItem) => {
        const stockItem = inventoryMap.get(
          cartItem.id,
        )!;

        const unitPrice = Number(
          stockItem.price,
        );

        const itemTotal =
          unitPrice * cartItem.quantity;

        subtotal += itemTotal;

        return {
          productId: stockItem.productId,
          quantity: cartItem.quantity,
          unitPrice,
          total: itemTotal,
        };
      },
    );

    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    // --------------------------------------------------
    // Create order + reduce stock atomically
    // --------------------------------------------------

    const order = await prisma.$transaction(
      async (tx) => {
        // ----------------------------------------------
        // Re-check stock INSIDE the transaction
        //
        // This prevents two customers from successfully
        // buying the same final item at the same time.
        // ----------------------------------------------

        for (const cartItem of normalizedItems) {
          const stockItem =
            await tx.branchInventory.findFirst({
              where: {
                branchId: branch.id,
                productId: cartItem.id,
                isActive: true,
                product: {
                  isActive: true,
                },
              },
            });

          if (!stockItem) {
            throw new Error(
              `PRODUCT_UNAVAILABLE:${cartItem.id}`,
            );
          }

          if (
            stockItem.stock <
            cartItem.quantity
          ) {
            throw new Error(
              `INSUFFICIENT_STOCK:${stockItem.productId}:${stockItem.stock}`,
            );
          }
        }

        // ----------------------------------------------
        // Create order
        // ----------------------------------------------

        const createdOrder =
          await tx.order.create({
            data: {
              orderNumber:
                generateOrderNumber(),

              branchId: branch.id,

              status: "PENDING",

              paymentStatus: "PENDING",

              subtotal,

              deliveryFee,

              total,

              /*
               * For now the delivery location is stored
               * as the branch location.
               *
               * Later this can be replaced with the
               * customer's selected map location.
               */

              deliveryLatitude:
                branch.latitude,

              deliveryLongitude:
                branch.longitude,

              deliveryDistanceKm: 0,

              customerName: name.trim(),

              customerPhone:
                phone.trim(),

              notes: [
                address.trim(),
                city.trim(),
                notes?.trim(),
              ]
                .filter(Boolean)
                .join("\n"),

              items: {
                create: orderItems,
              },
            },

            include: {
              items: {
                include: {
                  product: true,
                },
              },

              branch: true,
            },
          });

        // ----------------------------------------------
        // Reduce inventory
        // ----------------------------------------------

        for (const cartItem of normalizedItems) {
          const result =
            await tx.branchInventory.updateMany(
              {
                where: {
                  branchId: branch.id,

                  productId:
                    cartItem.id,

                  isActive: true,

                  stock: {
                    gte: cartItem.quantity,
                  },
                },

                data: {
                  stock: {
                    decrement:
                      cartItem.quantity,
                  },
                },
              },
            );

          if (result.count !== 1) {
            throw new Error(
              `STOCK_CHANGED:${cartItem.id}`,
            );
          }
        }

        return createdOrder;
      },
    );

    // --------------------------------------------------
    // Return successful order
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        order: {
          id: order.id,

          orderNumber:
            order.orderNumber,

          status: order.status,

          paymentStatus:
            order.paymentStatus,

          subtotal:
            Number(order.subtotal),

          deliveryFee:
            Number(order.deliveryFee),

          total:
            Number(order.total),

          customerName:
            order.customerName,

          customerPhone:
            order.customerPhone,

          branch: {
            id: order.branch.id,

            name: order.branch.name,

            code: order.branch.code,
          },

          items: order.items.map(
            (item) => ({
              id: item.id,

              productId:
                item.productId,

              name:
                item.product.name,

              quantity:
                item.quantity,

              unitPrice:
                Number(item.unitPrice),

              total:
                Number(item.total),
            }),
          ),

          createdAt:
            order.createdAt,
        },
      },

      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to create order:",
      error,
    );

    // --------------------------------------------------
    // Handle known stock errors
    // --------------------------------------------------

    if (
      error instanceof Error
    ) {
      if (
        error.message.startsWith(
          "PRODUCT_UNAVAILABLE:",
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One of the products in your cart is no longer available. Please refresh the page and try again.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        error.message.startsWith(
          "INSUFFICIENT_STOCK:",
        )
      ) {
        const parts =
          error.message.split(":");

        const stock =
          parts[2];

        return NextResponse.json(
          {
            error:
              `The requested quantity is no longer available. Only ${stock} item${stock === "1" ? "" : "s"} remain in stock.`,
          },
          {
            status: 409,
          },
        );
      }

      if (
        error.message.startsWith(
          "STOCK_CHANGED:",
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Stock changed while placing your order. Please refresh your cart and try again.",
          },
          {
            status: 409,
          },
        );
      }
    }

    // --------------------------------------------------
    // Generic server error
    // --------------------------------------------------

    return NextResponse.json(
      {
        error:
          "Something went wrong while placing your order.",
      },
      {
        status: 500,
      },
    );
  }
}