"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { useCartStore } from "@/lib/cart-store";

const BRANCH_ID = "cmsxmqxgh0001kgtqcbxsi7b4";

export default function CheckoutPaymentPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [paymentMethod, setPaymentMethod] =
    useState<"cod" | "online">("cod");

  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false);

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (paymentMethod !== "cod") {
      setError(
        "Online payment will be available soon. Please select Cash on Delivery.",
      );
      return;
    }

    setIsPlacingOrder(true);

    try {
      // --------------------------------------------------
      // Get delivery details
      // --------------------------------------------------

      const savedDetails = sessionStorage.getItem(
        "budget-go-delivery-details",
      );

      if (!savedDetails) {
        setError(
          "Delivery details are missing. Please go back and enter your delivery details.",
        );
        setIsPlacingOrder(false);
        return;
      }

      let deliveryDetails: {
        name: string;
        phone: string;
        address: string;
        city: string;
        notes?: string;
      };

      try {
        deliveryDetails = JSON.parse(savedDetails);
      } catch {
        setError(
          "Your delivery details could not be read. Please enter them again.",
        );
        setIsPlacingOrder(false);
        return;
      }

      // --------------------------------------------------
      // Validate delivery details
      // --------------------------------------------------

      if (!deliveryDetails?.name?.trim()) {
        setError("Full name is required.");
        setIsPlacingOrder(false);
        return;
      }

      if (!deliveryDetails?.phone?.trim()) {
        setError("Phone number is required.");
        setIsPlacingOrder(false);
        return;
      }

      if (!deliveryDetails?.address?.trim()) {
        setError("Delivery address is required.");
        setIsPlacingOrder(false);
        return;
      }

      if (!deliveryDetails?.city?.trim()) {
        setError("City or area is required.");
        setIsPlacingOrder(false);
        return;
      }

      // --------------------------------------------------
      // Prepare cart items
      //
      // IMPORTANT:
      // These IDs must be Product IDs returned by:
      //
      // /api/branches/[branchId]/products
      // --------------------------------------------------

      const orderItems = items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      // --------------------------------------------------
      // Create REAL order in the database
      // --------------------------------------------------

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchId: BRANCH_ID,

          items: orderItems,

          paymentMethod: "cod",

          deliveryDetails: {
            name: deliveryDetails.name.trim(),
            phone: deliveryDetails.phone.trim(),
            address: deliveryDetails.address.trim(),
            city: deliveryDetails.city.trim(),
            notes:
              deliveryDetails.notes?.trim() || "",
          },
        }),
      });

      let data: {
        success?: boolean;
        order?: unknown;
        error?: string;
      };

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // --------------------------------------------------
      // Handle API errors
      // --------------------------------------------------

      if (!response.ok) {
        setError(
          data?.error ||
            "Something went wrong while placing your order.",
        );

        setIsPlacingOrder(false);
        return;
      }

      // --------------------------------------------------
      // Make sure the API returned a real order
      // --------------------------------------------------

      if (!data?.success || !data?.order) {
        setError(
          "The order was not created successfully. Please try again.",
        );

        setIsPlacingOrder(false);
        return;
      }

      // --------------------------------------------------
      // Save REAL database order for success page
      // --------------------------------------------------

      localStorage.setItem(
        "budget-go-last-order",
        JSON.stringify(data.order),
      );

      // --------------------------------------------------
      // Clear cart ONLY after successful order creation
      // --------------------------------------------------

      clearCart();

      // --------------------------------------------------
      // Remove temporary delivery details
      // --------------------------------------------------

      sessionStorage.removeItem(
        "budget-go-delivery-details",
      );

      // --------------------------------------------------
      // Go to success page
      // --------------------------------------------------

      router.push("/checkout/success");
    } catch (error) {
      console.error(
        "Failed to place order:",
        error,
      );

      setError(
        "Unable to connect to the order service. Please check your connection and try again.",
      );

      setIsPlacingOrder(false);
    }
  };

  // --------------------------------------------------
  // Empty cart
  // --------------------------------------------------

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
              Add some products before continuing
              to payment.
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
            href="/checkout/details"
            className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

            Back to delivery details
          </Link>

          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-4 w-4 text-accent" />

            <span className="text-sm font-bold text-foreground">
              Payment
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
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Step 3 of checkout
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Payment
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Choose how you'd like to pay for your order.
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
              <Check className="h-4 w-4" />
            </div>

            <span className="hidden text-xs font-semibold text-muted-foreground sm:block">
              Details
            </span>
          </div>

          <div className="h-px w-8 bg-accent/50 sm:w-16" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              3
            </div>

            <span className="text-xs font-semibold text-foreground">
              Payment
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Payment section */}
          <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7">
            {/* Heading */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <CreditCard className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Choose payment method
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select your preferred way to pay.
                </p>
              </div>
            </div>

            {/* Payment methods */}
            <div className="mt-7 space-y-4">
              {/* Cash on Delivery */}
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={() => {
                  setPaymentMethod("cod");
                  setError("");
                }}
                className={`w-full rounded-2xl border p-5 text-left transition-all ${
                  paymentMethod === "cod"
                    ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                    : "border-border/70 bg-background hover:border-accent/40 hover:bg-muted/30"
                } ${
                  isPlacingOrder
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      paymentMethod === "cod"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Wallet className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">
                        Cash on Delivery
                      </h3>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          paymentMethod === "cod"
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Pay in cash when your order arrives.
                    </p>
                  </div>
                </div>
              </button>

              {/* Online Payment */}
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={() => {
                  setPaymentMethod("online");
                  setError("");
                }}
                className={`w-full rounded-2xl border p-5 text-left transition-all ${
                  paymentMethod === "online"
                    ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                    : "border-border/70 bg-background hover:border-accent/40 hover:bg-muted/30"
                } ${
                  isPlacingOrder
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      paymentMethod === "online"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">
                        Online Payment
                      </h3>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          paymentMethod === "online"
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border"
                        }`}
                      >
                        {paymentMethod === "online" && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Pay securely online using a card or
                      supported payment method.
                    </p>

                    <span className="mt-3 inline-flex rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      COMING SOON
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                {error}
              </div>
            )}

            {/* Place order */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="mt-7 flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPlacingOrder ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />

                  Placing order...
                </span>
              ) : (
                "Place order"
              )}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
              By placing your order, you confirm that your
              delivery details are correct.
            </p>

            {/* Back */}
            <Link
              href="/checkout/details"
              className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />

              Back to delivery details
            </Link>
          </section>

          {/* Order summary */}
          <aside className="h-fit rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 lg:sticky lg:top-24">
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
                        className="h-full w-full object-cover"
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

            {/* Delivery info */}
            <div className="mt-7 rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Delivery details
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your delivery information has been
                    collected and will be used to prepare
                    your order.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Check className="h-3.5 w-3.5" />
              </div>

              <p className="text-[11px] font-medium text-muted-foreground">
                Secure checkout
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}