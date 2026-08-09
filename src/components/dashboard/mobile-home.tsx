"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, Calendar, Eye, EyeOff, Sparkles, Wallet } from "lucide-react";
import { marketDotColor, marketLabel } from "@/lib/market-colors";
import { formatAccountAmount, formatSignedUsd, cn } from "@/lib/utils";
import { formatIdr } from "@/lib/exchange-rates";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export interface MobileHomeAccount {
  id: string;
  name: string;
  marketType: string;
  currency: string;
  totalBalance: number;
  idrValue: number | null;
}

export interface MobileHomeStats {
  winRate: number;
  profitFactor: number;
  totalNetProfit: number;
  totalTrades: number;
}

const QUICK_ACTIONS = [
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/analitik", label: "Analitik", icon: BarChart2 },
  { href: "/analisis-ai", label: "Analisis AI", icon: Sparkles },
];

// The phone home screen, shaped like an exchange app's: balance first and
// large, then the day's result, then shortcuts. The desktop dashboard keeps its
// own denser grid — this renders only below md.
export function MobileHome({
  accounts,
  totalIdr,
  todayNetProfit,
  todayTradeCount,
  stats,
}: {
  accounts: MobileHomeAccount[];
  totalIdr: number | null;
  todayNetProfit: number;
  todayTradeCount: number;
  stats: MobileHomeStats;
}) {
  // Balances stay hidden until asked for — the same courtesy an exchange app
  // gives you when the screen might be overlooked in public.
  const [hidden, setHidden] = useState(false);
  const mask = (value: string) => (hidden ? "••••••" : value);

  const todayTone =
    todayTradeCount === 0
      ? "text-muted-foreground"
      : todayNetProfit > 0
      ? "text-profit"
      : todayNetProfit < 0
      ? "text-loss"
      : "text-foreground";

  return (
    <div className="space-y-4 md:hidden">
      <InstallPrompt />

      {/* ── Balance ──────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] tracking-wider text-muted-foreground uppercase"
          aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
        >
          Total Saldo
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>

        <p className="num mt-1.5 text-[26px] leading-none font-semibold">
          {totalIdr === null ? "–" : mask(formatIdr(totalIdr))}
        </p>

        <div className="mt-3 flex items-baseline gap-2 border-t border-border pt-3">
          <span className="text-[11.5px] text-muted-foreground">P&amp;L hari ini</span>
          <span className={cn("num text-[14px] font-semibold", todayTone)}>
            {todayTradeCount === 0 ? "–" : mask(formatSignedUsd(todayNetProfit))}
          </span>
          {todayTradeCount > 0 && (
            <span className="num ml-auto text-[11px] text-muted-foreground">
              {todayTradeCount} trade
            </span>
          )}
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-muted-foreground transition-colors active:bg-accent"
          >
            <Icon className="size-5 text-primary" />
            <span className="text-[10.5px] leading-none">{label}</span>
          </Link>
        ))}
      </section>

      {/* ── Headline stats ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-2">
        <Stat label="Win rate" value={`${stats.winRate.toFixed(0)}%`} />
        <Stat label="Profit factor" value={stats.profitFactor.toFixed(2)} />
        <Stat
          label="Net P&L"
          value={mask(formatSignedUsd(stats.totalNetProfit))}
          tone={
            stats.totalNetProfit > 0 ? "profit" : stats.totalNetProfit < 0 ? "loss" : undefined
          }
        />
        <Stat label="Trade tertutup" value={String(stats.totalTrades)} />
      </section>

      {/* ── Wallets ──────────────────────────────────────────────────── */}
      {accounts.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Akun
            </h2>
            <Link href="/accounts" className="text-[11.5px] text-brand-ink">
              Lihat semua
            </Link>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {accounts.map((acc) => (
              <li key={acc.id}>
                <Link
                  href={`/accounts/${acc.id}`}
                  className="flex min-h-14 items-center gap-3 px-3 py-2.5 transition-colors active:bg-accent/50"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: marketDotColor(acc.marketType) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{acc.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {marketLabel(acc.marketType)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[13.5px] font-semibold">
                      {mask(formatAccountAmount(acc.totalBalance, acc.currency))}
                    </p>
                    {acc.idrValue !== null && acc.currency !== "IDR" && (
                      <p className="num mt-0.5 text-[10.5px] text-muted-foreground">
                        {mask(formatIdr(acc.idrValue))}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[10.5px] tracking-wider text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "num mt-1 text-[17px] leading-none font-semibold",
          tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
