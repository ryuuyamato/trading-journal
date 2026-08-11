import { prisma } from "@/lib/prisma";
import { TradeStatus } from "@/generated/prisma/enums";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Semua angka pembanding di halaman Analitik memakai R-multiple, bukan nominal.
 *
 * Alasannya dua. Pertama, netProfit terikat mata uang masing-masing akun (USD,
 * USDT, IDR) — menjumlahkannya lintas akun mencampur satuan dan menghasilkan
 * angka yang tidak berarti. Kedua, membandingkan setup lewat nominal dikacaukan
 * ukuran posisi: setup yang dipakai dengan lot besar akan selalu menang meski
 * ekspektansinya lebih buruk. R menormalkan keduanya.
 */
export interface Breakdown {
  key: string;
  label: string;
  /** Hanya untuk titik identitas di samping label (warna tag), bukan isi bar. */
  color?: string | null;
  trades: number;
  wins: number;
  winRate: number;
  /** Rata-rata R. null kalau tidak ada satu pun trade di grup ini yang punya R. */
  expectancyR: number | null;
  totalR: number | null;
  /** Berapa dari `trades` yang benar-benar punya rMultiple. */
  rCoverage: number;
}

export interface RHistogramBin {
  label: string;
  from: number | null;
  to: number | null;
  count: number;
  negative: boolean;
}

export interface SequenceStat {
  trades: number;
  winRate: number;
  expectancyR: number | null;
  avgRiskPercent: number | null;
}

export interface AnalyticsResult {
  totalTrades: number;
  rCoverage: number;
  winRate: number;
  expectancyR: number | null;
  profitFactorR: number | null;
  maxDrawdownR: number | null;
  avgHoldingMinutes: number | null;
  /** Nominal hanya terisi kalau satu akun dipilih — di luar itu satuannya campur. */
  netProfit: number | null;
  currency: string | null;

  bySetup: Breakdown[];
  bySymbol: Breakdown[];
  bySession: Breakdown[];
  byWeekday: Breakdown[];
  byTag: Breakdown[];
  byEmotion: Breakdown[];

  rHistogram: RHistogramBin[];
  afterWin: SequenceStat;
  afterLoss: SequenceStat;
}

interface TradeRow {
  symbol: string;
  openTime: Date;
  closeTime: Date | null;
  netProfit: number | null;
  rMultiple: number | null;
  riskPercent: number | null;
  holdingMinutes: number | null;
  setup: string | null;
  emotionBefore: number | null;
  tags: { tag: { id: string; name: string; color: string } }[];
}

const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const EMOTION_LABELS: Record<number, string> = {
  1: "Buruk",
  2: "Ragu",
  3: "Netral",
  4: "Yakin",
  5: "Sangat yakin",
};

/** Jam buka posisi dalam WIB — dasar pengelompokan sesi dan hari. */
function wibHour(d: Date): number {
  return new Date(d.getTime() + WIB_OFFSET_MS).getUTCHours();
}

function wibWeekday(d: Date): number {
  return new Date(d.getTime() + WIB_OFFSET_MS).getUTCDay();
}

/**
 * Sesi pasar dalam WIB. Batasnya disederhanakan tapi menutup 24 jam penuh, jadi
 * tidak ada trade yang jatuh di luar kelompok mana pun.
 */
function sessionOf(d: Date): { key: string; label: string } {
  const h = wibHour(d);
  if (h >= 5 && h < 14) return { key: "asia", label: "Asia (05–14 WIB)" };
  if (h >= 14 && h < 20) return { key: "london", label: "London (14–20 WIB)" };
  return { key: "ny", label: "New York (20–05 WIB)" };
}

function summarise(rows: TradeRow[], key: string, label: string, color?: string | null): Breakdown {
  const withR = rows.filter((t) => t.rMultiple !== null);
  const totalR = withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
  const wins = rows.filter((t) => (t.netProfit ?? 0) > 0).length;
  return {
    key,
    label,
    color,
    trades: rows.length,
    wins,
    winRate: rows.length ? (wins / rows.length) * 100 : 0,
    expectancyR: withR.length ? totalR / withR.length : null,
    totalR: withR.length ? totalR : null,
    rCoverage: withR.length,
  };
}

