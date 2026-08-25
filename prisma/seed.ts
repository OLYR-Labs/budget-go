import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Budget Go...");

  const branches = [
    { name: "Horana", code: "HOR", latitude: 6.7156, longitude: 80.0626 },
    { name: "Ingiriya", code: "ING", latitude: 6.7428, longitude: 80.1770 },
    { name: "Bandaragama", code: "BAN", latitude: 6.7151, longitude: 80.9850 },
    { name: "Kesbewa", code: "KES", latitude: 6.7953, longitude: 79.9383 },
    { name: "Piliyandala", code: "PIL", latitude: 6.8015, longitude: 79.9227 },
    { name: "Panadura", code: "PAN", latitude: 6.7132, longitude: 79.9042 },
    { name: "Kalutara", code: "KAL", latitude: 6.5854, longitude: 79.9607 },
  ];

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { code: branch.code },
      update: {
        name: branch.name,
        latitude: branch.latitude,
        longitude: branch.longitude,
        deliveryRadius: 20,
        isActive: true,
      },
      create: { ...branch, deliveryRadius: 20 },
    });
  }

  const beverages = await prisma.category.upsert({
    where: { name: "Beverages" },
    update: {},
    create: { name: "Beverages" },
  });
  const groceries = await prisma.category.upsert({
    where: { name: "Groceries" },
    update: {},
    create: { name: "Groceries" },
  });
  const snacks = await prisma.category.upsert({
    where: { name: "Snacks" },
    update: {},
    create: { name: "Snacks" },
  });

  const products = [
    {
      sku: "DEMO-COKE-1500",
      name: "Coca-Cola 1.5L",
      description: "Coca-Cola soft drink 1.5L bottle.",
      categoryId: beverages.id,
      price: 420,
      stock: 25,
    },
    {
      sku: "DEMO-MILK-1000",
      name: "Full Cream Milk 1L",
      description: "Fresh full cream milk.",
      categoryId: groceries.id,
      price: 520,
      stock: 20,
    },
    {
      sku: "DEMO-RICE-5000",
      name: "White Rice 5kg",
      description: "Premium white rice.",
      categoryId: groceries.id,
      price: 1450,
      stock: 20,
    },
    {
      sku: "DEMO-BISC-200",
      name: "Chocolate Cream Biscuits",
      description: "Chocolate cream biscuits.",
      categoryId: snacks.id,
      price: 280,
      stock: 20,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        isActive: true,
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
      },
    });
    createdProducts.push({ ...created, price: product.price, stock: product.stock });
  }

  const activeBranches = await prisma.branch.findMany({
    where: { isActive: true },
  });

  for (const branch of activeBranches) {
    for (const product of createdProducts) {
      await prisma.branchInventory.upsert({
        where: {
          branchId_productId: {
            branchId: branch.id,
            productId: product.id,
          },
        },
        update: {
          price: product.price,
          isActive: true,
        },
        create: {
          branchId: branch.id,
          productId: product.id,
          price: product.price,
          stock: product.stock,
          isActive: true,
        },
      });
    }
  }

  console.log("✅ Seven branches and branch-specific inventory seeded.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
