import { prisma } from "@/lib/prisma";
import { MONTHLY_ANALYSIS_LIMIT, PRICE_PER_TOKEN_IDR } from "@/lib/analysis/constants";
export { MONTHLY_ANALYSIS_LIMIT, PRICE_PER_TOKEN_IDR };

const WIB_FMT = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function currentPeriodKey(d: Date = new Date()): string {
  return WIB_FMT(d).slice(0, 7);
}

export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function periodRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  return { start, end };
}

export function nextResetLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `1 ${MONTH_NAMES[next.m - 1]} ${next.y}`;
}

export interface AnalysisQuota {
  period: string;
  freeUsed: number;
  freeRemaining: number;
  freeLimit: number;
  purchasedBalance: number;
  remaining: number;
}

/** Quota is per-user (shared wallet across all trading accounts). */
export async function getAnalysisQuota(userId: string): Promise<AnalysisQuota> {
  const period = currentPeriodKey();
  const [freeUsed, approvedAgg, purchasedUsed] = await Promise.all([
    prisma.tradeAnalysisReport.count({ where: { userId, period, tokenSource: "FREE" } }),
    prisma.tokenPurchase.aggregate({ where: { userId, status: "APPROVED" }, _sum: { quantity: true } }),
    prisma.tradeAnalysisReport.count({ where: { userId, tokenSource: "PURCHASED" } }),
  ]);
  const freeRemaining = Math.max(0, MONTHLY_ANALYSIS_LIMIT - freeUsed);
  const purchasedBalance = Math.max(0, (approvedAgg._sum.quantity ?? 0) - purchasedUsed);
  return {
    period,
    freeUsed,
    freeRemaining,
    freeLimit: MONTHLY_ANALYSIS_LIMIT,
    purchasedBalance,
    remaining: freeRemaining + purchasedBalance,
  };
}

export interface TokenLedgerEntry {
  granted: number;
  used: number;
  balance: number;
}

/**
 * Saldo token berbayar untuk semua pengguna sekaligus — dipakai halaman admin.
 *
 * Rumusnya sama persis dengan getAnalysisQuota(), hanya dikerjakan borongan
 * lewat dua groupBy supaya tidak menembak database sekali per pengguna.
 */
export async function getPurchasedTokenLedger(): Promise<Map<string, TokenLedgerEntry>> {
  const [grants, used] = await Promise.all([
    prisma.tokenPurchase.groupBy({
      by: ["userId"],
      where: { status: "APPROVED" },
      _sum: { quantity: true },
    }),
    prisma.tradeAnalysisReport.groupBy({
      by: ["userId"],
      where: { tokenSource: "PURCHASED" },
      _count: { _all: true },
    }),
  ]);

  const usedByUser = new Map(used.map((r) => [r.userId, r._count._all]));
  const ledger = new Map<string, TokenLedgerEntry>();

  for (const g of grants) {
    const granted = g._sum.quantity ?? 0;
    const spent = usedByUser.get(g.userId) ?? 0;
    ledger.set(g.userId, { granted, used: spent, balance: Math.max(0, granted - spent) });
  }
  // Pengguna yang memakai token tanpa punya baris APPROVED tidak seharusnya ada,
  // tapi kalau terjadi ia tetap ditampilkan supaya anomalinya kelihatan.
  for (const [userId, spent] of usedByUser) {
    if (!ledger.has(userId)) ledger.set(userId, { granted: 0, used: spent, balance: 0 });
  }

  return ledger;
}
