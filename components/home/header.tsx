"use client";

import Link from "next/link";
import { useState } from "react";

import {
  LogIn,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/cart-store";
import CartDrawer from "@/components/home/cart-drawer";
import ThemeToggle from "@/components/home/theme-toggle";

type HeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedBranch: string;
  onChangeLocation: () => void;
};

export default function Header({
  searchQuery,
  onSearchChange,
  selectedBranch,
  onChangeLocation,
}: HeaderProps) {
  const [cartOpen, setCartOpen] = useState(false);

  const itemCount = useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
              B
            </div>

            <div className="hidden sm:block">
              <p className="text-[15px] font-bold leading-none tracking-tight">
                Budget Go
              </p>

              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                Shop local. Delivered fast.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mx-auto hidden max-w-xl flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchQuery}
                onChange={(event) =>
                  onSearchChange(event.target.value)
                }
                placeholder="Search products..."
                className="h-11 rounded-2xl border-border/80 bg-muted/40 pl-10 pr-4 shadow-none transition-all placeholder:text-muted-foreground/70 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Location */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onChangeLocation}
              className="hidden rounded-xl px-3 lg:flex"
            >
              <MapPin className="mr-2 h-4 w-4 text-accent" />

              <span className="max-w-28 truncate text-xs font-medium">
                {selectedBranch}
              </span>
            </Button>

            {/* Theme */}
            <ThemeToggle />

            {/* Staff login */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden rounded-xl border-border/80 bg-background px-3 shadow-sm hover:border-accent/40 hover:bg-accent/5 sm:inline-flex"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                <span>Staff Login</span>
              </Link>
            </Button>

            {/* Cart */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl border-border/80 bg-background px-3 shadow-sm hover:border-accent/40 hover:bg-accent/5"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />

              <span className="hidden sm:inline">
                Cart
              </span>

              {itemCount > 0 ? (
                <span
                  key={itemCount}
                  className="animate-cart-pop ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                  0
                </span>
              )}
            </Button>

            {/* Mobile staff login */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-xl sm:hidden"
              aria-label="Staff login"
            >
              <Link href="/login">
                <LogIn className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile menu */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="border-t border-border/50 px-4 py-3 md:hidden">
          <div className="relative mx-auto max-w-7xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search products..."
              className="h-10 rounded-xl border-border/80 bg-muted/40 pl-10 shadow-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10"
            />
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}
