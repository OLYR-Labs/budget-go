"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function CustomerLoginPage() {
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
      if (result.data?.user?.role !== "CUSTOMER") {
        await authClient.signOut();
        setError("This is a staff account. Please use the Staff Portal to sign in.");
        return;
      }
      window.location.replace("/account");
    } catch (loginError) {
      console.error("Customer login failed:", loginError);
      setError("Something went wrong while signing in. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-black/[0.08] lg:grid-cols-[0.92fr_1.08fr]">
          <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
            <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-[9px] font-black tracking-tight text-white shadow-lg">SST</div><div><p className="text-lg font-black tracking-tight">Sampath Food City</p><p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/50">Customer account</p></div></div>
            <div className="relative z-10 max-w-md"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"><Sparkles className="h-3.5 w-3.5 text-accent" />Your shopping space</div><h1 className="text-5xl font-black leading-[0.94] tracking-[-0.055em] xl:text-6xl">Everything you<br /><span className="text-accent">order,</span> in one place.</h1><p className="mt-6 text-sm leading-7 text-primary-foreground/65">Track deliveries, keep your addresses ready and make your next Sampath Food City order even easier.</p><div className="mt-8 space-y-3"><Benefit icon={<ShoppingBag className="h-4 w-4" />} text="Track your orders" /><Benefit icon={<MapPin className="h-4 w-4" />} text="Save delivery addresses" /><Benefit icon={<CheckCircle2 className="h-4 w-4" />} text="Keep your order history" /></div></div>
            <p className="relative z-10 text-xs text-primary-foreground/35">Sampath Food City · Customer account</p>
          </section>
          <section className="relative p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-[9px] font-black tracking-tight text-white shadow-lg">SST</div><div><p className="text-lg font-black tracking-tight">Sampath Food City</p><p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Customer account</p></div></div>
            <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Welcome back</div><h2 className="text-4xl font-black leading-none tracking-[-0.045em] sm:text-5xl">Sign in<br /><span className="text-accent">to your account.</span></h2><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Access your orders, saved delivery details and account settings.</p></div>
            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <label className="grid gap-2"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><Mail className="h-4 w-4" />Email address</span><input required type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-13 w-full rounded-xl border border-border bg-muted/30 px-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/50 focus:bg-background focus:ring-4 focus:ring-accent/10" /></label>
              <label className="grid gap-2"><span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" />Password</span><button type="button" onClick={() => setError("Password recovery will be added when the reset-password flow is implemented.")} className="normal-case tracking-normal text-accent hover:text-accent/80">Forgot password?</button></span><div className="relative"><input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="h-13 w-full rounded-xl border border-border bg-muted/30 px-4 pr-12 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/50 focus:bg-background focus:ring-4 focus:ring-accent/10" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium leading-5 text-destructive">{error}</div>}
              <button type="submit" disabled={loading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />Signing in...</> : <>Continue to my account<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>
            </form>
            <div className="mt-7 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">New to Sampath Food City? <Link href="/account/register" className="font-bold text-accent hover:underline">Create a customer account</Link></div>
            <div className="mt-7 flex items-center justify-center gap-3 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">← Back to shopping</Link><span className="text-border">•</span><Link href="/login" className="font-semibold hover:text-accent">Staff Portal</Link></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.06] px-4 py-3 text-xs font-semibold"><span className="text-accent">{icon}</span>{text}</div>; }
