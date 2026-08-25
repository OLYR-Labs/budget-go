"use client";

import { useEffect, useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  productId: string;
  price: number;
  stock: number;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    category: { id: string; name: string } | null;
  };
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Props = { branchName: string; branchCode: string };

export default function BranchInventory({ branchName, branchCode }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");

  async function loadInventory() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/branch/inventory?search=${encodeURIComponent(search)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load inventory.");
      setItems(data.inventory ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch("/api/dashboard/branch/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load products.");
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadInventory(), 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function addProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!productId || busy) return;
    setBusy("add");
    setError("");
    try {
      const response = await fetch("/api/dashboard/branch/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price: Number(price), stock: Number(stock) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add product.");
      setShowAdd(false);
      setProductId("");
      setPrice("");
      setStock("0");
      await Promise.all([loadInventory(), loadProducts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStock(item: InventoryItem, nextStock: number) {
    if (nextStock < 0 || busy) return;
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch("/api/dashboard/branch/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId: item.id, stock: nextStock }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update stock.");
      setItems((current) => current.map((entry) => entry.id === item.id ? data.inventory : entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock.");
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(item: InventoryItem) {
    if (busy || !window.confirm(`Remove ${item.product.name} from this branch inventory?`)) return;
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/branch/inventory?inventoryId=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove product.");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove product.");
    } finally {
      setBusy(null);
    }
  }

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);

  return (
    <section className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Branch inventory · {branchCode}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{branchName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage products and stock for your branch.</p>
          </div>
          <a href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted">Back to dashboard</a>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU..." className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 sm:max-w-md" />
          <div className="flex h-11 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground">{activeItems.length} active products</div>
          <button type="button" onClick={() => { setShowAdd(true); void loadProducts(); }} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">+ Add product</button>
        </div>

        {showAdd && (
          <form onSubmit={addProduct} className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_150px_120px_auto] sm:items-end">
            <label className="text-xs font-semibold">Product
              <select required value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Price
              <input required min="0" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="text-xs font-semibold">Opening stock
              <input required min="0" step="1" type="number" value={stock} onChange={(event) => setStock(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <div className="flex gap-2">
              <button disabled={busy === "add"} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy === "add" ? "Adding..." : "Add"}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="h-11 rounded-xl border border-border px-4 text-sm font-semibold">Cancel</button>
            </div>
          </form>
        )}

        {error && <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-border bg-muted/30"><tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><th className="px-5 py-4">Product</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">Loading inventory...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No inventory items found.</td></tr> : items.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-5 py-4"><div className="font-semibold">{item.product.name}</div>{item.product.category && <div className="mt-1 text-xs text-muted-foreground">{item.product.category.name}</div>}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{item.product.sku}</td>
                    <td className="px-5 py-4 text-sm font-semibold">LKR {item.price.toLocaleString("en-LK")}</td>
                    <td className="px-5 py-4"><span className={item.stock === 0 ? "font-bold text-destructive" : "font-bold"}>{item.stock}</span></td>
                    <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy === item.id || item.stock <= 0} onClick={() => void updateStock(item, item.stock - 1)} className="h-9 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40">−1</button><button type="button" disabled={busy === item.id} onClick={() => void updateStock(item, item.stock + 1)} className="h-9 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">+1</button><button type="button" disabled={busy === item.id} onClick={() => void removeItem(item)} className="h-9 rounded-lg border border-destructive/20 px-3 text-xs font-bold text-destructive disabled:opacity-40">Remove</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Branch staff can view inventory, add products, increase/decrease stock, and remove products. Orders, revenue, and delivery assignment remain unavailable.</p>
      </div>
    </section>
  );
}
