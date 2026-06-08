"use client";

import { useRouter } from "next/navigation";
import { PropertyPill } from "@/components/ui/property-pill";
import { TradeRowActions } from "@/components/trades/trade-row-actions";
import { Plus } from "lucide-react";
import { TradeFormDialog } from "@/components/trades/trade-form-dialog";
import { useState } from "react";
import type { AccountOption, TradeListItem } from "@/components/trades/types";

function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "";
  if (currency === "IDR") {
    return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  }
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short" });
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-160">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-[11px] text-muted-foreground font-medium w-48">
              <span className="flex items-center gap-1">
                <span className="opacity-60">Abc</span> Instrumen
              </span>
            </th>
            <th className="text-left py-2 px-3 text-[11px] text-muted-foreground font-medium w-28">
              <span className="flex items-center gap-1">
                <span className="opacity-60">◈</span> Aset
              </span>
            </th>
            <th className="text-left py-2 px-3 text-[11px] text-muted-foreground font-medium w-28">
              <span className="flex items-center gap-1">
                <span className="opacity-60">⊞</span> Mode
              </span>
            </th>
            <th className="text-left py-2 px-3 text-[11px] text-muted-foreground font-medium w-24">
              <span className="flex items-center gap-1">
                <span className="opacity-60">⚑</span> Hasil
              </span>
            </th>
            <th className="text-right py-2 px-3 text-[11px] text-muted-foreground font-medium w-28">
              <span className="flex items-center justify-end gap-1">
                <span className="opacity-60">$</span> P&amp;L
              </span>
            </th>
            <th className="text-right py-2 px-3 text-[11px] text-muted-foreground font-medium w-16">
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
                className="border-b border-border hover:bg-secondary/50 transition-colors group cursor-pointer"
              >
                {/* Instrumen */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground opacity-60">📄</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium">{trade.symbol}</span>
                        <PropertyPill
                          variant={trade.direction === "LONG" ? "profit" : "loss"}
                          label={directionLabel(trade.direction, marketType)}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                        {formatDateRange(trade.openTime, trade.closeTime)}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Aset */}
                <td className="py-2 px-3">
                  <PropertyPill marketType={marketType ?? undefined} />
                </td>

                {/* Mode */}
                <td className="py-2 px-3">
                  <PropertyPill variant="mode" label={modeLabel} />
                </td>

                {/* Hasil */}
                <td className="py-2 px-3">
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
                <td className="py-2 px-3 text-right">
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: isProfit
                        ? "var(--color-profit)"
                        : isLoss
                        ? "var(--color-loss)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {formatPnl(profit, trade.account.currency)}
                  </span>
                </td>

                {/* R */}
                <td className="py-2 px-3 text-right">
                  <span className="text-[13px] text-muted-foreground">
                    {trade.rMultiple !== null ? `${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple}` : "–"}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                  <TradeRowActions trade={trade} accounts={accounts} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* + Baris baru */}
      <div className="border-b border-border">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Plus className="h-3.5 w-3.5" />
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
