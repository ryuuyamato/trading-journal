"use client";

import Link from "next/link";
import { PropertyPill } from "@/components/ui/property-pill";
import { TradeRowActions } from "@/components/trades/trade-row-actions";
import type { AccountOption, TradeListItem } from "@/components/trades/types";
import {
  directionLabel,
  effectiveMarketType,
  formatDateRange,
  formatPnl,
} from "@/components/trades/format";
import { cn } from "@/lib/utils";

// The phone view of the journal. The desktop table needs 640px of width to show
// its six columns; rather than making a phone scroll sideways to reach the P&L,
// each trade becomes a full-width row with the two facts that matter — what it
// was and what it made — on one line.
export function TradesListMobile({
  trades,
  accounts,
}: {
  trades: TradeListItem[];
  accounts: AccountOption[];
}) {
  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-[13px] text-muted-foreground">
        Belum ada trade. Ketuk tombol <span className="text-primary">+</span> untuk mulai mencatat.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {trades.map((trade) => {
        const profit = trade.netProfit ?? null;
        const isProfit = profit !== null && profit > 0;
        const isLoss = profit !== null && profit < 0;
        const marketType = effectiveMarketType(trade);
        const isOpen = trade.status === "OPEN";

        return (
          <li key={trade.id} className="relative">
            <Link
              href={`/trades/${trade.id}`}
              className="flex min-h-16 items-center gap-3 py-2.5 pr-11 pl-3 transition-colors active:bg-accent/50"
            >
              {/* Direction stripe, same device the desktop table uses. */}
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-0.5",
                  trade.direction === "LONG" ? "bg-profit" : "bg-loss"
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="num truncate text-[14px] font-semibold">{trade.symbol}</span>
                  <PropertyPill
                    variant={trade.direction === "LONG" ? "profit" : "loss"}
                    label={directionLabel(trade.direction, marketType)}
                  />
                  {isOpen && <PropertyPill variant="neutral" label="Open" />}
                </div>
                <p className="num mt-1 truncate text-[11.5px] text-muted-foreground">
                  {formatDateRange(trade.openTime, trade.closeTime)}
                  {trade.account?.name ? ` · ${trade.account.name}` : ""}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "num text-[14px] font-semibold",
                    isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                  )}
                >
                  {isOpen ? "–" : formatPnl(profit, trade.account.currency)}
                </p>
                {trade.rMultiple !== null && (
                  <p className="num mt-0.5 text-[11px] text-muted-foreground">
                    {trade.rMultiple > 0 ? "+" : ""}
                    {trade.rMultiple}R
                  </p>
                )}
              </div>
            </Link>

            {/* Sits above the link rather than inside it, so opening the row
                menu never also navigates to the trade. */}
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <TradeRowActions trade={trade} accounts={accounts} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
