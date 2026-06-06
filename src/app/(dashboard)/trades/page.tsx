import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTradeDialog } from "@/components/trades/new-trade-dialog";
import { PropertyPill } from "@/components/ui/property-pill";
import { SlidersHorizontal, ArrowUpDown, Plus } from "lucide-react";

function formatPnl(v: number | null, currency = "USD") {
  if (v === null) return "–";
  const prefix = v >= 0 ? "+" : "";
  if (currency === "IDR") {
    return `${prefix}Rp ${Math.abs(v).toLocaleString("id-ID")}`;
  }
  return `${prefix}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short" });
}

export default async function TradesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [accounts, trades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, marketType: true, currency: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.trade.findMany({
      where: { account: { userId } },
      include: {
        account: { select: { marketType: true, currency: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { openTime: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="max-w-5xl space-y-0">
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-medium">Jurnal</h1>
      </div>

      {/* View tabs + actions */}
      <div className="flex items-center justify-between border-b border-border pb-0">
        <div className="flex gap-0">
          {["Tabel", "Board", "Kalender", "Galeri"].map((tab, i) => (
            <button
              key={tab}
              className={
                i === 0
                  ? "px-3 py-2 text-[13px] font-medium text-foreground border-b-2 border-foreground -mb-px"
                  : "px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-1">
          <button className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Urut
          </button>
          <NewTradeDialog accounts={accounts} />
        </div>
      </div>

      {/* Table */}
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

              return (
                <tr
                  key={trade.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors group cursor-default"
                >
                  {/* Instrumen */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground opacity-60">📄</span>
                      <div>
                        <span className="text-[13px] font-medium">{trade.symbol}</span>
                        <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                          {formatDate(trade.openTime)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Aset */}
                  <td className="py-2 px-3">
                    <PropertyPill
                      marketType={
                        trade.account.marketType === "MULTI_ASSET" && trade.tradeMarketType
                          ? trade.tradeMarketType
                          : trade.account.marketType
                      }
                    />
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
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* + Baris baru */}
        <div className="border-b border-border">
          <button className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors w-full">
            <Plus className="h-3.5 w-3.5" />
            Baris baru
          </button>
        </div>

        {trades.length === 0 && (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            Belum ada trade. Klik &ldquo;+ Baris baru&rdquo; untuk mulai mencatat.
          </div>
        )}
      </div>
    </div>
  );
}
