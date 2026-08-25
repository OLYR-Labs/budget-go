"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, MapPin, ShoppingBag } from "lucide-react";

type Order = {
  id: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  deliveryDistanceKm?: number;
  totalItems: number;
  paymentMethod: string;
  createdAt: string;
  deliveryDetails?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
  };
};

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("budget-go-last-order");
    if (!savedOrder) return;

    try {
      setOrder(JSON.parse(savedOrder));
    } catch (error) {
      console.error("Failed to read saved order:", error);
    }
  }, []);

  const deliveryFee = order
    ? typeof order.deliveryFee === "number" && Number.isFinite(order.deliveryFee)
      ? order.deliveryFee
      : typeof order.subtotal === "number" && Number.isFinite(order.subtotal)
        ? Math.max(0, order.total - order.subtotal)
        : 0
    : 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingBag className="h-4 w-4 text-accent" />
            Budget Go
          </Link>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-10 h-[25rem] w-[25rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full text-center">
            <div className="mx-auto flex h-20 w-20 animate-fade-up items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl shadow-accent/20">
              <Check className="h-9 w-9" />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-accent">Order confirmed</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Thank you for your order!</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Your order has been successfully placed. We'll prepare it and get it ready for delivery.
            </p>

            {order && (
              <div className="mx-auto mt-8 max-w-lg rounded-[2rem] border border-border/70 bg-card p-6 text-left shadow-2xl sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Order number</p>
                    <p className="mt-1 text-lg font-black">{order.id}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-6 h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span className="font-semibold">{order.totalItems}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">Cash on Delivery</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-accent">Rs. {deliveryFee.toLocaleString()}</span></div>

                  {typeof order.deliveryDistanceKm === "number" && (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery distance</span><span className="font-semibold">{order.deliveryDistanceKm.toFixed(2)} km</span></div>
                  )}

                  <div className="h-px bg-border" />
                  <div className="flex items-end justify-between"><span className="font-bold">Total</span><span className="text-2xl font-black">Rs. {order.total.toLocaleString()}</span></div>
                </div>

                {order.deliveryDetails && (
                  <div className="mt-7 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><MapPin className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">Delivering to</p>
                        <p className="mt-1 text-sm font-bold">{order.deliveryDetails.name}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{order.deliveryDetails.address}</p>
                        <p className="text-xs leading-5 text-muted-foreground">{order.deliveryDetails.city}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{order.deliveryDetails.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/#products" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl sm:w-auto">
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold transition-all hover:bg-muted sm:w-auto">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
