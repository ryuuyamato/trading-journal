import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { DirectionBreakdown } from "@/components/dashboard/direction-breakdown";
import { WinLossBreakdown } from "@/components/dashboard/win-loss-breakdown";
import { getExchangeRates, toIdr, formatIdr } from "@/lib/exchange-rates";

function MarketTypePill({ type }: { type: string }) {
  const label: Record<string, string> = {
    FOREX: "Forex",
    COMMODITY: "Komoditas",
    STOCK_IDX: "Saham IDX",
    STOCK_US: "Saham US",
    CRYPTO_SPOT: "Crypto Spot",
    CRYPTO_FUTURES: "Crypto Futures",
    MULTI_ASSET: "Multi Aset",
  };
  return (
    <span className="text-[11px] text-muted-foreground">{label[type] ?? type}</span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const now = new Date();
  const monthLabel = now.toLocaleString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  const [stats, heatmap, accounts, rates] = await Promise.all([
    getDashboardStats(userId),
    getCalendarHeatmap(userId),
    prisma.tradingAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, currency: true, balance: true, marketType: true },
      orderBy: { createdAt: "asc" },
    }),
    getExchangeRates(),
  ]);

  const profitTrend =
    stats.totalNetProfit > 0 ? "positive" : stats.totalNetProfit < 0 ? "negative" : "neutral";

  const netPnlStr =
    (stats.totalNetProfit >= 0 ? "+" : "") +
    "$" +
    Math.abs(stats.totalNetProfit).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const streakSubValue =
    stats.currentStreakType === "win"
      ? `Saat ini: ${stats.currentStreak} menang beruntun`
      : stats.currentStreakType === "loss"
      ? `Saat ini: ${stats.currentStreak} kalah beruntun`
      : "Belum ada streak aktif";

  const expectancyStr = stats.avgRMultiple === null ? "–" : `${stats.avgRMultiple >= 0 ? "+" : ""}${stats.avgRMultiple.toFixed(2)}R`;
  const expectancyTrend = stats.avgRMultiple === null ? "neutral" : stats.avgRMultiple >= 0 ? "positive" : "negative";

  const fmtUsd = (v: number) => `$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  // Calculate total balance in IDR
  let totalIdr: number | null = null;
  if (rates) {
    totalIdr = 0;
    for (const acc of accounts) {
      const idr = toIdr(acc.balance, acc.currency, rates);
      if (idr !== null) totalIdr += idr;
      else { totalIdr = null; break; } // unknown currency — can't sum
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-medium">Dashboard</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Semua akun · {monthLabel}
        </p>
      </div>

      {/* Account balances */}
      {accounts.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between gap-4">
            <span className="text-[12px] font-medium">Saldo Akun</span>
            {rates ? (
              <span className="text-[11px] text-muted-foreground">
                1 USD = {formatIdr(rates.usdToIdr)} · kurs {rates.date}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Kurs tidak tersedia</span>
            )}
          </div>
          <div className="divide-y divide-border">
            {accounts.map((acc) => {
              const idr = rates ? toIdr(acc.balance, acc.currency, rates) : null;
              const balanceStr = acc.currency === "IDR"
                ? `Rp ${acc.balance.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                : acc.currency === "USC"
                ? `$${(acc.balance / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <div key={acc.id} className="flex items-center justify-between px-4 py-2.5 gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[13px] font-medium truncate">{acc.name}</span>
                    <MarketTypePill type={acc.marketType} />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] font-medium">{balanceStr}</span>
                    {idr !== null && acc.currency !== "IDR" && (
                      <span className="text-[11.5px] text-muted-foreground">{formatIdr(idr)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalIdr !== null && accounts.length > 1 && (
            <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between">
              <span className="text-[12px] font-medium">Total</span>
              <span className="text-[13px] font-semibold">{formatIdr(totalIdr)}</span>
            </div>
          )}
          {totalIdr !== null && accounts.length === 1 && accounts[0].currency !== "IDR" && (
            <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between">
              <span className="text-[12px] font-medium">Total (IDR)</span>
              <span className="text-[13px] font-semibold">{formatIdr(totalIdr)}</span>
            </div>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard
          label="Win rate"
          value={`${stats.winRate.toFixed(0)}%`}
          subValue={stats.totalTrades > 0 ? `${stats.winCount} menang · ${stats.lossCount} kalah` : undefined}
          trend={stats.winRate >= 50 ? "positive" : "negative"}
        />
        <StatCard
          label="Profit factor"
          value={stats.profitFactor.toFixed(2)}
          trend={stats.profitFactor >= 1 ? "positive" : "negative"}
        />
        <StatCard
          label="Net P&L"
          value={netPnlStr}
          trend={profitTrend}
        />
        <StatCard
          label="Trade"
          value={stats.totalTrades.toString()}
          subValue="trade tertutup"
        />
      </div>

      {/* Secondary metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard
          label="Win streak terpanjang"
          value={stats.longestWinStreak.toString()}
          subValue={stats.totalTrades > 0 ? streakSubValue : undefined}
          trend={stats.longestWinStreak > 0 ? "positive" : "neutral"}
        />
        <StatCard
          label="Ekspektasi (avg R)"
          value={expectancyStr}
          subValue="rata-rata R-multiple"
          trend={expectancyTrend}
        />
        <StatCard
          label="Rata-rata menang"
          value={`+${fmtUsd(stats.avgWin)}`}
          trend={stats.avgWin > 0 ? "positive" : "neutral"}
        />
        <StatCard
          label="Rata-rata kalah"
          value={`-${fmtUsd(stats.avgLoss)}`}
          trend={stats.avgLoss > 0 ? "negative" : "neutral"}
        />
      </div>

      {/* Breakdown widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DirectionBreakdown
          longCount={stats.longCount}
          shortCount={stats.shortCount}
          longWinRate={stats.longWinRate}
          shortWinRate={stats.shortWinRate}
        />
        <WinLossBreakdown
          winCount={stats.winCount}
          lossCount={stats.lossCount}
          avgWin={stats.avgWin}
          avgLoss={stats.avgLoss}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EquityCurve data={stats.equityCurve} />
        <CalendarHeatmap data={heatmap} />
      </div>
    </div>
  );
}
