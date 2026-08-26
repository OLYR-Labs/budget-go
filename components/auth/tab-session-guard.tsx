"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const TAB_SESSION_KEY = "budget-go-tab-session";

export function markTabSessionActive() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TAB_SESSION_KEY, "active");
  }
}

export function TabSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setChecking(false);
      return;
    }

    const activeInThisTab = window.sessionStorage.getItem(TAB_SESSION_KEY) === "active";

    if (!activeInThisTab) {
      void authClient.signOut().finally(() => {
        setChecking(false);
        if (pathname !== "/login") router.replace("/login");
      });
      return;
    }

    setChecking(false);
  }, [isPending, pathname, router, session?.user]);

  if (isPending || checking) return null;
  return children;
}
