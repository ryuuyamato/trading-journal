"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { MOBILE_TABS, isNavActive, type NavItem } from "@/components/layout/nav-items";
import { MoreSheet } from "@/components/layout/more-sheet";
import { TradeFormDialog } from "@/components/trades/trade-form-dialog";
import { cn } from "@/lib/utils";
import type { TopBarAccount } from "@/components/layout/app-topbar";

function Tab({
  item,
  active,
  onClick,
}: {
  item: Pick<NavItem, "label"> & { href?: string; icon: NavItem["icon"] };
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const body = (
    <>
      <Icon className="size-[22px]" />
      <span className="max-w-full truncate text-[10px] leading-none">{item.label}</span>
    </>
  );
  const className = cn(
    "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
    active ? "text-primary" : "text-muted-foreground"
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

// Phone navigation, modelled on an exchange app: four destinations around a
// raised primary action. Hidden from md upward, where the icon rail takes over.
export function MobileTabBar({
  accounts,
  isAdmin,
  userName,
  userEmail,
}: {
  accounts: TopBarAccount[];
  isAdmin?: boolean;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);

  const [home, journal, wallet] = MOBILE_TABS;

  return (
    <>
      {/* The safe-area padding sits on the bar itself so the tinted background
          extends into the home-indicator strip rather than leaving a gap. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="relative flex h-14 items-stretch">
          <Tab item={home} active={isNavActive(pathname, home.href)} />
          <Tab item={journal} active={isNavActive(pathname, journal.href)} />

          {/* Holds the slot the raised button floats over. */}
          <div className="flex-1" aria-hidden />

          <Tab item={wallet} active={isNavActive(pathname, wallet.href)} />
          <Tab
            item={{ label: "Lainnya", icon: Menu }}
            active={moreOpen}
            onClick={() => setMoreOpen(true)}
          />

          <button
            type="button"
            onClick={() => setTicketOpen(true)}
            disabled={accounts.length === 0}
            aria-label="Catat trade"
            className="absolute -top-5 left-1/2 flex size-13 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/25 transition-transform active:scale-95 disabled:opacity-40"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
      />

      <TradeFormDialog
        accounts={accounts}
        mode="create"
        open={ticketOpen}
        onOpenChange={setTicketOpen}
      />
    </>
  );
}
