import { auth } from "@/lib/auth";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";

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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EquityCurve data={stats.equityCurve} />
        <CalendarHeatmap data={heatmap} />
      </div>
    </div>
  );
}
