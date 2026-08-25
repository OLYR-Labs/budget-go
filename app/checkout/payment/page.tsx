"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, MapPin, ShoppingBag, Wallet } from "lucide-react";

import { useCartStore } from "@/lib/cart-store";

type DeliveryDetails = {
  branchId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  deliveryFee: number;
};

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("budget-go-delivery-details");
      if (!saved) {
        setError("Delivery details are missing. Please return and select your location.");
        return;
      }

      const parsed = JSON.parse(saved) as DeliveryDetails;
      if (
        !parsed.branchId ||
        !parsed.name ||
        !parsed.phone ||
        !parsed.address ||
        !parsed.city ||
        !Number.isFinite(parsed.latitude) ||
        !Number.isFinite(parsed.longitude)
      ) {
        throw new Error("Incomplete delivery details.");
      }

      setDetails(parsed);
    } catch {
      setError("Your delivery details could not be read. Please return and select your location again.");
    }
  }, []);

  const handlePlaceOrder = async () => {
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!details) {
      setError("Delivery details are missing. Please return and select your location.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: details.branchId,
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          paymentMethod: "cod",
          deliveryDetails: {
            name: details.name,
            phone: details.phone,
            address: details.address,
            city: details.city,
            notes: details.notes ?? "",
            latitude: details.latitude,
            longitude: details.longitude,
          },
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        order?: unknown;
        error?: string;
      };

      if (!response.ok || !data.success || !data.order) {
        setError(data.error || "Something went wrong while placing your order.");
        setIsPlacingOrder(false);
        return;
      }

      localStorage.setItem("budget-go-last-order", JSON.stringify(data.order));
      clearCart();
      sessionStorage.removeItem("budget-go-delivery-details");
      router.push("/checkout/success");
    } catch (placeError) {
      console.error("Failed to place order:", placeError);
      setError("Unable to connect to the order service. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-10 text-center shadow-2xl">
            <ShoppingBag className="mx-auto h-10 w-10 text-accent" />
            <h1 className="mt-5 text-2xl font-black">Your cart is empty</h1>
            <Link href="/#products" className="mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground">Start shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/checkout/details" className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to delivery details
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4 text-accent" /> Payment</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Step 3 of checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cash on Delivery is currently available.</p>
        </div>

        <div className="mb-8 flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-4 w-4" /></span>Cart</span>
          <span className="h-px w-10 bg-accent/50" />
          <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-4 w-4" /></span>Details</span>
          <span className="h-px w-10 bg-accent/50" />
          <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">3</span>Payment</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7">
            <div className="rounded-2xl border border-accent bg-accent/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Wallet className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-base font-black">Cash on Delivery</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Pay the delivery staff in cash when your order arrives.</p>
                </div>
                <Check className="ml-auto h-5 w-5 shrink-0 text-accent" />
              </div>
            </div>

            {details && (
              <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="text-sm font-black">Delivery location</p>
                    <p className="mt-1 text-xs text-muted-foreground">{details.address}</p>
                    <p className="text-xs text-muted-foreground">{details.city}</p>
                    <p className="mt-2 text-xs font-bold text-accent">{details.distanceKm.toFixed(2)} km · Rs. {details.deliveryFee.toLocaleString()} delivery</p>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            <button type="button" onClick={handlePlaceOrder} disabled={isPlacingOrder || !details} className="mt-7 flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
              {isPlacingOrder ? "Placing order..." : "Place Cash on Delivery order"}
            </button>
          </section>

          <aside className="h-fit rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Order summary</h2>
            <p className="mt-1 text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-5 w-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.quantity} × Rs. {item.price.toLocaleString()}</p></div>
                  <p className="shrink-0 text-xs font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="my-6 h-px bg-border" />
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">Rs. {details?.deliveryFee.toLocaleString() ?? "—"}</span></div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black">Rs. {(subtotal + (details?.deliveryFee ?? 0)).toLocaleString()}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
