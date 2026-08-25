import {
    Clock3,
    MapPin,
    ShieldCheck,
    ShoppingBag,
    Truck,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import { Card, CardContent } from "@/components/ui/card";
  
  const features = [
    {
      icon: MapPin,
      title: "Shop locally",
      description:
        "Browse products available from your nearest Budget Go branch.",
    },
    {
      icon: Truck,
      title: "Local delivery",
      description:
        "Get your everyday essentials delivered directly to your door.",
    },
    {
      icon: Clock3,
      title: "Save your time",
      description:
        "Skip unnecessary trips and order what you need in just a few taps.",
    },
    {
      icon: ShieldCheck,
      title: "Reliable shopping",
      description:
        "See real branch availability so you know what's actually in stock.",
    },
  ];
  
  export default function ValueSection() {
    return (
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="rounded-full bg-accent/10 text-accent"
            >
              Why Budget Go
            </Badge>
  
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Shopping should feel simple.
            </h2>
  
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              We bring your local store closer to you, making everyday shopping
              faster, easier, and more convenient.
            </p>
          </div>
  
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
  
              return (
                <Card
                  key={feature.title}
                  className="interactive-card rounded-3xl border-border/70 bg-card/80 shadow-none"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
  
                    <h3 className="mt-5 font-bold tracking-tight">
                      {feature.title}
                    </h3>
  
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
  
          {/* Small reassurance strip */}
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
  
              <div>
                <p className="text-sm font-bold">
                  Everything you need, closer than you think.
                </p>
  
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Start with your nearest branch and discover what's available.
                </p>
              </div>
            </div>
  
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500" />
  
              Local availability
            </div>
          </div>
        </div>
      </section>
    );
  }