"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

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
    barcode: string | null;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    category: { id: string; name: string } | null;
  };
};

type Props = { branchName: string; branchCode: string };

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Product photos must be 8 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process the product photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}

export default function BranchInventory({ branchName, branchCode }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [photoName, setPhotoName] = useState("");

  async function loadInventory() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/dashboard/branch/inventory?search=${encodeURIComponent(search)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load inventory.");
      setItems(data.inventory ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load inventory."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timer = setTimeout(() => void loadInventory(), 250); return () => clearTimeout(timer); }, [search]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try { setImageUrl(await compressImage(file)); setPhotoName(file.name); }
    catch (err) { setImageUrl(""); setPhotoName(""); setError(err instanceof Error ? err.message : "Could not process the photo."); }
  }

  function resetForm() {
    setName(""); setCategory(""); setBarcode(""); setPrice(""); setStock("0"); setImageUrl(""); setPhotoName(""); setShowAdd(false);
  }

  async function addProduct(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy("add"); setError("");
    try {
      const response = await fetch("/api/dashboard/branch/products/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category, barcode, price, stock, imageUrl: imageUrl || null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create product.");
      resetForm(); await loadInventory();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create product."); }
    finally { setBusy(null); }
  }

  async function updateStock(item: InventoryItem, nextStock: number) {
    if (nextStock < 0 || busy) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/dashboard/branch/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inventoryId: item.id, stock: nextStock }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update stock.");
      setItems((current) => current.map((entry) => entry.id === item.id ? data.inventory : entry));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update stock."); }
    finally { setBusy(null); }
  }

  async function removeItem(item: InventoryItem) {
    if (busy || !window.confirm(`Remove ${item.product.name} from this branch inventory?`)) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch(`/api/dashboard/branch/inventory?inventoryId=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove product.");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to remove product."); }
    finally { setBusy(null); }
  }

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);

  return (
    <section className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Branch inventory · {branchCode}</p><h1 className="mt-2 text-3xl font-black tracking-tight">{branchName}</h1><p className="mt-2 text-sm text-muted-foreground">Manage products and stock for your branch.</p></div><a href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted">Back to dashboard</a></div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU..." className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 sm:max-w-md" /><div className="flex h-11 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground">{activeItems.length} active products</div><button type="button" onClick={() => { setError(""); setShowAdd((value) => !value); }} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">+ Add product</button></div>
      {showAdd && <form onSubmit={addProduct} className="mb-5 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2"><label className="text-xs font-semibold">Product name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Coca Cola 500ml" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" /></label></div>
        <label className="text-xs font-semibold">Category<input required value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Beverages" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" /></label>
        <label className="text-xs font-semibold">Product code / barcode<input required value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="8901234567890" inputMode="numeric" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" /></label>
        <label className="text-xs font-semibold">Selling price<input required min="0" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="150" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" /></label>
        <label className="text-xs font-semibold">Opening stock<input required min="0" step="1" type="number" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="20" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" /></label>
        <div className="sm:col-span-2 lg:col-span-6"><label className="text-xs font-semibold">Product photo<div className="mt-2 flex flex-wrap items-center gap-3"><label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold hover:bg-muted">{photoName ? "Change photo" : "Choose photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="sr-only" /></label>{photoName && <span className="text-xs text-muted-foreground">{photoName}</span>}{imageUrl && <img src={imageUrl} alt="Product preview" className="h-12 w-12 rounded-lg border border-border object-cover" />}</div></label></div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6"><button disabled={busy === "add"} className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy === "add" ? "Adding..." : "Add product"}</button><button type="button" onClick={resetForm} className="h-11 rounded-xl border border-border px-5 text-sm font-semibold">Cancel</button><p className="text-xs text-muted-foreground">This creates the product in the catalog and adds its stock to {branchName}.</p></div>
      </form>}
      {error && <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="border-b border-border bg-muted/30"><tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><th className="px-5 py-4">Product</th><th className="px-5 py-4">Code</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-border">
        {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">Loading inventory...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No inventory items found.</td></tr> : items.map((item) => <tr key={item.id} className="align-middle"><td className="px-5 py-4"><div className="flex items-center gap-3">{item.product.imageUrl ? <img src={item.product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" /> : <div className="h-10 w-10 rounded-lg border border-border bg-muted" />}<div><div className="font-semibold">{item.product.name}</div>{item.product.category && <div className="mt-1 text-xs text-muted-foreground">{item.product.category.name}</div>}</div></div></td><td className="px-5 py-4 text-sm text-muted-foreground">{item.product.barcode ?? item.product.sku}</td><td className="px-5 py-4 text-sm font-semibold">LKR {item.price.toLocaleString("en-LK")}</td><td className="px-5 py-4"><span className={item.stock === 0 ? "font-bold text-destructive" : "font-bold"}>{item.stock}</span></td><td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy === item.id || item.stock <= 0} onClick={() => void updateStock(item, item.stock - 1)} className="h-9 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40">−1</button><button type="button" disabled={busy === item.id} onClick={() => void updateStock(item, item.stock + 1)} className="h-9 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">+1</button><button type="button" disabled={busy === item.id} onClick={() => void removeItem(item)} className="h-9 rounded-lg border border-destructive/20 px-3 text-xs font-bold text-destructive disabled:opacity-40">Remove</button></div></td></tr>)}
      </tbody></table></div></div><p className="mt-4 text-xs text-muted-foreground">Branch staff can view inventory, add new catalog products, increase/decrease stock, and remove products. Orders, revenue, and delivery assignment remain unavailable.</p>
    </div></section>
  );
}
