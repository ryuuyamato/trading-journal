"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Plus, Settings, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TradeFormDialog } from "@/components/trades/trade-form-dialog";
import { marketDotColor, marketLabel } from "@/lib/market-colors";
import { cn, formatAccountAmount, formatSignedUsd } from "@/lib/utils";

export interface TopBarAccount {
  id: string;
  name: string;
  marketType: string;
  currency: string;
  totalBalance: number;
}

interface AppTopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  accounts: TopBarAccount[];
  todayNetProfit: number;
  todayTradeCount: number;
}

export function AppTopBar({
  userName,
  userEmail,
  accounts,
  todayNetProfit,
  todayTradeCount,
}: AppTopBarProps) {
  const [ticketOpen, setTicketOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const pnlTone =
    todayTradeCount === 0
      ? "text-muted-foreground"
      : todayNetProfit > 0
      ? "text-profit"
      : todayNetProfit < 0
      ? "text-loss"
      : "text-foreground";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-sidebar px-3">
      {/* Brand */}
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded bg-primary text-[13px] font-bold text-primary-foreground">
          T
        </span>
        <span className="hidden text-[13px] font-semibold tracking-tight sm:block">
          TradeJournal
        </span>
      </Link>

      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

      {/* Account jump list — navigates to an account, it does not filter the
          current page. Labelled "Akun" rather than a filter chip so it doesn't
          imply a scope it doesn't apply. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-1.5 px-2" />}
        >
          <Wallet className="size-3.5 text-muted-foreground" />
          <span className="hidden text-[12px] sm:block">
            {accounts.length > 0 ? `${accounts.length} akun` : "Akun"}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {accounts.length === 0 ? (
            <DropdownMenuItem render={<Link href="/accounts" />}>
              + Tambah akun pertama
            </DropdownMenuItem>
          ) : (
            accounts.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                render={<Link href={`/accounts/${acc.id}`} />}
                className="gap-2"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: marketDotColor(acc.marketType) }}
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="block truncate text-[12.5px]">{acc.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {marketLabel(acc.marketType)}
                  </span>
                </span>
                <span className="num shrink-0 text-[11.5px] text-muted-foreground">
                  {formatAccountAmount(acc.totalBalance, acc.currency)}
                </span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/accounts" />}>
            Kelola semua akun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Today's realised P&L */}
      <div className="hidden items-baseline gap-1.5 rounded bg-secondary px-2.5 py-1 md:flex">
        <span className="text-[11px] text-muted-foreground">P&amp;L hari ini</span>
        <span className={cn("num text-[12.5px] font-semibold", pnlTone)}>
          {todayTradeCount === 0 ? "–" : formatSignedUsd(todayNetProfit)}
        </span>
      </div>

      <div className="flex-1" />

      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => setTicketOpen(true)}
        disabled={accounts.length === 0}
        title={accounts.length === 0 ? "Tambah akun dulu sebelum mencatat trade" : undefined}
      >
        <Plus className="size-3.5" />
        <span className="hidden sm:block">Trade</span>
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Menu akun pengguna" />}
        >
          <Avatar className="size-6">
            <AvatarFallback className="bg-accent text-[10px] font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2.5 py-2">
            <p className="truncate text-[12.5px] font-medium">{userName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/settings" />} className="gap-2">
            <Settings className="size-3.5" />
            Setelan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-3.5" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controlled ticket: rendering it here makes "catat trade" reachable
          from every screen, not just the journal. */}
      <TradeFormDialog
        accounts={accounts}
        mode="create"
        open={ticketOpen}
        onOpenChange={setTicketOpen}
      />
    </header>
  );
}
