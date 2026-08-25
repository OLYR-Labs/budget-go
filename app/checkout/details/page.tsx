"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";

import { useCartStore } from "@/lib/cart-store";

export default function CheckoutDetailsPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handleContinue = () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter your city or area.");
      return;
    }

    setIsContinuing(true);

    const deliveryDetails = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim(),
    };

    sessionStorage.setItem(
      "budget-go-delivery-details",
      JSON.stringify(deliveryDetails),
    );

    router.push("/checkout/payment");
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        {/* Header */}
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

        {/* Empty cart */}
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-2xl sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ShoppingBag className="h-7 w-7" />
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Your cart is empty
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add some products before entering your
              delivery details.
            </p>

            <Link
              href="/#products"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Start shopping
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
            href="/checkout"
            className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

            Back to checkout
          </Link>

          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-4 w-4 text-accent" />

            <span className="text-sm font-bold text-foreground">
              Delivery details
            </span>
          </div>
        </div>
      </header>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-accent/5 blur-[120px]" />

        <div className="absolute -right-40 top-40 h-[32rem] w-[32rem] rounded-full bg-accent/5 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Heading */}
        <div className="mb-10 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Step 2 of checkout
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Delivery details
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Tell us where you'd like your order delivered.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              <Check className="h-4 w-4" />
            </div>

            <span className="hidden text-xs font-semibold text-muted-foreground sm:block">
              Cart
            </span>
          </div>

          <div className="h-px w-8 bg-accent/50 sm:w-16" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              2
            </div>

            <span className="text-xs font-semibold text-foreground">
              Details
            </span>
          </div>

          <div className="h-px w-8 bg-border sm:w-16" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
              3
            </div>

            <span className="hidden text-xs font-semibold text-muted-foreground sm:block">
              Payment
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Form */}
          <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 animate-product-enter">
            {/* Form heading */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Where should we deliver?
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  All fields marked with * are required.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full name *
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone number *
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="07X XXX XXXX"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-semibold"
                >
                  Delivery address *
                </label>

                <textarea
                  id="address"
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="House number, street, landmark..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-semibold"
                >
                  City / area *
                </label>

                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder="e.g. Ingiriya"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-semibold"
                >
                  Delivery notes{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Anything the delivery person should know?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-up">
                  {error}
                </div>
              )}

              {/* Continue */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isContinuing}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isContinuing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    Continuing...
                  </span>
                ) : (
                  "Continue to payment"
                )}
              </button>

              <p className="text-center text-[11px] leading-5 text-muted-foreground">
                Your information is only used to deliver
                your order.
              </p>
            </div>
          </section>

          {/* Order summary */}
          <aside className="h-fit rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 lg:sticky lg:top-24 animate-fade-up">
            <h2 className="text-lg font-bold">
              Order summary
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {totalItems}{" "}
              {totalItems === 1 ? "item" : "items"}
            </p>

            {/* Items */}
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold">
                      {item.name}
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.quantity} × Rs.{" "}
                      {item.price.toLocaleString()}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-bold">
                    Rs.{" "}
                    {(
                      item.price * item.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-border" />

            {/* Totals */}
            <div className="space-y-4">
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

                <span className="font-semibold text-accent">
                  Free
                </span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-end justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Branch */}
            <div className="mt-7 rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Ingiriya branch
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your order will be prepared by your
                    selected local branch.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}