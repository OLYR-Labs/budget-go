"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, PackageSearch, Search, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/cart-store";

const SELECTED_BRANCH_KEY = "budget-go-selected-branch";
type Category = { id: string; name: string };
type Branch = { id: string; name: string; code: string };
type Product = { id: string; name: string; price: number | string; stock: number; imageUrl?: string | null; category?: Category | null };

export default function ProductsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("featured");

  const loadBranches = useCallback(async () => {
    const response = await fetch("/api/branches", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) throw new Error(data?.error || "Unable to load branches.");
    setBranches(data);
    const savedId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
    setBranch(data.find((item: Branch) => item.id === savedId) ?? data.find((item: Branch) => item.code === "ING") ?? data[0] ?? null);
  }, []);

  const loadProducts = useCallback(async (branchId: string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/branches/${branchId}/products`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data?.error || "Unable to load products.");
      setProducts(data);
    } catch (loadError) { setProducts([]); setError(loadError instanceof Error ? loadError.message : "Unable to load products."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadBranches().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load branches.")); }, [loadBranches]);
  useEffect(() => { if (!branch) return; window.localStorage.setItem(SELECTED_BRANCH_KEY, branch.id); void loadProducts(branch.id); }, [branch, loadProducts]);

  const categories = useMemo(() => {
    const map = new Map<string, Category>();
    products.forEach((product) => { if (product.category) map.set(product.category.id, product.category); });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !normalized || product.name.toLowerCase().includes(normalized) || product.category?.name.toLowerCase().includes(normalized);
      const matchesCategory = category === "all" || product.category?.id === category;
      const matchesAvailability = availability === "all" || (availability === "in-stock" ? product.stock > 0 : product.stock <= 0);
      return matchesQuery && matchesCategory && matchesAvailability;
    });
    return [...result].sort((a, b) => sort === "price-low" ? Number(a.price) - Number(b.price) : sort === "price-high" ? Number(b.price) - Number(a.price) : sort === "name" ? a.name.localeCompare(b.name) : 0);
  }, [products, query, category, availability, sort]);

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={() => window.history.back()} className="inline-flex h-9 items-center rounded-xl px-2 text-xs font-semibold hover:bg-muted"><ArrowLeft className="mr-2 h-4 w-4" />Back</button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black tracking-tight">All products</h1><p className="truncate text-[10px] text-muted-foreground">{branch ? `Shopping from ${branch.name}` : "Choose a branch"}</p></div>
      <Link href="/" className="hidden text-xs font-semibold text-accent sm:block">Home</Link><Link href="/cart" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80" aria-label="Open cart"><ShoppingCart className="h-4 w-4" /></Link>
    </div></header>
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><Badge variant="secondary" className="rounded-full bg-accent/10 text-accent">Full catalog</Badge><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Find what you need</h2><p className="mt-1 text-xs text-muted-foreground">Search and filter products available at your selected branch.</p></div>
        <select value={branch?.id ?? ""} onChange={(event) => { const next = branches.find((item) => item.id === event.target.value); if (next) setBranch(next); }} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent">{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." className="h-11 rounded-xl pl-10" /></div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent"><option value="all">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent"><option value="all">All stock</option><option value="in-stock">In stock</option><option value="out-of-stock">Out of stock</option></select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent"><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-border/70 pb-3"><p className="text-xs font-semibold text-muted-foreground">{loading ? "Loading products…" : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`}</p>{query || category !== "all" || availability !== "all" ? <button type="button" onClick={() => { setQuery(""); setCategory("all"); setAvailability("all"); }} className="text-xs font-bold text-accent">Clear filters</button> : null}</div>
      {error ? <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">{error}</div> : null}
      {loading ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 12 }).map((_, index) => <Card key={index} className="overflow-hidden rounded-2xl"><div className="skeleton aspect-square" /><CardContent className="p-3"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton mt-3 h-5 w-16 rounded" /></CardContent></Card>)}</div> : filteredProducts.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center"><PackageSearch className="mx-auto h-9 w-9 text-muted-foreground/40" /><h3 className="mt-4 font-bold">No products found</h3><p className="mt-1 text-xs text-muted-foreground">Try another search or adjust your filters.</p></div> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{filteredProducts.map((product) => <CatalogProductCard key={product.id} product={product} />)}</div>}
    </section>
  </main>;
}

function CatalogProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false); const addItem = useCartStore((state) => state.addItem); const price = Number(product.price); const out = product.stock <= 0;
  function add() { if (out) return; addItem({ id: product.id, name: product.name, price, imageUrl: product.imageUrl, stock: product.stock }); setAdded(true); setTimeout(() => setAdded(false), 1200); }
  return <Card className={`group overflow-hidden rounded-2xl border-border/70 shadow-none transition-all ${out ? "opacity-90" : "hover:-translate-y-1 hover:shadow-lg"}`}><div className="relative aspect-square overflow-hidden bg-muted/50">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className={`h-full w-full object-cover transition-transform duration-300 ${out ? "grayscale opacity-80" : "group-hover:scale-105"}`} /> : <div className="flex h-full items-center justify-center"><PackageSearch className="h-10 w-10 text-muted-foreground/20" /></div>}<Badge variant="secondary" className={`absolute left-2.5 top-2.5 rounded-full text-[9px] font-bold ${out ? "text-destructive" : "bg-background/90"}`}>{out ? "Out of stock" : "In stock"}</Badge></div><CardContent className="p-3"><h3 className="min-h-[2.25rem] line-clamp-2 text-xs font-bold leading-4">{product.name}</h3><div className="mt-3 flex items-center justify-between gap-2"><p className="truncate text-base font-black">Rs. {price.toLocaleString()}</p><Button size="sm" disabled={out} onClick={add} className={`h-8 rounded-lg px-2.5 text-[10px] ${added ? "bg-green-600 text-white hover:bg-green-600" : ""}`}>{added ? <><Check className="mr-1 h-3 w-3" />Added</> : <><ShoppingCart className="mr-1 h-3 w-3" />{out ? "Unavailable" : "Add"}</>}</Button></div></CardContent></Card>;
}
