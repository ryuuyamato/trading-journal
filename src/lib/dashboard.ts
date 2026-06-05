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
      openTime: true,
      closeTime: true,
    },
    orderBy: { closeTime: "asc" },
  });

  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return { totalTrades: 0, winRate: 0, profitFactor: 0, totalNetProfit: 0, equityCurve: [] };
  }

  const winners = trades.filter((t) => (t.netProfit ?? 0) > 0);
  const losers = trades.filter((t) => (t.netProfit ?? 0) < 0);

  const winRate = (winners.length / totalTrades) * 100;
  const grossWin = winners.reduce((s, t) => s + (t.netProfit ?? 0), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + (t.netProfit ?? 0), 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const totalNetProfit = trades.reduce((s, t) => s + (t.netProfit ?? 0), 0);

  // Build equity curve (cumulative profit over time)
  let cumulative = 0;
  const equityCurve = trades.map((t) => {
    cumulative += t.netProfit ?? 0;
    return {
      date: (t.closeTime ?? t.openTime).toISOString().slice(0, 10),
      equity: Math.round(cumulative * 100) / 100,
    };
  });

  return { totalTrades, winRate, profitFactor, totalNetProfit, equityCurve };
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
