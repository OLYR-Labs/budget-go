"use client";

import { Plus, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    stock: number;
    imageUrl?: string | null;
    category?: {
      name: string;
    } | null;
  };
  onAdd?: (product: ProductCardProps["product"]) => void;
};

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {
  const price = Number(product.price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className="product-card group relative overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Product image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`product-image h-full w-full object-cover transition-transform duration-300 ${
              isOutOfStock
                ? "grayscale-[30%] opacity-80"
                : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/20 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant="secondary"
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur ${
              isOutOfStock
                ? "border-destructive/20 bg-destructive/10 text-destructive"
                : "border-border/60 bg-background/90 text-foreground"
            }`}
          >
            {isOutOfStock
              ? "Out of stock"
              : `${product.stock} in stock`}
          </Badge>
        </div>

        {/* Category */}
        {product.category?.name && (
          <div className="absolute right-3 top-3">
            <Badge className="rounded-full bg-accent px-2.5 py-1 text-[10px] text-accent-foreground shadow-md shadow-accent/20">
              {product.category.name}
            </Badge>
          </div>
        )}

        {/* Low stock */}
        {isLowStock && (
          <div className="absolute bottom-3 left-3">
            <Badge className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground shadow-md">
              Only {product.stock} left
            </Badge>
          </div>
        )}
      </div>

      {/* Product information */}
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-5 text-foreground">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Price + action */}
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Price
            </p>

            <p className="mt-0.5 text-lg font-black tracking-tight text-foreground">
              Rs. {price.toLocaleString()}
            </p>
          </div>

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={() => onAdd?.(product)}
            className="h-9 rounded-lg px-3 text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />

            {isOutOfStock ? "Unavailable" : "Add"}
          </Button>
        </div>
      </div>
    </Card>
  );
}