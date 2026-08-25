"use client";

import {
  ArrowRight,
  Check,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HeroProps = {
  selectedBranch: string;
  onChangeLocation: () => void;
};

export default function Hero({ selectedBranch, onChangeLocation }: HeroProps) {
  const handleStartShopping = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#08080a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -right-40 top-10 h-[38rem] w-[38rem] rounded-full bg-violet-500/15 blur-[130px]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24 xl:py-28">
        <div className="max-w-2xl">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border border-purple-400/20 bg-purple-500/10 px-3.5 py-1.5 text-purple-300 shadow-lg shadow-purple-950/20"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Local shopping made simple
          </Badge>

          <h1 className="text-balance text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Everyday shopping.
            <span className="block bg-gradient-to-r from-purple-300 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              Made effortless.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Find the products you need from your nearest Budget Go branch and
            get them delivered straight to your door.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/40">Shopping from</p>
              <p className="font-semibold text-white">{selectedBranch}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={handleStartShopping}
              className="group h-12 rounded-2xl bg-white px-6 font-semibold text-black shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-2xl"
            >
              Start shopping
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onChangeLocation}
              className="h-12 rounded-2xl border-white/15 bg-white/[0.04] px-6 text-white backdrop-blur-sm hover:bg-white/[0.08] hover:text-white"
            >
              <MapPin className="mr-2 h-4 w-4 text-purple-300" />
              Change location
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-medium text-white/40">
            <Truck className="h-4 w-4 text-purple-300" />
            Local delivery available from your nearest branch
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Check className="h-3.5 w-3.5 text-purple-400" />
              Local products
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Check className="h-3.5 w-3.5 text-purple-400" />
              Branch availability
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Check className="h-3.5 w-3.5 text-purple-400" />
              Fast delivery
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[500px] lg:block">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[380px] w-[380px]">
              <div className="absolute inset-5 rounded-[2.5rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                <div className="flex h-full flex-col rounded-[2rem] border border-white/[0.07] bg-[#111114]/90 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-black shadow-lg">B</div>
                      <div>
                        <p className="text-[10px] font-medium text-white/40">Your local store</p>
                        <p className="mt-0.5 text-sm font-bold text-white">Budget Go</p>
                      </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-5 grid flex-1 grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.045] p-3.5">
                      <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/10"><Package className="h-9 w-9 text-purple-300/80" /></div>
                      <div className="mt-3 h-2.5 w-20 rounded-full bg-white/15" />
                      <div className="mt-2 h-2.5 w-12 rounded-full bg-purple-400/30" />
                    </div>
                    <div className="mt-7 rounded-3xl border border-white/[0.06] bg-white/[0.045] p-3.5">
                      <div className="flex h-24 items-center justify-center rounded-2xl bg-white/[0.04]"><ShoppingBag className="h-9 w-9 text-white/40" /></div>
                      <div className="mt-3 h-2.5 w-24 rounded-full bg-white/15" />
                      <div className="mt-2 h-2.5 w-14 rounded-full bg-purple-400/30" />
                    </div>
                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.045] p-3.5">
                      <div className="flex h-20 items-center justify-center rounded-2xl bg-white/[0.035]"><Package className="h-7 w-7 text-white/30" /></div>
                      <div className="mt-3 h-2.5 w-16 rounded-full bg-white/15" />
                    </div>
                    <div className="mt-7 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-700 p-4 text-white shadow-xl shadow-purple-900/30">
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Delivery</p>
                          <Truck className="h-4 w-4 text-white/80" />
                        </div>
                        <div>
                          <p className="text-2xl font-black tracking-tight">Fast.</p>
                          <p className="mt-1 text-[10px] text-white/70">Right to your door.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-2 top-12 rounded-2xl border border-white/10 bg-[#151519]/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/10"><div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" /></div>
                  <div><p className="text-[10px] text-white/40">Availability</p><p className="text-xs font-semibold text-white">In stock nearby</p></div>
                </div>
              </div>

              <div className="animate-float absolute -bottom-2 -left-4 rounded-2xl border border-white/10 bg-[#151519]/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ animationDelay: "700ms" }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300"><MapPin className="h-3.5 w-3.5" /></div>
                  <div><p className="text-[10px] font-medium text-white/40">Shop local</p><p className="text-xs font-bold text-white">Delivered fast</p></div>
                </div>
              </div>

              <div className="animate-float absolute -left-8 top-28 rounded-2xl border border-white/10 bg-[#151519]/90 px-3.5 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ animationDelay: "1.4s" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300"><ShoppingBag className="h-3.5 w-3.5" /></div>
                  <div><p className="text-[9px] text-white/40">Your basket</p><p className="text-xs font-bold text-white">Ready to shop</p></div>
                </div>
              </div>

              <div className="animate-float absolute -bottom-8 right-12 h-14 w-14 rounded-full border border-purple-300/20 bg-purple-500/10 blur-[1px] shadow-xl shadow-purple-600/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/30 to-transparent" />
    </section>
  );
}
