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
    // Only block the initial render while we establish the authentication state.
    // Better Auth can temporarily enter a pending/revalidation state when the
    // browser tab regains focus. Keeping the children mounted during that state
    // prevents the entire homepage from being unmounted and recreated, which
    // otherwise resets its scroll position back to the hero section.
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

  // Do not include isPending here. Once the initial authentication check has
  // completed, keep the existing page mounted during background/foreground
  // session revalidation so scroll position and component state are preserved.
  if (checking) return null;
  return children;
}
