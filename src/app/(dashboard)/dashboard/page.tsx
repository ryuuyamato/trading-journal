import { auth } from "@/lib/auth";
import { getDashboardStats, getCalendarHeatmap } from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { TrendingUp, TrendingDown, Activity, BarChart2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [stats, heatmap] = await Promise.all([
    getDashboardStats(userId),
    getCalendarHeatmap(userId),
  ]);

  const profitTrend =
    stats.totalNetProfit > 0
      ? "positive"
      : stats.totalNetProfit < 0
      ? "negative"
      : "neutral";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan performa trading Anda</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Profit/Loss"
          value={stats.totalNetProfit.toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          icon={stats.totalNetProfit >= 0 ? TrendingUp : TrendingDown}
          trend={profitTrend}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subValue={`${stats.totalTrades} trade`}
          icon={Activity}
          trend={stats.winRate >= 50 ? "positive" : "negative"}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          icon={BarChart2}
          trend={stats.profitFactor >= 1 ? "positive" : "negative"}
        />
        <StatCard
          label="Total Trade"
          value={stats.totalTrades.toString()}
          subValue="trade tertutup"
          icon={Activity}
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
