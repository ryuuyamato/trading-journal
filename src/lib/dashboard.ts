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
      account: { select: { currency: true } },
    },
    orderBy: { closeTime: "asc" },
  });

  // When blending trades across accounts, normalize P&L to USD-equivalent so the totals stay
  // meaningful — e.g. a "USC" account stores values in cents (100 cent = 1 USD, see
  // formatCentWithUsd), so its raw numbers are ~100x larger than a USD/USDT account's.
  // For a single account (accountId given), keep raw native-currency values — the caller
  // formats those with its own currency-aware logic (e.g. account detail page).
  const pnl = (t: (typeof trades)[number]) => {
    const amount = t.netProfit ?? 0;
    if (accountId) return amount;
    return t.account.currency === "USC" ? amount / 100 : amount;
  };

  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0, winRate: 0, profitFactor: 0, totalNetProfit: 0, equityCurve: [],
      winCount: 0, lossCount: 0, avgWin: 0, avgLoss: 0, avgRMultiple: null as number | null,
      longCount: 0, shortCount: 0, longWinRate: 0, shortWinRate: 0,
      currentStreak: 0, currentStreakType: "none" as "win" | "loss" | "none", longestWinStreak: 0,
    };
  }

  const winners = trades.filter((t) => pnl(t) > 0);
  const losers = trades.filter((t) => pnl(t) < 0);

  const winRate = (winners.length / totalTrades) * 100;
  const grossWin = winners.reduce((s, t) => s + pnl(t), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + pnl(t), 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const totalNetProfit = trades.reduce((s, t) => s + pnl(t), 0);

  const avgWin = winners.length ? grossWin / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;

  const rMultiples = trades.map((t) => t.rMultiple).filter((r): r is number => r != null);
  const avgRMultiple = rMultiples.length ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : null;

  const longTrades = trades.filter((t) => t.direction === "LONG");
  const shortTrades = trades.filter((t) => t.direction === "SHORT");
  const longWins = longTrades.filter((t) => pnl(t) > 0).length;
  const shortWins = shortTrades.filter((t) => pnl(t) > 0).length;

  // Win/loss streaks in chronological order — a breakeven trade (netProfit === 0) resets the streak
  let runningStreak = 0;
  let runningType: "win" | "loss" | null = null;
  let longestWinStreak = 0;
  for (const t of trades) {
    const profit = pnl(t);
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
    cumulative += pnl(t);
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

// Current balance per account = modal (account.balance, adjusted by deposits/withdrawals)
// + cumulative net P&L from closed trades. Returns a map of accountId -> closed-trade P&L sum
// (in the account's own native currency/units) so callers can add it to `account.balance`.
export async function getAccountNetProfitMap(accountIds: string[]) {
  if (accountIds.length === 0) return new Map<string, number>();

  const sums = await prisma.trade.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accountIds }, status: TradeStatus.CLOSED },
    _sum: { netProfit: true },
  });

  return new Map(sums.map((s) => [s.accountId, s._sum.netProfit ?? 0]));
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
