"use client";

import { useState, type FormEvent } from "react";

export default function BranchQuickProductForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/dashboard/branch/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, barcode, price, stock }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create product.");

      setMessage(`${data.product.name} was added to this branch inventory.`);
      setName("");
      setBarcode("");
      setPrice("");
      setStock("");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/5 p-4">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm font-black text-foreground">
        {open ? "− Close quick product entry" : "+ Add a new product from distributor"}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold sm:col-span-2 lg:col-span-1">Product name
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Coca Cola 500ml" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" />
          </label>
          <label className="text-xs font-semibold">Barcode
            <input required value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="8901234567890" inputMode="numeric" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" />
          </label>
          <label className="text-xs font-semibold">Selling price
            <input required min="0" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="150" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" />
          </label>
          <label className="text-xs font-semibold">Quantity
            <input required min="0" step="1" type="number" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="20" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
            <button disabled={busy} className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? "Adding..." : "Add to branch inventory"}</button>
            <p className="text-xs text-muted-foreground">Creates the product and its branch inventory record in one transaction.</p>
          </div>
          {message && <p className="sm:col-span-2 lg:col-span-4 text-sm font-semibold text-emerald-600">{message}</p>}
          {error && <p className="sm:col-span-2 lg:col-span-4 text-sm font-semibold text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}
