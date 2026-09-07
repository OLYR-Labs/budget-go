"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

function LogoutIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await authClient.signOut();
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={compact
        ? "inline-flex h-9 items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-3 text-xs font-semibold text-red-500 transition hover:border-red-500/20 hover:bg-red-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        : "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"}
    >
      <LogoutIcon />
      <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
