import { NextResponse } from "next/server";

import { getBranchDashboardContext } from "@/lib/branch-dashboard-auth";
import { prisma } from "@/lib/prisma";

function makeSku(name: string, barcode: string) {
  const prefix = name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 24) || "PRODUCT";
  return `${prefix}-${barcode}`;
}

export async function POST(request: Request) {
  try {
    const context = await getBranchDashboardContext();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const barcode = typeof body.barcode === "string" ? body.barcode.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!name) return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    if (!barcode) return NextResponse.json({ error: "Barcode is required." }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
    if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Quantity must be a valid non-negative whole number." }, { status: 400 });

    const existingBarcode = await prisma.product.findUnique({ where: { barcode }, select: { id: true, name: true } });
    if (existingBarcode) {
      return NextResponse.json({ error: `A product with barcode ${barcode} already exists (${existingBarcode.name}). Use the existing product instead.` }, { status: 409 });
    }

    const category = await prisma.category.upsert({
      where: { name: "Branch Products" },
      update: {},
      create: { name: "Branch Products" },
      select: { id: true },
    });

    const skuBase = makeSku(name, barcode);
    let sku = skuBase;
    let suffix = 2;
    while (await prisma.product.findUnique({ where: { sku }, select: { id: true } })) {
      sku = `${skuBase}-${suffix++}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          barcode,
          sku,
          categoryId: category.id,
          isActive: true,
        },
        select: { id: true, name: true, sku: true, barcode: true },
      });

      const inventory = await tx.branchInventory.create({
        data: {
          branchId: context.branch.id,
          productId: product.id,
          price,
          stock,
          isActive: true,
        },
        select: { id: true, price: true, stock: true, isActive: true },
      });

      return { product, inventory };
    });

    return NextResponse.json({
      success: true,
      product: result.product,
      inventory: { ...result.inventory, price: Number(result.inventory.price) },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create branch product:", error);
    return NextResponse.json({ error: "Failed to create the new product." }, { status: 500 });
  }
}
