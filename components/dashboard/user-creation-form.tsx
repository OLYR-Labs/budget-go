"use client";

import { useState } from "react";

type Branch = { id: string; name: string; code: string };
type Role = "BRANCH_ADMIN" | "BRANCH_STAFF";

export default function UserCreationForm({ branches }: { branches: Branch[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("BRANCH_ADMIN");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, branchId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to create account.");

      setMessage(`Account created for ${data.user.name}. They can now sign in with their email and password.`);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {message && <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">{message}</div>}
      {error && <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 outline-none focus:border-accent/50" placeholder="Kasun Perera" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 outline-none focus:border-accent/50" placeholder="kasun@olyr.com" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Temporary password
          <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 outline-none focus:border-accent/50" placeholder="At least 8 characters" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Account type
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-11 rounded-xl border border-border bg-background px-4 outline-none focus:border-accent/50">
            <option value="BRANCH_ADMIN">Branch Manager</option>
            <option value="BRANCH_STAFF">Branch Staff</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
          Branch
          <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!branches.length} className="h-11 rounded-xl border border-border bg-background px-4 outline-none focus:border-accent/50 disabled:opacity-50">
            {branches.length === 0 ? <option value="">No active branches available</option> : branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
          </select>
        </label>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 border-t border-border pt-6">
        <p className="max-w-xl text-xs text-muted-foreground">Only administrators can create these accounts. Delivery staff are intentionally excluded from dashboard account creation.</p>
        <button disabled={busy || !branches.length} className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {busy ? "Creating..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
