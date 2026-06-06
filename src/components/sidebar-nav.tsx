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
  Calendar,
  ChevronDown,
  Search,
  ChevronRight,
  Menu,
  X,
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
  { href: "/dashboard", label: "Dashboard",          icon: LayoutDashboard },
  { href: "/trades",    label: "Jurnal",              icon: BookOpen },
  { href: "/calendar",  label: "Kalender Ekonomi",    icon: Calendar },
];

const BOTTOM_NAV = [
  { href: "/playbook", label: "Playbook",  icon: Library },
  { href: "/analitik", label: "Analitik",  icon: BarChart2 },
  { href: "/review",   label: "Review",    icon: ClipboardList },
];

export function SidebarNav({ userName, accounts }: SidebarNavProps) {
  const pathname = usePathname();
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const initial = (userName ?? "T").charAt(0).toUpperCase();
  const workspaceName = userName ? `${userName}'s Trading` : "Trading Journal";

  const sidebarContent = (
    <>
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
            onClick={() => setMobileOpen(false)}
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
                  onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-[14px] font-medium truncate flex-1">{workspaceName}</span>
      </header>

      {/* ── Mobile backdrop ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden",
          // Mobile: fixed overlay, slide in/out
          "fixed top-0 left-0 h-screen w-65 z-50 transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static in flex layout
          "md:relative md:translate-x-0 md:w-45.5 md:h-screen md:shrink-0"
        )}
      >
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-3 right-3 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}
