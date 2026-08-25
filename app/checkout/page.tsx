"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  MapPin,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart-store";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);

  const removeItem = useCartStore(
    (state) => state.removeItem,
  );

  const updateQuantity = useCartStore(
    (state) => state.updateQuantity,
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Continue shopping
            </Link>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-2xl sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ShoppingBag className="h-7 w-7" />
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Your cart is empty
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add some products before continuing to checkout.
            </p>

            <Link
              href="/#products"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Continue shopping
          </Link>

          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-4 w-4 text-accent" />

            <span className="text-sm font-bold text-foreground">
              Checkout
            </span>
          </div>
        </div>
      </header>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-accent/5 blur-[120px]" />

        <div className="absolute -right-40 top-40 h-[32rem] w-[32rem] rounded-full bg-accent/5 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Budget Go
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Review your order before continuing.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Order details */}
          <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Your order
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {totalItems}{" "}
                  {totalItems === 1 ? "item" : "items"}
                </p>
              </div>

              <ShoppingBag className="h-5 w-5 text-accent" />
            </div>

            <Separator className="my-6" />

            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-bold">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Rs.{" "}
                            {item.price.toLocaleString()} each
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        {/* Quantity */}
                        <div className="flex items-center rounded-xl border border-border/70 bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-l-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="flex h-9 min-w-10 items-center justify-center border-x border-border/70 px-2 text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                              )
                            }
                            disabled={
                              item.quantity >= item.stock
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-20"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-sm font-black">
                          Rs.{" "}
                          {(
                            item.price * item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Summary */}
          <aside className="h-fit rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">
              Order summary
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal
                </span>

                <span className="font-semibold">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Delivery
                </span>

                <span className="text-xs font-medium text-muted-foreground">
                  Calculated next
                </span>
              </div>

              <Separator />

              <div className="flex items-end justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Delivery */}
            <div className="mt-7 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Delivery location
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    We'll collect your delivery address in
                    the next step.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue */}
            <Link
              href="/checkout/details"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl"
            >
              Continue
            </Link>

            <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
              Delivery details and payment will be added next.
            </p>

            <Link
              href="/#products"
              className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}