/**
 * Grup dengan segelintir trade menghasilkan ekspektansi yang liar — satu menang
 * beruntung jadi "+2.4R". Menyembunyikannya lebih jujur daripada menampilkan
 * angka yang mengundang kesimpulan salah.
 */
const MIN_TRADES_PER_GROUP = 4;

function rankBreakdowns(groups: Map<string, { label: string; color?: string | null; rows: TradeRow[] }>): Breakdown[] {
  return [...groups.entries()]
    .map(([key, g]) => summarise(g.rows, key, g.label, g.color))
    .filter((b) => b.trades >= MIN_TRADES_PER_GROUP)
    .sort((a, b) => (b.expectancyR ?? -Infinity) - (a.expectancyR ?? -Infinity));
}

function groupBy(
  rows: TradeRow[],
  keyOf: (t: TradeRow) => { key: string; label: string; color?: string | null } | null,
): Map<string, { label: string; color?: string | null; rows: TradeRow[] }> {
  const groups = new Map<string, { label: string; color?: string | null; rows: TradeRow[] }>();
  for (const t of rows) {
    const k = keyOf(t);
    if (!k) continue;
    const existing = groups.get(k.key);
    if (existing) existing.rows.push(t);
    else groups.set(k.key, { label: k.label, color: k.color, rows: [t] });
  }
  return groups;
}

const HISTOGRAM_EDGES = [-3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3];

function buildHistogram(rows: TradeRow[]): RHistogramBin[] {
  const values = rows.map((t) => t.rMultiple).filter((r): r is number => r !== null);
  const bins: RHistogramBin[] = [];

  bins.push({ label: "< −3R", from: null, to: -3, count: 0, negative: true });
  for (let i = 0; i < HISTOGRAM_EDGES.length - 1; i++) {
    const from = HISTOGRAM_EDGES[i];
    const to = HISTOGRAM_EDGES[i + 1];
    bins.push({
      label: `${fmtEdge(from)} … ${fmtEdge(to)}`,
      from,
      to,
      count: 0,
      negative: to <= 0,
    });
  }
  bins.push({ label: "> 3R", from: 3, to: null, count: 0, negative: false });

  for (const v of values) {
    if (v < -3) { bins[0].count++; continue; }
    if (v >= 3) { bins[bins.length - 1].count++; continue; }
    const i = HISTOGRAM_EDGES.findIndex((edge, idx) => idx < HISTOGRAM_EDGES.length - 1 && v >= edge && v < HISTOGRAM_EDGES[idx + 1]);
    if (i >= 0) bins[i + 1].count++;
  }

  return bins;
}

function fmtEdge(v: number): string {
  const s = Number.isInteger(v) ? String(Math.abs(v)) : String(Math.abs(v));
  return `${v < 0 ? "−" : ""}${s}R`;
}

/**
 * Drawdown terdalam pada kurva ekuitas berbasis R, diukur puncak-ke-lembah.
 * Dalam R supaya tetap berarti walau akunnya berbeda mata uang.
 */
function maxDrawdownR(ordered: TradeRow[]): number | null {
  const withR = ordered.filter((t) => t.rMultiple !== null);
  if (withR.length === 0) return null;

  let cumulative = 0;
  let peak = 0;
  let worst = 0;
  for (const t of withR) {
    cumulative += t.rMultiple ?? 0;
    if (cumulative > peak) peak = cumulative;
    const drop = peak - cumulative;
    if (drop > worst) worst = drop;
  }
  return worst;
}

function sequenceStat(rows: TradeRow[]): SequenceStat {
  const withR = rows.filter((t) => t.rMultiple !== null);
  const withRisk = rows.filter((t) => t.riskPercent !== null);
  const wins = rows.filter((t) => (t.netProfit ?? 0) > 0).length;
  return {
    trades: rows.length,
    winRate: rows.length ? (wins / rows.length) * 100 : 0,
    expectancyR: withR.length ? withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / withR.length : null,
    avgRiskPercent: withRisk.length
      ? withRisk.reduce((s, t) => s + (t.riskPercent ?? 0), 0) / withRisk.length
      : null,
  };
}

