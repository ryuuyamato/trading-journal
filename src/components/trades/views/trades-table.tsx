"use client";

import { useRouter } from "next/navigation";
import { PropertyPill } from "@/components/ui/property-pill";
import { TradeRowActions } from "@/components/trades/trade-row-actions";
import { Plus } from "lucide-react";
import { TradeFormDialog } from "@/components/trades/trade-form-dialog";
import { useState } from "react";
import type { AccountOption, TradeListItem } from "@/components/trades/types";
import { cn, formatCentWithUsd } from "@/lib/utils";

function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "";
  if (currency === "IDR") {
    return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  }
  if (currency === "USC") return formatCentWithUsd(Math.abs(v), prefix);
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
}

function formatDateRange(openTime: string, closeTime: string | null) {
  const open = formatDate(openTime);
  return closeTime ? `${open} → ${formatDate(closeTime)}` : open;
}

function directionLabel(direction: string, marketType: string | null) {
  const isCrypto = marketType === "CRYPTO_SPOT" || marketType === "CRYPTO_FUTURES";
  if (isCrypto) return direction === "LONG" ? "Long" : "Short";
  return direction === "LONG" ? "Buy" : "Sell";
}

export function TradesTable({ trades, accounts }: { trades: TradeListItem[]; accounts: AccountOption[] }) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-160 border-collapse">
        <thead>
          {/* Header sits one tone above the rows, like an exchange order book. */}
          <tr className="border-b border-border bg-secondary/50">
            <th className="w-48 px-3 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              Instrumen
            </th>
            <th className="w-28 px-3 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              Aset
            </th>
            <th className="w-28 px-3 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              Mode
            </th>
            <th className="w-24 px-3 py-2 text-left text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              Hasil
            </th>
            <th className="w-28 px-3 py-2 text-right text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              P&amp;L
            </th>
            <th className="w-16 px-3 py-2 text-right text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
              R
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const profit = trade.netProfit ?? null;
            const isProfit = profit !== null && profit > 0;
            const isLoss = profit !== null && profit < 0;
            const modeLabel =
              trade.entryMode === "MULTI_LAYER"
                ? `Multi · ${trade.layerCount ?? "?"}`
                : "Single";
            const marketType =
              trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
                ? trade.tradeMarketType
                : trade.account.marketType;

            return (
              <tr
                key={trade.id}
                onClick={() => router.push(`/trades/${trade.id}`)}
                className="group cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-accent/40"
              >
                {/* Instrumen — a direction stripe on the row edge makes long/short
                    scannable down the column without reading each pill. */}
                <td className="relative px-3 py-1.5">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 w-0.5",
                      trade.direction === "LONG" ? "bg-profit" : "bg-loss"
                    )}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="num text-[13px] font-semibold">{trade.symbol}</span>
                    <PropertyPill
                      variant={trade.direction === "LONG" ? "profit" : "loss"}
                      label={directionLabel(trade.direction, marketType)}
                    />
                  </div>
                  <p className="num mt-0.5 text-[11px] leading-none text-muted-foreground">
                    {formatDateRange(trade.openTime, trade.closeTime)}
                  </p>
                </td>

                {/* Aset */}
                <td className="px-3 py-1.5">
                  <PropertyPill marketType={marketType ?? undefined} />
                </td>

                {/* Mode */}
                <td className="px-3 py-1.5">
                  <PropertyPill variant="mode" label={modeLabel} />
                </td>

                {/* Hasil */}
                <td className="px-3 py-1.5">
                  {trade.status === "OPEN" ? (
                    <PropertyPill variant="neutral" label="Open" />
                  ) : profit === null ? (
                    <span className="text-[12px] text-muted-foreground">–</span>
                  ) : isProfit ? (
                    <PropertyPill variant="profit" label="Profit" />
                  ) : isLoss ? (
                    <PropertyPill variant="loss" label="Loss" />
                  ) : (
                    <PropertyPill variant="neutral" label="BE" />
                  )}
                </td>

                {/* P&L */}
                <td className="px-3 py-1.5 text-right">
                  <span
                    className={cn(
                      "num text-[13px] font-semibold",
                      isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                    )}
                  >
                    {formatPnl(profit, trade.account.currency)}
                  </span>
                </td>

                {/* R */}
                <td className="px-3 py-1.5 text-right">
                  <span className="num text-[13px] text-muted-foreground">
                    {trade.rMultiple !== null ? `${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple}` : "–"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <TradeRowActions trade={trade} accounts={accounts} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* + Baris baru */}
      <div className="border-t border-border">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Baris baru
        </button>
      </div>
      {accounts.length > 0 && (
        <TradeFormDialog accounts={accounts} mode="create" open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      )}

      {trades.length === 0 && (
        <div className="py-16 text-center text-[13px] text-muted-foreground">
          Belum ada trade. Klik &ldquo;+ Baris baru&rdquo; untuk mulai mencatat.
        </div>
      )}
    </div>
  );
}
