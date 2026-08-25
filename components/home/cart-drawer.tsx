"use client";

import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart-store";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({
  open,
  onClose,
}: CartDrawerProps) {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore(
    (state) => state.updateQuantity,
  );
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }

    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-md flex-col border-l border-border/70 bg-background shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold">
                Your cart
              </h2>

              <p className="text-xs text-muted-foreground">
                {items.length === 0
                  ? "Your cart is empty"
                  : `${items.length} ${
                      items.length === 1 ? "item" : "items"
                    }`}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                <ShoppingCart className="h-8 w-8" />
              </div>

              <h3 className="mt-6 text-lg font-bold">
                Your cart is empty
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Add some products from your local Budget Go
                branch and they'll appear here.
              </p>

              <Button
                onClick={onClose}
                className="mt-6 rounded-xl"
              >
                Start shopping
              </Button>
            </div>
          ) : (
            <div className="p-5">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-card p-3"
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-semibold">
                            {item.name}
                          </h3>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="mt-1 text-sm font-bold">
                          Rs.{" "}
                          {item.price.toLocaleString()}
                        </p>

                        {/* Quantity */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-xl border border-border/70 bg-background">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                )
                              }
                              className="h-8 w-8 rounded-l-xl rounded-r-none"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>

                            <span className="w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={
                                item.quantity >= item.stock
                              }
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                )
                              }
                              className="h-8 w-8 rounded-l-none rounded-r-xl"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
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

              {/* Clear cart */}
              <Button
                variant="ghost"
                onClick={clearCart}
                className="mt-5 rounded-xl text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Clear cart
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-border/70 bg-background p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal
                </span>

                <span className="font-bold">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Delivery</span>

                <span>Calculated at checkout</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-black">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              {/* Checkout */}
              <Button
                type="button"
                className="mt-2 h-12 w-full rounded-2xl text-sm font-bold shadow-lg shadow-accent/10"
                onClick={handleCheckout}
              >
                Continue to checkout
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}