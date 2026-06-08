import type { NormalizedEvent } from "./calendar/normalize";

export type NtdInstrument = "GOLD" | "CRYPTO";
export type NtdSeverity = "avoid" | "caution";

export interface NoTradeReason {
  instrument: NtdInstrument;
  severity: NtdSeverity;
  label: string;
  detail: string;
}

export interface NoTradeDay {
  date: string; // "YYYY-MM-DD" (WIB)
  reasons: NoTradeReason[];
}

const WIB_FMT = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

// Day-of-week in Asia/Jakarta: 0 = Sunday … 6 = Saturday
function wibWeekday(d: Date): number {
  const wib = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  return wib.getDay();
}

function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(WIB_FMT(from) + "T00:00:00Z");
  const end = new Date(WIB_FMT(to) + "T00:00:00Z");
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function isFriday(d: Date): boolean {
  return wibWeekday(d) === 5;
}

function isFirstFridayOfMonth(d: Date): boolean {
  if (!isFriday(d)) return false;
  const day = parseInt(WIB_FMT(d).slice(8, 10), 10);
  return day <= 7;
}

function isLastFridayOfMonth(d: Date): boolean {
  if (!isFriday(d)) return false;
  const dateKey = WIB_FMT(d);
  const [year, month] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, parseInt(dateKey.slice(8, 10), 10) + 7));
  return next.getUTCMonth() + 1 !== month;
}

const STATIC_RULES: { test: (d: Date) => boolean; reasons: NoTradeReason[] }[] = [
  {
    test: (d) => {
      const wd = wibWeekday(d);
      return wd === 0 || wd === 6;
    },
    reasons: [
      {
        instrument: "CRYPTO",
        severity: "caution",
        label: "Akhir pekan",
        detail: "Likuiditas rendah & volume tipis — rawan gap dan sweep saat market ramai dibuka kembali hari Senin.",
      },
    ],
  },
  {
    test: isLastFridayOfMonth,
    reasons: [
      {
        instrument: "CRYPTO",
        severity: "caution",
        label: "Expiry kontrak bulanan",
        detail: "Expiry futures & opsi bulanan BTC/ETH (mis. Deribit) — biasa memicu lonjakan volatilitas menjelang penutupan.",
      },
    ],
  },
  {
    test: isFirstFridayOfMonth,
    reasons: [
      {
        instrument: "GOLD",
        severity: "avoid",
        label: "Non-Farm Payrolls (NFP)",
        detail: "Laporan tenaga kerja AS — biasa memicu lonjakan volatilitas USD & Gold dalam hitungan menit.",
      },
      {
        instrument: "CRYPTO",
        severity: "avoid",
        label: "Non-Farm Payrolls (NFP)",
        detail: "Laporan tenaga kerja AS — pasar crypto ikut bergejolak mengikuti reaksi USD & sentimen risk-on/off.",
      },
    ],
  },
];

interface KeywordRule {
  match: RegExp;
  severity: NtdSeverity;
  label: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  { match: /FOMC|Federal Funds Rate|Interest Rate|Press Conference/i, severity: "avoid", label: "Keputusan Suku Bunga The Fed (FOMC)" },
  { match: /\bCPI\b|\bPPI\b|Inflation/i, severity: "avoid", label: "Data Inflasi (CPI/PPI)" },
  { match: /Non-Farm|Employment Change|Unemployment|Payrolls/i, severity: "avoid", label: "Data Tenaga Kerja AS (NFP)" },
  { match: /\bGDP\b|Retail Sales/i, severity: "caution", label: "Data Ekonomi Penting AS" },
];

function calendarDerivedReasons(events: NormalizedEvent[]): Map<string, NoTradeReason[]> {
  const byDate = new Map<string, NoTradeReason[]>();

  for (const event of events) {
    if (event.impact !== "HIGH") continue;
    if (event.country.toUpperCase() !== "USD") continue;

    const rule = KEYWORD_RULES.find((r) => r.match.test(event.title));
    if (!rule) continue;

    const dateKey = WIB_FMT(event.eventTime);
    const detail = `"${event.title}" (berdampak tinggi pada USD) — terdeteksi otomatis dari Kalender Ekonomi.`;

    const reasons: NoTradeReason[] = [
      { instrument: "GOLD", severity: rule.severity, label: rule.label, detail },
      { instrument: "CRYPTO", severity: rule.severity, label: rule.label, detail },
    ];

    const existing = byDate.get(dateKey) ?? [];
    byDate.set(dateKey, [...existing, ...reasons]);
  }

  return byDate;
}

function dedupeReasons(reasons: NoTradeReason[]): NoTradeReason[] {
  const seen = new Set<string>();
  const result: NoTradeReason[] = [];
  for (const r of reasons) {
    const key = `${r.instrument}|${r.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(r);
  }
  return result;
}

export function getNoTradeDays(events: NormalizedEvent[], from: Date, to: Date): NoTradeDay[] {
  const byDate = new Map<string, NoTradeReason[]>();

  for (const day of eachDay(from, to)) {
    const dateKey = WIB_FMT(day);
    const reasons = STATIC_RULES.filter((rule) => rule.test(day)).flatMap((rule) => rule.reasons);
    if (reasons.length > 0) byDate.set(dateKey, [...(byDate.get(dateKey) ?? []), ...reasons]);
  }

  for (const [dateKey, reasons] of calendarDerivedReasons(events)) {
    byDate.set(dateKey, [...(byDate.get(dateKey) ?? []), ...reasons]);
  }

  return [...byDate.entries()]
    .map(([date, reasons]) => ({ date, reasons: dedupeReasons(reasons) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
