import { auth } from "@/lib/auth";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { DirectionBreakdown } from "@/components/dashboard/direction-breakdown";
import { WinLossBreakdown } from "@/components/dashboard/win-loss-breakdown";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const now = new Date();
  const monthLabel = now.toLocaleString("id-ID", { month: "long", year: "numeric" });

  const [stats, heatmap] = await Promise.all([
    getDashboardStats(userId),
    getCalendarHeatmap(userId),
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

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-medium">Dashboard</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Semua akun · {monthLabel}
        </p>
      </div>

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
