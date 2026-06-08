import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface TradeReportContent {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface TradeReportResult {
  headline: string;
  content: TradeReportContent;
}

export interface TradeReportStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalNetProfit: number;
  avgWin: number;
  avgLoss: number;
  avgRMultiple: number | null;
  longCount: number;
  shortCount: number;
  longWinRate: number;
  shortWinRate: number;
  currentStreak: number;
  currentStreakType: "win" | "loss" | "none";
  longestWinStreak: number;
}

export interface TradeReportTradeRow {
  symbol: string;
  direction: string;
  closeDate: string; // "YYYY-MM-DD"
  netProfit: number | null;
  rMultiple: number | null;
  setup: string | null;
  notes: string | null;
}

export interface TradeReportInput {
  accountName: string;
  marketType: string;
  currency: string;
  periodLabel: string; // e.g. "Juni 2026"
  stats: TradeReportStats;
  trades: TradeReportTradeRow[];
}

function fmtNum(n: number | null, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return n.toLocaleString("id-ID", { maximumFractionDigits: digits });
}

function buildTradeLines(trades: TradeReportTradeRow[]): string {
  return trades
    .map((t) => {
      const note = t.notes ? ` | catatan: "${t.notes.slice(0, 140)}"` : "";
      const setup = t.setup ? ` | setup: ${t.setup}` : "";
      return `- ${t.closeDate} · ${t.symbol} ${t.direction} · P&L: ${fmtNum(t.netProfit)} · R: ${fmtNum(t.rMultiple)}${setup}${note}`;
    })
    .join("\n");
}

function buildPrompt(input: TradeReportInput): string {
  const { accountName, marketType, currency, periodLabel, stats, trades } = input;

  return `Kamu adalah seorang trading coach & analis performa berpengalaman yang membantu trader retail
mengevaluasi jurnal trading bulanan mereka. Aplikasi jurnal ini TIDAK menampilkan grafik/chart kepada
trader — satu-satunya cara mereka memahami performanya adalah lewat angka mentah dan ringkasan naratif
yang kamu buat. Karena itu kerja kamu harus menggantikan apa yang biasanya disampaikan lewat visualisasi:
temukan POLA PERILAKU dari data di bawah (bukan cuma membaca ulang angka).

Akun: ${accountName} (${marketType}, mata uang ${currency})
Periode dianalisis: ${periodLabel}

Statistik agregat bulan ini:
- Total trade closed: ${stats.totalTrades}
- Win rate: ${fmtNum(stats.winRate, 1)}%
- Profit factor: ${fmtNum(stats.profitFactor)}
- Total net profit: ${fmtNum(stats.totalNetProfit)}
- Rata-rata profit saat menang: ${fmtNum(stats.avgWin)}
- Rata-rata rugi saat kalah: ${fmtNum(stats.avgLoss)}
- Rata-rata R-multiple (expectancy): ${stats.avgRMultiple === null ? "tidak ada data" : fmtNum(stats.avgRMultiple)}
- Long: ${stats.longCount} trade (win rate ${fmtNum(stats.longWinRate, 1)}%) · Short: ${stats.shortCount} trade (win rate ${fmtNum(stats.shortWinRate, 1)}%)
- Streak saat ini: ${stats.currentStreak} ${stats.currentStreakType === "win" ? "menang beruntun" : stats.currentStreakType === "loss" ? "kalah beruntun" : "(tidak ada streak aktif)"}
- Win streak terpanjang bulan ini: ${stats.longestWinStreak}

Daftar trade closed bulan ini (urut terbaru dulu, maks ${trades.length} entri):
${buildTradeLines(trades) || "(tidak ada detail trade)"}

Tugas kamu — tulis laporan analisis performa SATU HALAMAN dalam Bahasa Indonesia yang:
1. Memberi verdict singkat & jujur tentang bulan ini (headline)
2. Menjelaskan gambaran umum performa secara naratif — bukan mengulang angka, tapi memaknainya
3. Mengidentifikasi pola KEKUATAN nyata dari data (mis. konsistensi di instrumen/arah tertentu, disiplin risk management, dsb)
4. Mengidentifikasi pola KELEMAHAN nyata dari data (mis. overtrading simbol tertentu, performa long vs short yang timpang,
   tanda revenge-trading setelah kalah beruntun, R-multiple kecil dibanding win rate, catatan trade yang menunjukkan
   pelanggaran rencana, dsb) — hanya sebut yang benar-benar terindikasi dari data, jangan mengarang
5. Memberi rekomendasi konkret & actionable untuk bulan depan berdasarkan temuan di atas

Balas HANYA dalam format JSON berikut (tanpa markdown fence, tanpa teks lain):
{
  "headline": "1 kalimat verdict utama, jujur dan spesifik (bukan generik)",
  "overview": "2-4 kalimat paragraf naratif gambaran umum bulan ini",
  "strengths": ["poin kekuatan 1", "poin kekuatan 2", "..."],
  "weaknesses": ["poin kelemahan 1", "poin kelemahan 2", "..."],
  "recommendations": ["rekomendasi actionable 1", "rekomendasi actionable 2", "..."]
}
Tiap daftar (strengths/weaknesses/recommendations) berisi 2-4 poin singkat (1 kalimat per poin). Jika data
terlalu sedikit untuk menyimpulkan sesuatu dengan yakin, katakan itu secara eksplisit alih-alih mengarang.`;
}

function fallbackResult(rawText: string): TradeReportResult {
  return {
    headline: "Analisis selesai",
    content: {
      overview: rawText.slice(0, 800),
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
  };
}

export async function generateTradeReport(input: TradeReportInput): Promise<TradeReportResult> {
  const prompt = buildPrompt(input);

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    const content = parsed.content && typeof parsed.content === "object" ? parsed.content : parsed;
    return {
      headline: typeof parsed.headline === "string" ? parsed.headline : "Analisis selesai",
      content: {
        overview: typeof content.overview === "string" ? content.overview : "",
        strengths: Array.isArray(content.strengths) ? content.strengths.slice(0, 6).map(String) : [],
        weaknesses: Array.isArray(content.weaknesses) ? content.weaknesses.slice(0, 6).map(String) : [],
        recommendations: Array.isArray(content.recommendations) ? content.recommendations.slice(0, 6).map(String) : [],
      },
    };
  } catch {
    return fallbackResult(textBlock.text);
  }
}
