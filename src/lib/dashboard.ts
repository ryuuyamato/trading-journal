import { prisma } from "@/lib/prisma";
import { TradeStatus } from "@/generated/prisma/enums";

export async function getDashboardStats(userId: string, accountId?: string) {
  const accountFilter = accountId
    ? { accountId }
    : { account: { userId } };

  const trades = await prisma.trade.findMany({
    where: { ...accountFilter, status: TradeStatus.CLOSED },
    select: {
      netProfit: true,
      grossProfit: true,
      rMultiple: true,
      direction: true,
      openTime: true,
      closeTime: true,
    },
    orderBy: { closeTime: "asc" },
  });

  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0, winRate: 0, profitFactor: 0, totalNetProfit: 0, equityCurve: [],
      winCount: 0, lossCount: 0, avgWin: 0, avgLoss: 0, avgRMultiple: null as number | null,
      longCount: 0, shortCount: 0, longWinRate: 0, shortWinRate: 0,
      currentStreak: 0, currentStreakType: "none" as "win" | "loss" | "none", longestWinStreak: 0,
    };
  }

  const winners = trades.filter((t) => (t.netProfit ?? 0) > 0);
  const losers = trades.filter((t) => (t.netProfit ?? 0) < 0);

  const winRate = (winners.length / totalTrades) * 100;
  const grossWin = winners.reduce((s, t) => s + (t.netProfit ?? 0), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + (t.netProfit ?? 0), 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const totalNetProfit = trades.reduce((s, t) => s + (t.netProfit ?? 0), 0);

  const avgWin = winners.length ? grossWin / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;

  const rMultiples = trades.map((t) => t.rMultiple).filter((r): r is number => r != null);
  const avgRMultiple = rMultiples.length ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : null;

  const longTrades = trades.filter((t) => t.direction === "LONG");
  const shortTrades = trades.filter((t) => t.direction === "SHORT");
  const longWins = longTrades.filter((t) => (t.netProfit ?? 0) > 0).length;
  const shortWins = shortTrades.filter((t) => (t.netProfit ?? 0) > 0).length;

  // Win/loss streaks in chronological order — a breakeven trade (netProfit === 0) resets the streak
  let runningStreak = 0;
  let runningType: "win" | "loss" | null = null;
  let longestWinStreak = 0;
  for (const t of trades) {
    const profit = t.netProfit ?? 0;
    if (profit > 0) {
      runningStreak = runningType === "win" ? runningStreak + 1 : 1;
      runningType = "win";
      if (runningStreak > longestWinStreak) longestWinStreak = runningStreak;
    } else if (profit < 0) {
      runningStreak = runningType === "loss" ? runningStreak + 1 : 1;
      runningType = "loss";
    } else {
      runningStreak = 0;
      runningType = null;
    }
  }

  // Build equity curve (cumulative profit over time)
  let cumulative = 0;
  const equityCurve = trades.map((t) => {
    cumulative += t.netProfit ?? 0;
    return {
      date: (t.closeTime ?? t.openTime).toISOString().slice(0, 10),
      equity: Math.round(cumulative * 100) / 100,
    };
  });

  return {
    totalTrades, winRate, profitFactor, totalNetProfit, equityCurve,
    winCount: winners.length, lossCount: losers.length, avgWin, avgLoss, avgRMultiple,
    longCount: longTrades.length, shortCount: shortTrades.length,
    longWinRate: longTrades.length ? (longWins / longTrades.length) * 100 : 0,
    shortWinRate: shortTrades.length ? (shortWins / shortTrades.length) * 100 : 0,
    currentStreak: runningStreak,
    currentStreakType: runningType ?? "none",
    longestWinStreak,
  };
}

export async function getCalendarHeatmap(userId: string, accountId?: string) {
  const accountFilter = accountId
    ? { accountId }
    : { account: { userId } };

  const trades = await prisma.trade.findMany({
    where: { ...accountFilter, status: TradeStatus.CLOSED, closeTime: { not: null } },
    select: { closeTime: true, netProfit: true },
  });

  const map: Record<string, number> = {};
  for (const t of trades) {
    const day = t.closeTime!.toISOString().slice(0, 10);
    map[day] = (map[day] ?? 0) + (t.netProfit ?? 0);
  }
  return map;
}
