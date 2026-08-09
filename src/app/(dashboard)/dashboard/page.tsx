import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { DirectionBreakdown } from "@/components/dashboard/direction-breakdown";
import { WinLossBreakdown } from "@/components/dashboard/win-loss-breakdown";
import { getExchangeRates, toIdr, formatIdr } from "@/lib/exchange-rates";
import { TradeStatus } from "@/generated/prisma/enums";
import { marketDotColor, marketLabel } from "@/lib/market-colors";
import { formatAccountAmount } from "@/lib/utils";

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

  // Compute total saldo = balance (modal ± deposit/withdrawal) + realised net P&L
  // USC accounts store P&L in cents too, so no special handling needed for the sum.
  const pnlRows = await prisma.trade.groupBy({
    by: ["accountId"],
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      status: TradeStatus.CLOSED,
      netProfit: { not: null },
    },
    _sum: { netProfit: true },
  });
  const pnlByAccount = Object.fromEntries(pnlRows.map((r) => [r.accountId, r._sum.netProfit ?? 0]));

  const accountsWithTotal = accounts.map((acc) => ({
    ...acc,
    totalBalance: acc.balance + (pnlByAccount[acc.id] ?? 0),
  }));

  // Grand total in IDR
  let totalIdr: number | null = rates ? 0 : null;
  if (rates) {
    for (const acc of accountsWithTotal) {
      const idr = toIdr(acc.totalBalance, acc.currency, rates);
      if (idr === null) { totalIdr = null; break; }
      totalIdr = (totalIdr ?? 0) + idr;
    }
  }

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

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Semua akun · {monthLabel}
          </p>
        </div>
      </div>

      {/* ── Wallet: capital + realised P&L per account ─────────────────── */}
      {accountsWithTotal.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-secondary/40 px-4 py-2.5">
            <span className="text-[11px] font-medium tracking-wider uppercase">
              Total Saldo Akun
            </span>
            {rates ? (
              <span className="text-[11px] text-muted-foreground">
                1 USD = <span className="num">{formatIdr(rates.usdToIdr)}</span> · kurs {rates.date}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Kurs tidak tersedia</span>
            )}
          </div>
          <div className="divide-y divide-border">
            {accountsWithTotal.map((acc) => {
              const idr = rates ? toIdr(acc.totalBalance, acc.currency, rates) : null;
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-accent/30"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: marketDotColor(acc.marketType) }}
                    />
                    <span className="truncate text-[13px] font-medium">{acc.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {marketLabel(acc.marketType)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <span className="num text-[13px] font-semibold">
                      {formatAccountAmount(acc.totalBalance, acc.currency)}
                    </span>
                    {idr !== null && acc.currency !== "IDR" && (
                      <span className="num w-32 text-right text-[11.5px] text-muted-foreground">
                        {formatIdr(idr)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalIdr !== null && (accountsWithTotal.length > 1 || accountsWithTotal[0]?.currency !== "IDR") && (
            <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2.5">
              <span className="text-[11px] font-medium tracking-wider uppercase">Total (IDR)</span>
              <span className="num text-[14px] font-semibold text-primary">{formatIdr(totalIdr)}</span>
            </div>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
