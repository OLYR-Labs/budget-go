"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(
          result.error.message ||
            "Unable to sign in. Please check your credentials.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);

      setError(
        "Something went wrong while signing in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-20 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-foreground text-primary shadow-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">Budget Go</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/55">
                  Smart local shopping
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                One platform. Every branch.
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.055em] xl:text-7xl">
                Your store,
                <br />
                <span className="text-accent">always moving.</span>
              </h1>
              <p className="mt-7 max-w-lg text-sm leading-7 text-primary-foreground/65 xl:text-base">
                Manage inventory, orders, branches and deliveries from one secure workspace built for Budget Go.
              </p>
              <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
                <Feature
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Secure access"
                  description="Protected staff accounts"
                />
                <Feature
                  icon={<ShoppingBag className="h-4 w-4" />}
                  title="Live inventory"
                  description="Branch-aware stock"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-primary-foreground/10 pt-6">
              <p className="text-xs text-primary-foreground/35">Budget Go Administration</p>
              <p className="text-xs text-primary-foreground/35">© 2026 Budget Go</p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-[430px]">
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">Budget Go</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Administration
                </p>
              </div>
            </div>

            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Secure staff access
              </div>
              <h2 className="text-4xl font-black leading-none tracking-[-0.045em] sm:text-5xl">
                Welcome
                <br />
                <span className="text-accent">back.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                Sign in to manage your Budget Go branch and keep operations moving.
              </p>
            </div>

            <div className="mt-9 rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-2xl shadow-black/[0.06] backdrop-blur-xl sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={email}
                      onInput={(event) => setEmail(event.currentTarget.value)}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-border bg-muted/30 pl-11 pr-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/50 focus:bg-background focus:ring-4 focus:ring-accent/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(
                          "Password recovery will be added when the reset-password flow is implemented.",
                        );
                      }}
                      className="text-[10px] font-bold text-accent transition-colors hover:text-accent/80"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onInput={(event) => setPassword(event.currentTarget.value)}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-xl border border-border bg-muted/30 pl-11 pr-12 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/50 focus:bg-background focus:ring-4 focus:ring-accent/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium leading-5 text-destructive"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to dashboard
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-2 border-t border-border/70 pt-5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                <p className="text-[10px] leading-4 text-muted-foreground">
                  Your session is protected by secure server-side authentication.
                </p>
              </div>
            </div>

            <div className="mt-7 text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                ← Back to Budget Go
              </button>
              <p className="mt-4 text-[10px] text-muted-foreground/50">Budget Go · Branch Operations</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.06] p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground">
        {icon}
      </div>
      <p className="text-xs font-bold">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-primary-foreground/45">{description}</p>
    </div>
  );
}
