"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/home/header";
import Hero from "@/components/home/hero";
import ProductSection from "@/components/home/product-section";
import ValueSection from "@/components/home/value-section";
import Footer from "@/components/home/footer";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  category?: {
    name: string;
  } | null;
};

const BRANCH_ID = "cmsxmqxgh0001kgtqcbxsi7b4";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBranch, setSelectedBranch] =
    useState("Ingiriya");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/branches/${BRANCH_ID}/products`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        /*
         * Try to read the API response regardless of
         * whether the request succeeded or failed.
         *
         * This is important because the API may return
         * a useful error message.
         */
        const data = await response
          .json()
          .catch(() => null);

        console.log(
          "Products API status:",
          response.status,
        );

        console.log(
          "Products API response:",
          data,
        );

        /*
         * Handle API errors with the actual server
         * error instead of a generic message.
         */
        if (!response.ok) {
          throw new Error(
            data?.error ||
              `Failed to load products (${response.status})`,
          );
        }

        /*
         * Make sure the API returned an array.
         */
        if (!Array.isArray(data)) {
          throw new Error(
            "Products API returned an invalid response.",
          );
        }

        setProducts(data);
      } catch (error) {
        console.error(
          "Failed to fetch products:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products right now.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  /*
   * Search products by:
   * - name
   * - description
   * - category
   */
  const filteredProducts = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const productName =
        product.name.toLowerCase();

      const description =
        product.description?.toLowerCase() ?? "";

      const category =
        product.category?.name.toLowerCase() ?? "";

      return (
        productName.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, searchQuery]);

  /*
   * Change branch/location.
   *
   * NOTE:
   * The current product API still uses the fixed
   * BRANCH_ID above. Changing this text does not yet
   * change the actual database branch.
   */
  const handleChangeLocation = () => {
    const newLocation = window.prompt(
      "Enter your Budget Go branch:",
      selectedBranch,
    );

    if (newLocation?.trim()) {
      setSelectedBranch(newLocation.trim());
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBranch={selectedBranch}
        onChangeLocation={handleChangeLocation}
      />

      <Hero />

      <div id="products">
        <ProductSection
          products={filteredProducts}
          loading={loading}
        />
      </div>

      {error && (
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-center">
            <p className="text-sm font-medium text-destructive">
              {error}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Please check the browser console and
              server terminal for the full API error.
            </p>
          </div>
        </div>
      )}

      <div id="delivery">
        <ValueSection />
      </div>

      <Footer />
    </main>
  );
}