"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: "sun" | "moon" | "logout";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );

    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>
      );

    default:
      return null;
  }
}

export default function DashboardControls() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const isDark = theme === "dark";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <div className="flex items-center gap-2">
      {/* Theme switcher */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          isDark
            ? "Switch to light theme"
            : "Switch to dark theme"
        }
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
      >
        {isDark ? (
          <Icon name="sun" />
        ) : (
          <Icon name="moon" />
        )}
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-3 py-2 text-xs font-semibold text-red-400 transition hover:border-red-500/20 hover:bg-red-500/[0.08] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="logout" />

        <span>
          {loggingOut ? "Logging out..." : "Logout"}
        </span>
      </button>
    </div>
  );
}