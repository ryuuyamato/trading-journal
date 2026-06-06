"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Library,
  BarChart2,
  ClipboardList,
  ChevronDown,
  Search,
  ChevronRight,
} from "lucide-react";

const MARKET_DOT_COLORS: Record<string, string> = {
  FOREX: "#378ADD",
  COMMODITY: "#EF9F27",
  STOCK_IDX: "#1D9E75",
  STOCK_US: "#085041",
  CRYPTO_SPOT: "#7F77DD",
  CRYPTO_FUTURES: "#7F77DD",
  MULTI_ASSET: "#C47B2B",
};

interface Account {
  id: string;
  name: string;
  marketType: string;
}

interface SidebarNavProps {
  userName?: string | null;
  accounts: Account[];
}

const TOP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades",    label: "Jurnal",     icon: BookOpen },
];

const BOTTOM_NAV = [
  { href: "/playbook", label: "Playbook",  icon: Library },
  { href: "/analitik", label: "Analitik",  icon: BarChart2 },
  { href: "/review",   label: "Review",    icon: ClipboardList },
];

export function SidebarNav({ userName, accounts }: SidebarNavProps) {
  const pathname = usePathname();
  const [accountsOpen, setAccountsOpen] = useState(true);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const initial = (userName ?? "T").charAt(0).toUpperCase();
  const workspaceName = userName ? `${userName}'s Trading` : "Trading Journal";

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-45.5 shrink-0 overflow-hidden">
      {/* Workspace switcher */}
      <div className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-sidebar-accent rounded-md mx-1 mt-1 transition-colors">
        <div
          className="w-5.5 h-5.5 rounded-[6px] flex items-center justify-center text-white font-medium text-[11px] shrink-0"
          style={{ backgroundColor: "#1D9E75" }}
        >
          {initial}
        </div>
        <span className="text-[13px] font-medium truncate flex-1 text-sidebar-foreground">
          {workspaceName}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </div>

      {/* Search */}
      <div className="px-2 mt-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-transparent hover:bg-sidebar-accent cursor-text transition-colors">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] text-muted-foreground">Cari trade…</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[11px] text-muted-foreground font-medium px-2 py-1 mt-1">
          RUANG KERJA
        </p>

        {TOP_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
              isActive(href)
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* Akun (expandable) */}
        <div>
          <button
            onClick={() => setAccountsOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
              isActive("/accounts")
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Akun</span>
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform duration-150",
                accountsOpen && "rotate-90"
              )}
            />
          </button>

          {accountsOpen && accounts.length > 0 && (
            <div className="ml-5 mt-0.5 space-y-0.5">
              {accounts.map((acc) => (
                <Link
                  key={acc.id}
                  href="/accounts"
                  className="flex items-center gap-2 px-2 py-1 rounded-md text-[12px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: MARKET_DOT_COLORS[acc.marketType] ?? "#9b9a97" }}
                  />
                  <span className="truncate">{acc.name}</span>
                </Link>
              ))}
            </div>
          )}

          {accountsOpen && accounts.length === 0 && (
            <Link
              href="/accounts"
              className="ml-5 flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground hover:text-sidebar-foreground transition-colors"
            >
              + Tambah akun
            </Link>
          )}
        </div>

        <div className="pt-1 border-t border-sidebar-border mt-2" />

        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
              isActive(href)
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
