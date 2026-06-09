import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { TradeStatus } from "@/generated/prisma/enums";
import { periodLabel, periodRange, nextResetLabel, getAnalysisQuota } from "@/lib/analysis/quota";
import { generateTradeReport, type TradeReportStats, type TradeReportTradeRow } from "@/lib/analysis/trade-report";

const MAX_TRADES_IN_PROMPT = 60;

interface MonthlyTradeRow {
  symbol: string;
  direction: string;
  openTime: Date;
  closeTime: Date | null;
  netProfit: number | null;
  rMultiple: number | null;
  setup: string | null;
  notes: string | null;
}

function computeMonthlyStats(trades: MonthlyTradeRow[]): TradeReportStats {
  const totalTrades = trades.length;
  const pnl = (t: MonthlyTradeRow) => t.netProfit ?? 0;

  const winners = trades.filter((t) => pnl(t) > 0);
  const losers = trades.filter((t) => pnl(t) < 0);

  const winRate = totalTrades ? (winners.length / totalTrades) * 100 : 0;
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

  return {
    totalTrades, winRate, profitFactor, totalNetProfit, avgWin, avgLoss, avgRMultiple,
    longCount: longTrades.length, shortCount: shortTrades.length,
    longWinRate: longTrades.length ? (longWins / longTrades.length) * 100 : 0,
    shortWinRate: shortTrades.length ? (shortWins / shortTrades.length) * 100 : 0,
    currentStreak: runningStreak, currentStreakType: runningType ?? "none", longestWinStreak,
  };
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: accountId } = await params;
  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId: session.user.id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  // Quota is per-user (shared across all accounts)
  const quota = await getAnalysisQuota(session.user.id);
  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error: `Token analisis Anda sudah habis (gratis ${quota.freeUsed}/${quota.freeLimit} bulan ini, saldo terbeli 0). Beli token tambahan atau tunggu reset ${nextResetLabel(quota.period)}.`,
      },
      { status: 429 },
    );
  }

  const tokenSource: "FREE" | "PURCHASED" = quota.freeRemaining > 0 ? "FREE" : "PURCHASED";

  const { start, end } = periodRange(quota.period);
  const trades = await prisma.trade.findMany({
    where: { accountId, status: TradeStatus.CLOSED, closeTime: { gte: start, lt: end } },
    select: {
      symbol: true, direction: true, openTime: true, closeTime: true,
      netProfit: true, rMultiple: true, setup: true, notes: true,
    },
    orderBy: { closeTime: "asc" },
  });

  if (trades.length === 0) {
    return NextResponse.json(
      { error: "Belum ada trade yang closed bulan ini — analisis butuh data trading untuk dianalisis." },
      { status: 400 },
    );
  }

  const stats = computeMonthlyStats(trades);

  const tradeRows: TradeReportTradeRow[] = trades
    .slice(-MAX_TRADES_IN_PROMPT)
    .reverse()
    .map((t) => ({
      symbol: t.symbol,
      direction: t.direction,
      closeDate: (t.closeTime ?? t.openTime).toISOString().slice(0, 10),
      netProfit: t.netProfit,
      rMultiple: t.rMultiple,
      setup: t.setup,
      notes: t.notes,
    }));

  let result;
  try {
    result = await generateTradeReport({
      accountName: account.name,
      marketType: account.marketType,
      currency: account.currency,
      periodLabel: periodLabel(quota.period),
      stats,
      trades: tradeRows,
    });
  } catch (err) {
    console.error("[analysis] generateTradeReport failed:", err);
    return NextResponse.json(
      { error: "Gagal membuat analisis AI. Coba lagi beberapa saat lagi." },
      { status: 502 },
    );
  }

  const report = await prisma.tradeAnalysisReport.create({
    data: {
      userId: session.user.id,
      accountId,
      period: quota.period,
      headline: result.headline,
      content: result.content as unknown as Prisma.InputJsonValue,
      statsSnapshot: stats as unknown as Prisma.InputJsonValue,
      tokenSource,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
