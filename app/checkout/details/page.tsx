"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Phone, ShoppingBag, User } from "lucide-react";

import LocationPicker from "@/components/checkout/location-picker";
import { useCartStore } from "@/lib/cart-store";

type Branch = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
};

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
};

type Quote = {
  deliverable: boolean;
  distanceKm: number;
  radiusKm: number;
  deliveryFee: number;
  branch: string;
};

const SELECTED_BRANCH_KEY = "budget-go-selected-branch";
const DELIVERY_DETAILS_KEY = "budget-go-delivery-details";

export default function CheckoutDetailsPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    async function loadBranch() {
      try {
        const branchId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
        if (!branchId) throw new Error("Please select a shopping branch first.");

        const response = await fetch("/api/branches", { cache: "no-store" });
        const branches = (await response.json()) as Branch[] | { error?: string };

        if (!response.ok || !Array.isArray(branches)) {
          throw new Error((branches as { error?: string }).error || "Unable to load the selected branch.");
        }

        const selected = branches.find((item) => item.id === branchId);
        if (!selected) throw new Error("The selected branch is no longer available. Please return to the shop.");

        setBranch(selected);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load branch information.");
      } finally {
        setLocationLoading(false);
      }
    }

    void loadBranch();
  }, []);

  const handleLocationChange = useCallback((nextLocation: SelectedLocation) => {
    setLocation(nextLocation);
    if (nextLocation.address) setAddress(nextLocation.address);
    if (nextLocation.city) setCity(nextLocation.city);
    setQuote(null);
    setError("");
  }, []);

  useEffect(() => {
    if (!branch || !location) return;

    const selectedBranch = branch;
    const selectedLocation = location;
    const controller = new AbortController();

    async function calculateQuote() {
      setQuoteLoading(true);
      setError("");

      try {
        const response = await fetch("/api/delivery/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedBranch.id,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as Quote & { error?: string };

        if (!response.ok) {
          setQuote(null);
          setError(data.error || "This location is outside our delivery area.");
          return;
        }

        setQuote(data);
      } catch (quoteError) {
        if (quoteError instanceof DOMException && quoteError.name === "AbortError") return;
        setQuote(null);
        setError("Unable to calculate delivery for this location. Please try again.");
      } finally {
        setQuoteLoading(false);
      }
    }

    void calculateQuote();
    return () => controller.abort();
  }, [branch, location]);

  const handleContinue = () => {
    setError("");

    if (!branch) return setError("Please select a delivery branch.");
    if (!name.trim()) return setError("Please enter your full name.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    if (!address.trim() || !city.trim()) return setError("Please provide your delivery address and city/area.");
    if (!location) return setError("Please select your exact delivery location on the map.");
    if (!quote?.deliverable) return setError("This location is outside the selected branch's delivery area.");

    setIsContinuing(true);

    sessionStorage.setItem(
      DELIVERY_DETAILS_KEY,
      JSON.stringify({
        branchId: branch.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        notes: notes.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        distanceKm: quote.distanceKm,
        deliveryFee: quote.deliveryFee,
      }),
    );

    router.push("/checkout/payment");
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/70 bg-background/90">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Continue shopping
            </Link>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-2xl sm:p-12">
            <ShoppingBag className="mx-auto h-10 w-10 text-accent" />
            <h1 className="mt-6 text-2xl font-black">Your cart is empty</h1>
            <p className="mt-2 text-sm text-muted-foreground">Add some products before entering your delivery details.</p>
            <Link href="/#products" className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground">Start shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/checkout" className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to checkout
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4 text-accent" /> Delivery details</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Step 2 of checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Where should we deliver?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {branch ? `Delivering from ${branch.name}. Select your exact location so we can confirm the ${branch.deliveryRadiusKm} km delivery radius and calculate the fee.` : "Loading your selected branch..."}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-4 w-4" /></span>Cart</span>
          <span className="h-px w-10 bg-accent/50" />
          <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">2</span>Details</span>
          <span className="h-px w-10 bg-border" />
          <span className="flex items-center gap-2 text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted">3</span>Payment</span>
        </div>

        {locationLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading branch information...</div>
        ) : branch ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Full name *
                  <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 outline-none focus:border-accent" /></div>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Phone number *
                  <div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07X XXX XXXX" className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 outline-none focus:border-accent" /></div>
                </label>
              </div>

              <div className="mt-6">
                <LocationPicker branch={branch} value={location} onChange={handleLocationChange} />
              </div>

              <div className="mt-6 grid gap-5">
                <label className="grid gap-2 text-sm font-semibold">
                  Delivery address *
                  <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} placeholder="The map will fill this automatically; you can edit it." className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  City / area *
                  <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or area" className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-accent" />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Delivery notes <span className="font-normal text-muted-foreground">(optional)</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Gate, landmark, special instructions..." className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" />
                </label>
              </div>

              {quote && (
                <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-accent">Delivery available</p>
                      <p className="mt-1 text-xs text-muted-foreground">{quote.distanceKm.toFixed(2)} km from {quote.branch} · within {quote.radiusKm} km</p>
                    </div>
                    <p className="text-lg font-black">Rs. {quote.deliveryFee.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {quoteLoading && <p className="mt-4 text-xs font-semibold text-muted-foreground">Calculating delivery distance and fee...</p>}
              {error && <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

              <button type="button" onClick={handleContinue} disabled={isContinuing || quoteLoading} className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                {isContinuing ? "Continuing..." : quote?.deliverable ? "Continue to payment" : "Select a delivery location"}
              </button>
            </section>

            <aside className="h-fit rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl sm:p-7 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold">Order summary</h2>
              <p className="mt-1 text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground/40"><ShoppingBag className="h-5 w-5" /></div>}
                    </div>
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.quantity} × Rs. {item.price.toLocaleString()}</p></div>
                    <p className="shrink-0 text-xs font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="my-6 h-px bg-border" />
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">{quote ? `Rs. ${quote.deliveryFee.toLocaleString()}` : "Calculated after map selection"}</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base"><span className="font-bold">Estimated total</span><span className="font-black">Rs. {(subtotal + (quote?.deliveryFee ?? 0)).toLocaleString()}</span></div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">{error || "No branch selected."}</div>
        )}
      </div>
    </main>
  );
}
