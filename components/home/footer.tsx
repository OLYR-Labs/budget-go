"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
} from "lucide-react";

type FooterBranch = {
  id: string;
  name: string;
  address?: string | null;
};

type FooterProps = {
  selectedBranch?: FooterBranch | null;
};

const SELECTED_BRANCH_KEY = "budget-go-selected-branch";

export default function Footer({ selectedBranch: selectedBranchProp }: FooterProps) {
  const [selectedBranch, setSelectedBranch] = useState<FooterBranch | null>(selectedBranchProp ?? null);

  useEffect(() => {
    let mounted = true;

    const loadBranches = async () => {
      try {
        const response = await fetch("/api/branches", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!mounted || !response.ok || !Array.isArray(data)) return;

        const selectedId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
        const branch = data.find((item: FooterBranch) => item.id === selectedId) ?? data[0] ?? null;
        setSelectedBranch(branch);
      } catch (error) {
        console.warn("Failed to load footer branch:", error);
      }
    };

    void loadBranches();

    // The homepage stores branch selection in localStorage. The native `storage`
    // event does not fire in the same tab, so check the selected id periodically
    // without repeatedly fetching branch data.
    let lastBranchId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
    const branchWatcher = window.setInterval(() => {
      const currentBranchId = window.localStorage.getItem(SELECTED_BRANCH_KEY);
      if (currentBranchId !== lastBranchId) {
        lastBranchId = currentBranchId;
        void loadBranches();
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearInterval(branchWatcher);
    };
  }, []);

  useEffect(() => {
    if (selectedBranchProp) setSelectedBranch(selectedBranchProp);
  }, [selectedBranchProp]);

  const branchName = selectedBranch?.name ?? "Your local branch";
  const branchAddress = selectedBranch?.address ?? "Branch location";

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-black">
                B
              </div>

              <div>
                <p className="text-[15px] font-bold tracking-tight text-white">
                  Budget Go
                </p>

                <p className="mt-1 text-[10px] font-medium text-white/40">
                  Shop local. Delivered fast.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/50">
              Your simple way to shop products from your local Budget Go
              branch and have them delivered to your door.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-xs font-bold text-white/50 transition-colors hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-purple-300"
              >
                f
              </button>

              <button
                type="button"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-xs font-bold text-white/50 transition-colors hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-purple-300"
              >
                ig
              </button>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-bold text-white">Shop {branchName}</h3>

            <nav className="mt-4 flex flex-col gap-3">
              <a href="#products" className="text-sm text-white/50 transition-colors hover:text-white">
                {branchName} Products
              </a>
              <a href="#categories" className="text-sm text-white/50 transition-colors hover:text-white">
                Categories
              </a>
              <a href="#delivery" className="text-sm text-white/50 transition-colors hover:text-white">
                {branchName} Delivery
              </a>
              <a href="#" className="text-sm text-white/50 transition-colors hover:text-white">
                Help & Support
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-white">{branchName} Branch</h3>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                <p className="text-sm leading-5 text-white/50">{branchAddress}</p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-purple-400" />
                <p className="text-sm text-white/50">Contact {branchName} branch</p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-purple-400" />
                <p className="text-sm text-white/50">support@budgetgo.lk</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Budget Go. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/40">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Shop local. Live better.</span>
            <span aria-hidden="true">·</span>
            <span>
              Developed by{" "}
              <a
                href="https://olyrlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/60 transition-colors hover:text-white"
              >
                OLYR Labs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
