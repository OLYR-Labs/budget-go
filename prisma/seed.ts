import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
  
  async function main() {
    console.log("🌱 Seeding Budget Go...");
  
    // --------------------------------------------------
    // BRANCHES
    // --------------------------------------------------
  
    const branches = [
      {
        name: "Horana",
        code: "HOR",
        latitude: 6.7156,
        longitude: 80.0626,
      },
      {
        name: "Ingiriya",
        code: "ING",
        latitude: 6.7428,
        longitude: 80.177,
      },
      {
        name: "Bandaragama",
        code: "BAN",
        latitude: 6.7151,
        longitude: 80.985,
      },
      {
        name: "Kesbewa",
        code: "KES",
        latitude: 6.7953,
        longitude: 79.9383,
      },
      {
        name: "Piliyandala",
        code: "PIL",
        latitude: 6.8015,
        longitude: 79.9227,
      },
      {
        name: "Panadura",
        code: "PAN",
        latitude: 6.7132,
        longitude: 79.9042,
      },
      {
        name: "Kalutara",
        code: "KAL",
        latitude: 6.5854,
        longitude: 79.9607,
      },
    ];
  
    for (const branch of branches) {
      await prisma.branch.upsert({
        where: { code: branch.code },
        update: {},
        create: {
          ...branch,
          deliveryRadius: 20,
        },
      });
    }
  
    // --------------------------------------------------
    // CATEGORIES
    // --------------------------------------------------
  
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
  
    // --------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------
  
    const cocaCola = await prisma.product.upsert({
      where: { sku: "DEMO-COKE-1500" },
      update: {},
      create: {
        name: "Coca-Cola 1.5L",
        description: "Coca-Cola soft drink 1.5L bottle.",
        sku: "DEMO-COKE-1500",
        categoryId: beverages.id,
      },
    });
  
    const milk = await prisma.product.upsert({
      where: { sku: "DEMO-MILK-1000" },
      update: {},
      create: {
        name: "Full Cream Milk 1L",
        description: "Fresh full cream milk.",
        sku: "DEMO-MILK-1000",
        categoryId: groceries.id,
      },
    });
  
    const rice = await prisma.product.upsert({
      where: { sku: "DEMO-RICE-5000" },
      update: {},
      create: {
        name: "White Rice 5kg",
        description: "Premium white rice.",
        sku: "DEMO-RICE-5000",
        categoryId: groceries.id,
      },
    });
  
    const biscuits = await prisma.product.upsert({
      where: { sku: "DEMO-BISC-200" },
      update: {},
      create: {
        name: "Chocolate Cream Biscuits",
        description: "Chocolate cream biscuits.",
        sku: "DEMO-BISC-200",
        categoryId: snacks.id,
      },
    });
  
    // --------------------------------------------------
    // BRANCH INVENTORY
    // --------------------------------------------------
  
    const horana = await prisma.branch.findUniqueOrThrow({
      where: { code: "HOR" },
    });
  
    const ingiriya = await prisma.branch.findUniqueOrThrow({
      where: { code: "ING" },
    });
  
    const bandaragama = await prisma.branch.findUniqueOrThrow({
      where: { code: "BAN" },
    });
  
    // Horana stock
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: horana.id,
          productId: cocaCola.id,
        },
      },
      update: { stock: 25, price: 420 },
      create: {
        branchId: horana.id,
        productId: cocaCola.id,
        stock: 25,
        price: 420,
      },
    });
  
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: horana.id,
          productId: milk.id,
        },
      },
      update: { stock: 18, price: 520 },
      create: {
        branchId: horana.id,
        productId: milk.id,
        stock: 18,
        price: 520,
      },
    });
  
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: horana.id,
          productId: rice.id,
        },
      },
      update: { stock: 12, price: 1450 },
      create: {
        branchId: horana.id,
        productId: rice.id,
        stock: 12,
        price: 1450,
      },
    });
  
    // Ingiriya stock
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: ingiriya.id,
          productId: cocaCola.id,
        },
      },
      update: { stock: 8, price: 425 },
      create: {
        branchId: ingiriya.id,
        productId: cocaCola.id,
        stock: 8,
        price: 425,
      },
    });
  
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: ingiriya.id,
          productId: milk.id,
        },
      },
      update: { stock: 0, price: 525 },
      create: {
        branchId: ingiriya.id,
        productId: milk.id,
        stock: 0,
        price: 525,
      },
    });
  
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: ingiriya.id,
          productId: biscuits.id,
        },
      },
      update: { stock: 20, price: 280 },
      create: {
        branchId: ingiriya.id,
        productId: biscuits.id,
        stock: 20,
        price: 280,
      },
    });
  
    // Bandaragama stock
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: bandaragama.id,
          productId: rice.id,
        },
      },
      update: { stock: 30, price: 1425 },
      create: {
        branchId: bandaragama.id,
        productId: rice.id,
        stock: 30,
        price: 1425,
      },
    });
  
    await prisma.branchInventory.upsert({
      where: {
        branchId_productId: {
          branchId: bandaragama.id,
          productId: biscuits.id,
        },
      },
      update: { stock: 15, price: 275 },
      create: {
        branchId: bandaragama.id,
        productId: biscuits.id,
        stock: 15,
        price: 275,
      },
    });
  
    console.log("✅ Branches, categories, products and inventory seeded.");
  }
  
  main()
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });