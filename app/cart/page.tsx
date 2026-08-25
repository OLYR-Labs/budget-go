"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart-store";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore(
    (state) => state.updateQuantity,
  );

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <main className="min-h-screen bg-[#08080a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08080a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

            Continue shopping
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-black text-black">
              B
            </div>

            <span className="hidden text-sm font-bold sm:inline">
              Budget Go
            </span>
          </div>
        </div>
      </header>

      {/* Background */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="pointer-events-none absolute -right-40 top-40 h-[35rem] w-[35rem] rounded-full bg-violet-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          {/* Page heading */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-300">
              Budget Go
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Review your order and make sure everything looks right.
            </p>
          </div>

          {items.length === 0 ? (
            /* Empty cart */
            <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                <ShoppingBag className="h-7 w-7" />
              </div>

              <h2 className="mt-6 text-xl font-bold text-white">
                Your cart is empty
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Add some products before continuing to checkout.
              </p>

              <Link
                href="/#products"
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-black shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
              {/* Order details */}
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                {/* Order heading */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                      Your basket
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-white">
                      Your order
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      {totalItems}{" "}
                      {totalItems === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>

                <Separator className="my-6 bg-white/10" />

                {/* Products */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.05]"
                    >
                      <div className="flex gap-4">
                        {/* Product image */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.05] sm:h-24 sm:w-24">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/20">
                              <ShoppingBag className="h-7 w-7" />
                            </div>
                          )}
                        </div>

                        {/* Product information */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-xs text-white/40">
                                Rs.{" "}
                                {item.price.toLocaleString()} each
                              </p>
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 rounded-xl p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Quantity + total */}
                          <div className="mt-4 flex items-center justify-between gap-3">
                            {/* Quantity controls */}
                            <div className="flex items-center rounded-xl border border-white/10 bg-black/20">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-l-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>

                              <span className="flex h-9 min-w-9 items-center justify-center border-x border-white/10 px-2 text-sm font-bold text-white">
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
                                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Item total */}
                            <p className="text-sm font-black tracking-tight text-white">
                              Rs.{" "}
                              {(
                                item.price * item.quantity
                              ).toLocaleString()}
                            </p>
                          </div>

                          {/* Stock information */}
                          <p className="mt-3 text-[11px] text-white/30">
                            {item.stock - item.quantity > 0
                              ? `${item.stock - item.quantity} more available`
                              : "Maximum available quantity selected"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Order summary */}
              <aside className="h-fit lg:sticky lg:top-24">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                    Summary
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-white">
                    Order summary
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">
                        Items
                      </span>

                      <span className="font-semibold text-white">
                        {totalItems}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">
                        Subtotal
                      </span>

                      <span className="font-semibold text-white">
                        Rs. {subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">
                        Delivery
                      </span>

                      <span className="font-semibold text-green-400">
                        Free
                      </span>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex items-end justify-between">
                      <span className="font-bold text-white">
                        Total
                      </span>

                      <span className="text-2xl font-black text-white">
                        Rs. {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Delivery location */}
                  <div className="mt-7 rounded-2xl border border-purple-400/10 bg-purple-500/[0.06] p-4">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                        <MapPin className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white">
                          Delivery location
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                          Ingiriya branch
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-white/30">
                          We'll collect your delivery address
                          before the order is placed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Continue button */}
                  <Button
                    disabled
                    className="mt-6 h-12 w-full rounded-2xl bg-white font-bold text-black opacity-60"
                  >
                    Continue
                  </Button>

                  <p className="mt-3 text-center text-[11px] leading-5 text-white/30">
                    Delivery details and payment will be added
                    next.
                  </p>

                  {/* Continue shopping */}
                  <Link
                    href="/#products"
                    className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-white/40 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />

                    Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Budget Go. All rights reserved.
          </p>

          <p className="text-[11px] text-white/20">
            Shop local. Live better.
          </p>
        </div>
      </footer>
    </main>
  );
}