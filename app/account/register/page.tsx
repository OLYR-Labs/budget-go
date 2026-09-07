"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Home, LockKeyhole, Mail, MapPin, Phone, ShoppingBag, Sparkles, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function CustomerRegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Your password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, phone: phone.trim() });
      if (result.error) { setError(result.error.message || "Unable to create your account."); return; }
      const addressResponse = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: "Home", recipientName: name.trim(), phone: phone.trim(), address: address.trim(), city: city.trim(), isDefault: true }) });
      if (!addressResponse.ok) console.warn("Account created, but the initial address could not be saved.");
      window.location.replace("/account");
    } catch (registerError) {
      console.error("Customer registration failed:", registerError);
      setError("Something went wrong while creating your account. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-black/[0.08] lg:grid-cols-[0.82fr_1.18fr]">
          <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
            <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-[9px] font-black tracking-tight text-white shadow-lg">SST</div><div><p className="text-lg font-black">Sampath Food City</p><p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/50">Customer account</p></div></div>
            <div className="relative z-10 max-w-md"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"><Sparkles className="h-3.5 w-3.5 text-accent" />A better way to shop</div><h1 className="text-5xl font-black leading-[0.94] tracking-[-0.055em] xl:text-6xl">Your orders.<br /><span className="text-accent">Your details.</span><br />One account.</h1><p className="mt-6 text-sm leading-7 text-primary-foreground/65">Create your free customer account and make every Sampath Food City delivery faster and easier.</p><div className="mt-8 space-y-3"><Benefit icon={<MapPin className="h-4 w-4" />} text="Keep your delivery address ready" /><Benefit icon={<ShoppingBag className="h-4 w-4" />} text="Follow every order" /><Benefit icon={<CheckCircle2 className="h-4 w-4" />} text="View your order history" /></div></div>
            <p className="relative z-10 text-xs text-primary-foreground/35">Sampath Food City · Customer account</p>
          </section>

          <section className="p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3 lg:hidden"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-[9px] font-black tracking-tight text-white shadow-lg">SST</div><div><p className="text-lg font-black">Sampath Food City</p><p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Customer account</p></div></div><div className="hidden lg:block" /></div>
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Create your account</div><h2 className="text-4xl font-black leading-none tracking-[-0.045em] sm:text-5xl">Welcome to<br /><span className="text-accent">Sampath Food City.</span></h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Tell us a little about you so we can make your next order quicker.</p></div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <FormSection title="Personal details" description="The basics we use to identify your account." icon={<User className="h-4 w-4" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={<User className="h-4 w-4" />} label="Full name"><input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="field-input" /></Field>
                  <Field icon={<Phone className="h-4 w-4" />} label="Phone number"><input required type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXX XXXX" className="field-input" /></Field>
                  <div className="sm:col-span-2"><Field icon={<Mail className="h-4 w-4" />} label="Email address"><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field-input" /></Field></div>
                </div>
              </FormSection>

              <FormSection title="Delivery address" description="Save a default address so checkout is faster." icon={<MapPin className="h-4 w-4" />}>
                <div className="grid gap-4 sm:grid-cols-[1.35fr_0.65fr]">
                  <Field icon={<Home className="h-4 w-4" />} label="Address"><textarea required autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="House number, street, landmark" className="field-input h-auto py-3" /></Field>
                  <Field icon={<MapPin className="h-4 w-4" />} label="City / area"><input required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or area" className="field-input" /></Field>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />This address will be saved as your default delivery address.</div>
              </FormSection>

              <FormSection title="Account security" description="Choose a secure password for your SST account." icon={<LockKeyhole className="h-4 w-4" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={<LockKeyhole className="h-4 w-4" />} label="Password"><PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} placeholder="At least 8 characters" /></Field>
                  <Field icon={<LockKeyhole className="h-4 w-4" />} label="Confirm password"><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="field-input" /></Field>
                </div>
              </FormSection>

              {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium leading-5 text-destructive">{error}</div>}
              <button type="submit" disabled={loading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />Creating your account...</> : <>Create my account<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>
            </form>

            <div className="mt-6 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">Already have an account? <Link href="/account/login" className="font-bold text-accent hover:underline">Sign in</Link></div>
            <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">← Back to shopping</Link><span className="text-border">•</span><Link href="/login" className="font-semibold hover:text-accent">Staff Portal</Link></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FormSection({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border/80 bg-background/40 p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-start gap-3 border-b border-border/70 pb-4"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">{icon}</span><div><h3 className="text-sm font-black tracking-tight">{title}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p></div></div>{children}</section>;
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{icon}{label}</span>{children}</label>; }
function PasswordInput({ value, onChange, show, onToggle, placeholder }: { value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; placeholder: string }) { return <div className="relative"><input required minLength={8} type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field-input pr-12" /><button type="button" onClick={onToggle} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>; }
function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.06] px-4 py-3 text-xs font-semibold"><span className="text-accent">{icon}</span>{text}</div>; }
