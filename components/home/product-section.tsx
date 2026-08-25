"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useCartStore } from "@/lib/cart-store";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  category?: { name: string } | null;
};

type ProductSectionProps = {
  products: Product[];
  loading?: boolean;
};

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-none">
      <div className="skeleton aspect-[4/3]" />
      <CardContent className="p-3">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton mt-2.5 h-4 w-3/4 rounded-lg" />
        <div className="skeleton mt-1.5 h-3 w-1/2 rounded-lg" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="skeleton h-5 w-16 rounded-lg" />
          <div className="skeleton h-7 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const price = Number(product.price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  function handleAddToCart() {
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      name: product.name,
      price,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <Card
      className={`product-card interactive-card animate-product-enter group overflow-hidden rounded-2xl border-border/70 bg-card text-card-foreground shadow-none transition-all duration-300 ${
        isOutOfStock ? "opacity-90" : "hover:-translate-y-1 hover:shadow-lg"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`product-image h-full w-full object-cover transition-transform duration-300 ${
              isOutOfStock ? "grayscale-[30%] opacity-80" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="product-image flex h-full w-full items-center justify-center">
            <PackageSearch className="h-9 w-9 text-muted-foreground/20 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}

        <Badge
          variant="secondary"
          className={`absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold shadow-sm backdrop-blur ${
            isOutOfStock
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-border/60 bg-background/90 text-foreground"
          }`}
        >
          {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
        </Badge>

        {product.category?.name && (
          <Badge className="absolute right-2.5 top-2.5 max-w-[45%] truncate rounded-full bg-accent px-2 py-0.5 text-[9px] text-accent-foreground shadow-md shadow-accent/20">
            {product.category.name}
          </Badge>
        )}

        {isLowStock && (
          <Badge className="absolute bottom-2.5 left-2.5 rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground shadow-md">
            Only {product.stock} left
          </Badge>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/10">
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
              Currently unavailable
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {product.category?.name && (
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-accent">
            {product.category.name}
          </p>
        )}

        <h3 className="mt-1 min-h-[2.25rem] line-clamp-2 text-xs font-bold leading-4 tracking-tight text-foreground">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-[10px] leading-3.5 text-muted-foreground">
            {product.description}
          </p>
        )}

        <p className={`mt-1 text-[10px] ${isOutOfStock ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
          {isOutOfStock ? "Currently unavailable" : `${product.stock} available`}
        </p>

        <div className="mt-3 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <p className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">Price</p>
            <p className="mt-0.5 truncate text-base font-black tracking-tight text-foreground">
              Rs. {price.toLocaleString()}
            </p>
          </div>

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`h-8 shrink-0 rounded-lg px-2.5 text-[10px] transition-all duration-200 ${added ? "bg-green-600 text-white hover:bg-green-600" : ""}`}
          >
            {added ? (
              <><Check className="mr-1 h-3 w-3" />Added</>
            ) : isOutOfStock ? (
              <><ShoppingCart className="mr-1 h-3 w-3" />Unavailable</>
            ) : (
              <><ShoppingCart className="mr-1 h-3 w-3" />Add</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductSection({ products, loading = false }: ProductSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="rounded-full border border-accent/10 bg-accent/10 px-2.5 py-0.5 text-[10px] text-accent">
            Available nearby
          </Badge>
          <h2 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
            Shop from your local branch
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
            Products and prices shown are from the branch you selected.
          </p>
        </div>

        <Button variant="ghost" className="group w-fit rounded-xl px-2.5 text-xs font-semibold">
          View all
          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </div>

      <Separator className="my-5" />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => <ProductSkeleton key={index} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <PackageSearch className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-bold text-foreground">No products available</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
            There are currently no in-stock products at this branch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