export async function getAnalytics(userId: string, accountId?: string): Promise<AnalyticsResult> {
  const account = accountId
    ? await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId },
        select: { id: true, currency: true },
      })
    : null;

  const trades = (await prisma.trade.findMany({
    where: {
      account: { userId },
      ...(account ? { accountId: account.id } : {}),
      status: TradeStatus.CLOSED,
    },
    select: {
      symbol: true,
      openTime: true,
      closeTime: true,
      netProfit: true,
      rMultiple: true,
      riskPercent: true,
      holdingMinutes: true,
      setup: true,
      emotionBefore: true,
      tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
    },
    // Kronologis: urutan ini yang membuat drawdown dan analisis "setelah menang /
    // setelah kalah" bermakna.
    orderBy: { closeTime: "asc" },
  })) as TradeRow[];

  const withR = trades.filter((t) => t.rMultiple !== null);
  const totalR = withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
  const grossWinR = withR.filter((t) => (t.rMultiple ?? 0) > 0).reduce((s, t) => s + (t.rMultiple ?? 0), 0);
  const grossLossR = Math.abs(
    withR.filter((t) => (t.rMultiple ?? 0) < 0).reduce((s, t) => s + (t.rMultiple ?? 0), 0),
  );
  const wins = trades.filter((t) => (t.netProfit ?? 0) > 0).length;
  const held = trades.filter((t) => t.holdingMinutes !== null);

  // Trade yang mengikuti kemenangan vs yang mengikuti kekalahan. Sinyal revenge
  // trading muncul kalau risiko rata-rata NAIK setelah kalah.
  const afterWinRows: TradeRow[] = [];
  const afterLossRows: TradeRow[] = [];
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1].netProfit ?? 0;
    if (prev > 0) afterWinRows.push(trades[i]);
    else if (prev < 0) afterLossRows.push(trades[i]);
  }

  return {
    totalTrades: trades.length,
    rCoverage: withR.length,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    expectancyR: withR.length ? totalR / withR.length : null,
    profitFactorR: grossLossR > 0 ? grossWinR / grossLossR : grossWinR > 0 ? Infinity : null,
    maxDrawdownR: maxDrawdownR(trades),
    avgHoldingMinutes: held.length
      ? held.reduce((s, t) => s + (t.holdingMinutes ?? 0), 0) / held.length
      : null,
    netProfit: account ? trades.reduce((s, t) => s + (t.netProfit ?? 0), 0) : null,
    currency: account?.currency ?? null,

    bySetup: rankBreakdowns(groupBy(trades, (t) => (t.setup ? { key: t.setup, label: t.setup } : null))),
    bySymbol: rankBreakdowns(groupBy(trades, (t) => ({ key: t.symbol, label: t.symbol }))),
    bySession: rankBreakdowns(groupBy(trades, (t) => sessionOf(t.openTime))),
    byWeekday: rankBreakdowns(
      groupBy(trades, (t) => {
        const d = wibWeekday(t.openTime);
        return { key: String(d), label: WEEKDAYS[d] };
      }),
    ),
    byTag: rankBreakdowns(
      // Satu trade bisa punya beberapa tag, jadi ia sengaja dihitung di tiap
      // grup tag yang dimilikinya.
      (() => {
        const groups = new Map<string, { label: string; color?: string | null; rows: TradeRow[] }>();
        for (const t of trades) {
          for (const { tag } of t.tags) {
            const existing = groups.get(tag.id);
            if (existing) existing.rows.push(t);
            else groups.set(tag.id, { label: tag.name, color: tag.color, rows: [t] });
          }
        }
        return groups;
      })(),
    ),
    byEmotion: rankBreakdowns(
      groupBy(trades, (t) =>
        t.emotionBefore ? { key: String(t.emotionBefore), label: EMOTION_LABELS[t.emotionBefore] } : null,
      ),
    ),

    rHistogram: buildHistogram(trades),
    afterWin: sequenceStat(afterWinRows),
    afterLoss: sequenceStat(afterLossRows),
  };
}
