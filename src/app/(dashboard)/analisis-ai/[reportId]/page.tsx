import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Lightbulb, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatCentWithUsd } from "@/lib/utils";
import { periodLabel } from "@/lib/analysis/quota";
import type { TradeReportContent, TradeReportStats } from "@/lib/analysis/trade-report";

function formatPnl(currency: string, amount: number): string {
  const sign = amount < 0 ? "-" : "";
  if (currency === "USC") return formatCentWithUsd(Math.abs(amount), sign);
  return `${sign}${currency} ${Math.abs(amount).toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
}

export default async function AnalysisReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { reportId } = await params;

  const report = await prisma.tradeAnalysisReport.findFirst({
    where: { id: reportId, userId },
    include: { account: { select: { id: true, name: true, currency: true, marketType: true } } },
  });
  if (!report) notFound();

  const content = report.content as unknown as TradeReportContent;
  const stats = report.statsSnapshot as unknown as TradeReportStats;

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href={`/analisis-ai?accountId=${report.accountId}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Analisis AI
      </Link>

      <div>
        <p className="text-[11.5px] text-muted-foreground">
          {report.account.name} · {periodLabel(report.period)} · dibuat {formatDateTime(report.createdAt)}
        </p>
        <h1 className="text-[21px] font-medium mt-1 leading-snug">{report.headline}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatPill label="Total trade" value={String(stats.totalTrades)} />
        <StatPill label="Win rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatPill label="Profit factor" value={stats.profitFactor.toFixed(2)} />
        <StatPill
          label="Net P&L"
          value={formatPnl(report.account.currency, stats.totalNetProfit)}
          tone={stats.totalNetProfit > 0 ? "profit" : stats.totalNetProfit < 0 ? "loss" : "neutral"}
        />
      </div>

      <section className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-[#1D9E75]" />
          <span className="text-[11px] font-medium text-[#1D9E75]">Ringkasan AI</span>
        </div>
        <p className="text-[13px] leading-relaxed">{content.overview}</p>
      </section>

      <ReportSection
        icon={<TrendingUp className="h-4 w-4" />}
        title="Kekuatan"
        items={content.strengths}
        tintColor="var(--color-profit)"
        empty="Belum ada pola kekuatan yang menonjol terdeteksi bulan ini."
      />
      <ReportSection
        icon={<TrendingDown className="h-4 w-4" />}
        title="Kelemahan"
        items={content.weaknesses}
        tintColor="var(--color-loss)"
        empty="Tidak ada kelemahan signifikan yang terdeteksi bulan ini."
      />
      <ReportSection
        icon={<Lightbulb className="h-4 w-4" />}
        title="Rekomendasi"
        items={content.recommendations}
        tintColor="#D9A23B"
        empty="Tidak ada rekomendasi spesifik untuk periode ini."
      />

      <p className="text-[11px] text-muted-foreground px-1">
        Laporan ini dibuat otomatis oleh AI berdasarkan data trading yang Anda catat — gunakan
        sebagai bahan refleksi, bukan nasihat finansial. Kelengkapan catatan (setup, notes) pada
        tiap trade akan membuat analisis ini semakin tajam.
      </p>
    </div>
  );
}

function StatPill({
  label, value, tone = "neutral",
}: { label: string; value: string; tone?: "profit" | "loss" | "neutral" }) {
  const color =
    tone === "profit" ? "var(--color-profit)" : tone === "loss" ? "var(--color-loss)" : "var(--color-foreground)";
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
      <p className="text-[14px] font-semibold mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function ReportSection({
  icon, title, items, tintColor, empty,
}: { icon: ReactNode; title: string; items: string[]; tintColor: string; empty: string }) {
  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border"
        style={{ color: tintColor, backgroundColor: `color-mix(in srgb, ${tintColor} 10%, transparent)` }}
      >
        {icon}
        <span className="text-[12.5px] font-medium">{title}</span>
      </div>
      <div className="px-4 py-3">
        {items.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: tintColor }} />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
