import { prisma } from "@/lib/prisma";

export const MONTHLY_ANALYSIS_LIMIT = 3;

const WIB_FMT = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "YYYY-MM" key for the WIB calendar month containing `d` (defaults to now). */
export function currentPeriodKey(d: Date = new Date()): string {
  return WIB_FMT(d).slice(0, 7);
}

/** "YYYY-MM" -> "Juni 2026" */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "YYYY-MM" -> start/end of that WIB calendar month, expressed as UTC instants. */
export function periodRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split("-").map(Number);
  // WIB = UTC+7, so WIB midnight on day 1 is 17:00 UTC the previous day.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  return { start, end };
}

/** "YYYY-MM" -> "1 Juli 2026" (first day of the following WIB month). */
export function nextResetLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `1 ${MONTH_NAMES[next.m - 1]} ${next.y}`;
}

export interface AnalysisQuota {
  period: string;
  used: number;
  remaining: number;
  limit: number;
}

export async function getAnalysisQuota(accountId: string): Promise<AnalysisQuota> {
  const period = currentPeriodKey();
  const used = await prisma.tradeAnalysisReport.count({ where: { accountId, period } });
  return { period, used, remaining: Math.max(0, MONTHLY_ANALYSIS_LIMIT - used), limit: MONTHLY_ANALYSIS_LIMIT };
}
