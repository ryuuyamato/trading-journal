import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, cn } from "@/lib/utils";
import { getAnalysisQuota, periodLabel, nextResetLabel, PRICE_PER_TOKEN_IDR } from "@/lib/analysis/quota";
import { GenerateReportButton } from "@/components/analysis/generate-report-button";
import { PurchaseTokenButton } from "@/components/analysis/purchase-token-dialog";
import { Badge } from "@/components/ui/badge";

export const maxDuration = 60;

function PurchaseStatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return (
      <Badge variant="outline" className="border-transparent text-[10.5px]" style={{ backgroundColor: "color-mix(in srgb, var(--color-profit) 15%, transparent)", color: "var(--color-profit)" }}>
        Disetujui
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return <Badge variant="destructive" className="text-[10.5px]">Ditolak</Badge>;
  }
  return <Badge variant="secondary" className="text-[10.5px]">Menunggu</Badge>;
}

function Header() {
  return (
    <div>
      <h1 className="text-[20px] font-medium">Analisis AI</h1>
      <p className="text-[12px] text-muted-foreground mt-0.5">
        Pakai token analisis bulanan untuk meminta AI membuat ringkasan performa trading akun Anda
        — lengkap dengan kekuatan, kelemahan, dan rekomendasi — lalu simpan sebagai catatan yang
        bisa dibuka kembali kapan saja · 1 token gratis / akun / bulan · tambahan Rp {PRICE_PER_TOKEN_IDR.toLocaleString("id-ID")}/token
      </p>
    </div>
  );
}

export default async function AnalisisAiPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { accountId } = await searchParams;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  if (accounts.length === 0) {
    return (
      <div className="max-w-3xl space-y-4">
        <Header />
        <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
          Anda belum memiliki akun trading. Buat akun terlebih dahulu di halaman{" "}
          <Link href="/accounts" className="underline underline-offset-2">Akun</Link>{" "}
          untuk mulai menggunakan Analisis AI.
        </div>
      </div>
    );
  }

  const selected = accounts.find((a) => a.id === accountId) ?? accounts[0];

  const [quota, reports, purchases] = await Promise.all([
    getAnalysisQuota(selected.id),
    prisma.tradeAnalysisReport.findMany({
      where: { accountId: selected.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, period: true, headline: true, createdAt: true },
    }),
    prisma.tokenPurchase.findMany({
      where: { accountId: selected.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, quantity: true, status: true, createdAt: true },
      take: 5,
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <Header />

      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {accounts.map((acc) => (
            <Link
              key={acc.id}
              href={`/analisis-ai?accountId=${acc.id}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] border transition-colors",
                acc.id === selected.id
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              )}
            >
              {acc.name}
            </Link>
          ))}
        </div>
      )}

      {/* Kartu quota */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[13px] font-medium">
              {quota.freeRemaining} dari {quota.freeLimit} token gratis tersisa bulan ini
              {quota.purchasedBalance > 0 && (
                <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                  · Saldo terbeli: {quota.purchasedBalance} token
                </span>
              )}
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Menganalisis trading {periodLabel(quota.period)} pada akun &ldquo;{selected.name}&rdquo;
              {" "}· Reset token gratis {nextResetLabel(quota.period)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PurchaseTokenButton accountId={selected.id} />
            <GenerateReportButton accountId={selected.id} remaining={quota.remaining} />
          </div>
        </div>

        {/* Riwayat permintaan pembelian */}
        {purchases.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Riwayat pembelian token</p>
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted-foreground">
                  {p.quantity} token · {formatDateTime(p.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">
                    Rp {(p.quantity * PRICE_PER_TOKEN_IDR).toLocaleString("id-ID")}
                  </span>
                  <PurchaseStatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
          Belum ada laporan analisis untuk akun ini. Klik &ldquo;Buat Analisis Baru&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/analisis-ai/${r.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate">{r.headline}</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {periodLabel(r.period)} · dibuat {formatDateTime(r.createdAt)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
