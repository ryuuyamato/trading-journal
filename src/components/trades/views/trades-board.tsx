"use client";

import { useRouter } from "next/navigation";
import { PropertyPill } from "@/components/ui/property-pill";
import { formatCentWithUsd } from "@/lib/utils";
import type { TradeListItem } from "@/components/trades/types";

type ColumnKey = "OPEN" | "PROFIT" | "LOSS" | "BREAK_EVEN";

const COLUMNS: { key: ColumnKey; label: string; dot: string }[] = [
  { key: "OPEN", label: "Open", dot: "bg-blue-400" },
  { key: "PROFIT", label: "Profit", dot: "bg-[var(--color-profit)]" },
  { key: "LOSS", label: "Loss", dot: "bg-[var(--color-loss)]" },
  { key: "BREAK_EVEN", label: "Break Even", dot: "bg-muted-foreground" },
];

function columnFor(trade: TradeListItem): ColumnKey {
  if (trade.status === "OPEN") return "OPEN";
  const p = trade.netProfit ?? null;
  if (p === null) return "BREAK_EVEN";
  if (p > 0) return "PROFIT";
  if (p < 0) return "LOSS";
  return "BREAK_EVEN";
}

function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "";
  if (currency === "IDR") return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  if (currency === "USC") return formatCentWithUsd(Math.abs(v), prefix);
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
}

export function TradesBoard({ trades }: { trades: TradeListItem[] }) {
  const router = useRouter();

  const grouped: Record<ColumnKey, TradeListItem[]> = { OPEN: [], PROFIT: [], LOSS: [], BREAK_EVEN: [] };
  for (const t of trades) grouped[columnFor(t)].push(t);

  return (
    <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {COLUMNS.map((col) => (
        <div key={col.key} className="rounded-xl border border-border bg-secondary/30 flex flex-col min-h-40">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
            <span className="text-[12px] font-medium">{col.label}</span>
            <span className="text-[11px] text-muted-foreground ml-auto">{grouped[col.key].length}</span>
          </div>
          <div className="p-2 space-y-2 flex-1">
            {grouped[col.key].length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6">Tidak ada trade</p>
            )}
            {grouped[col.key].map((trade) => {
              const marketType =
                trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
                  ? trade.tradeMarketType
                  : trade.account.marketType;
              return (
                <button
                  key={trade.id}
                  onClick={() => router.push(`/trades/${trade.id}`)}
                  className="w-full text-left rounded-lg border border-border bg-background p-2.5 space-y-1.5 hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium">{trade.symbol}</span>
                    <PropertyPill marketType={marketType ?? undefined} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{formatDate(trade.openTime)}</span>
                    <span
                      className="text-[12px] font-medium"
                      style={{
                        color:
                          trade.netProfit === null
                            ? "var(--color-muted-foreground)"
                            : trade.netProfit > 0
                            ? "var(--color-profit)"
                            : trade.netProfit < 0
                            ? "var(--color-loss)"
                            : undefined,
                      }}
                    >
                      {formatPnl(trade.netProfit, trade.account.currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
