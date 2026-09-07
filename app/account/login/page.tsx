"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) { setError(result.error.message || "Unable to sign in. Please check your details."); return; }
      router.replace("/account");
      router.refresh();
    } catch (loginError) {
      console.error("Customer login failed:", loginError);
      setError("Something went wrong while signing in. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 py-10">
        <div className="w-full rounded-[2rem] border border-border/70 bg-card p-6 shadow-2xl sm:p-10">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-[9px] font-black text-white">SST</div><div><p className="text-lg font-black">Sampath Food City</p><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Customer login</p></div></div>
          <div className="mt-10"><ShoppingBag className="h-7 w-7 text-accent" /><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Welcome back.</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to track your orders and manage your saved details.</p></div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><Mail className="h-4 w-4" />Email address</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field-input" /></label>
            <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><LockKeyhole className="h-4 w-4" />Password</span><div className="relative"><input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="field-input pr-12" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium leading-5 text-destructive">{error}</div>}
            <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : <>Sign in<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">Don't have an account? <Link href="/account/register" className="font-bold text-accent hover:underline">Create one</Link></p>
          <p className="mt-4 text-center text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">← Back to shopping</Link></p>
        </div>
      </div>
      <style jsx global>{`.field-input{height:3rem;width:100%;border-radius:.75rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0 1rem;font-size:.875rem;outline:none;transition:all .2s}.field-input:focus{border-color:hsl(var(--accent));box-shadow:0 0 0 4px hsl(var(--accent)/.1)}`}</style>
    </main>
  );
}
