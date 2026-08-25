"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "@/components/home/header";
import Hero from "@/components/home/hero";
import ProductSection from "@/components/home/product-section";
import ValueSection from "@/components/home/value-section";
import Footer from "@/components/home/footer";
import { useCartStore } from "@/lib/cart-store";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  category?: { name: string } | null;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  availableProductCount: number;
};

const SELECTED_BRANCH_KEY = "budget-go-selected-branch";

export default function Home() {
  const clearCart = useCartStore((state) => state.clearCart);
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setBranchLoading(true);
      setBranchError(null);

      const response = await fetch("/api/branches", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "Unable to load branches.");
      }

      setBranches(data);

      const savedId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
      const savedBranch = data.find((branch: Branch) => branch.id === savedId);
      const defaultBranch =
        savedBranch ??
        data.find((branch: Branch) => branch.code === "ING") ??
        data[0];

      if (defaultBranch) {
        setSelectedBranch(defaultBranch);
        window.localStorage.setItem(SELECTED_BRANCH_KEY, defaultBranch.id);
      }
    } catch (loadError) {
      console.error("Failed to load branches:", loadError);
      setBranchError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load branches.",
      );
    } finally {
      setBranchLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/branches/${branchId}/products`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          data?.error || `Failed to load products (${response.status}).`,
        );
      }

      setProducts(data);
    } catch (loadError) {
      console.error("Failed to fetch products:", loadError);
      setProducts([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load products right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (selectedBranch) {
      void loadProducts(selectedBranch.id);
    }
  }, [selectedBranch, loadProducts]);

  const handleSelectBranch = (branch: Branch) => {
    if (selectedBranch?.id === branch.id) {
      setLocationOpen(false);
      return;
    }

    if (cartItemCount > 0) {
      const confirmed = window.confirm(
        "Changing branches will clear your current cart because products and prices are branch-specific. Continue?",
      );

      if (!confirmed) return;
      clearCart();
    }

    setSelectedBranch(branch);
    window.localStorage.setItem(SELECTED_BRANCH_KEY, branch.id);
    setLocationOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const productName = product.name.toLowerCase();
      const description = product.description?.toLowerCase() ?? "";
      const category = product.category?.name.toLowerCase() ?? "";

      return (
        productName.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, searchQuery]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBranch={
          selectedBranch?.name ?? (branchLoading ? "Loading..." : "Select branch")
        }
        onChangeLocation={() => setLocationOpen(true)}
      />

      <Hero
        selectedBranch={
          selectedBranch?.name ?? (branchLoading ? "Loading..." : "Select branch")
        }
        onChangeLocation={() => setLocationOpen(true)}
      />

      <div id="products">
        <ProductSection products={filteredProducts} loading={loading} />
      </div>

      {(error || branchError) && (
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-center">
            <p className="text-sm font-medium text-destructive">
              {branchError ?? error}
            </p>
          </div>
        </div>
      )}

      <div id="delivery">
        <ValueSection />
      </div>

      <Footer />

      {locationOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                  Delivery location
                </p>
                <h2 className="mt-1 text-xl font-black">Choose your Budget Go branch</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your product availability and prices depend on the selected branch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                aria-label="Close branch selector"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6">
              {branchLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {branches.map((branch) => {
                    const selected = selectedBranch?.id === branch.id;

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleSelectBranch(branch)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                            : "border-border hover:border-accent/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                selected
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span aria-hidden="true">📍</span>
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-black">{branch.name}</span>
                              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                {branch.address ?? `Branch ${branch.code}`}
                              </span>
                              <span className="mt-2 block text-[10px] font-semibold text-accent">
                                {branch.availableProductCount} products available · {branch.deliveryRadiusKm} km delivery radius
                              </span>
                            </span>
                          </div>
                          {selected && <span className="text-accent">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
