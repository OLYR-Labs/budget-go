"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  latitude: number;
  longitude: number;
  deliveryRadius: number;
  isActive: boolean;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/branches")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load branches.");
        setBranches(data.branches);
      })
      .catch((error) => setMessage({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  function updateField(id: string, field: "latitude" | "longitude", value: string) {
    setBranches((current) => current.map((branch) => branch.id === id ? { ...branch, [field]: Number(value) } : branch));
  }

  async function saveLocation(branch: Branch) {
    setSavingId(branch.id);
    setMessage(null);

    try {
      const response = await fetch("/api/dashboard/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: branch.id,
          latitude: branch.latitude,
          longitude: branch.longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save branch location.");

      setBranches((current) => current.map((item) => item.id === branch.id ? data.branch : item));
      setMessage({ type: "success", text: `${branch.name} delivery location saved.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save branch location." });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#08080b] dark:text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-500">Head Office</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Branch locations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Manage the fixed delivery origin for every branch. These coordinates are used by the server when calculating customer delivery distance and eligibility.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-bold text-purple-500">← Back to dashboard</Link>
        </div>

        {message && (
          <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-white/[0.07] dark:bg-[#101014]">Loading branches...</div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {branches.map((branch) => (
              <section key={branch.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.07] dark:bg-[#101014]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black">{branch.name}</h2>
                      <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">{branch.code}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{branch.address || "No address configured"}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${branch.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-bold">
                    Latitude
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={branch.latitude}
                      onChange={(event) => updateField(branch.id, "latitude", event.target.value)}
                      className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:border-purple-500 dark:border-white/10"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold">
                    Longitude
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={branch.longitude}
                      onChange={(event) => updateField(branch.id, "longitude", event.target.value)}
                      className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:border-purple-500 dark:border-white/10"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-zinc-500">Delivery radius: {branch.deliveryRadius} km</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.latitude},${branch.longitude}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-purple-500 hover:underline"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => saveLocation(branch)}
                  disabled={savingId === branch.id}
                  className="mt-5 h-11 w-full rounded-xl bg-purple-600 text-sm font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingId === branch.id ? "Saving..." : "Save delivery location"}
                </button>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
