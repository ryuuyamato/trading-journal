import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { BreakdownList } from "@/components/analytics/breakdown-list";
import { RHistogram } from "@/components/analytics/r-histogram";
import { AccountFilter } from "@/components/analytics/account-filter";

function fmtR(v: number | null): string {
  if (v === null) return "–";
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}R`;
}

function fmtHolding(minutes: number | null): string {
  if (minutes === null) return "–";
  if (minutes < 60) return `${Math.round(minutes)} menit`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} jam`;
  return `${(hours / 24).toFixed(1)} hari`;
}

export default async function AnalitikPage({
  searchParams,
}: {
  searchParams: Promise<{ akun?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { akun } = await searchParams;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, currency: true },
    orderBy: { createdAt: "asc" },
  });

  const selectedId = akun && accounts.some((a) => a.id === akun) ? akun : undefined;
  const a = await getAnalytics(session.user.id, selectedId);

  const rGap = a.totalTrades - a.rCoverage;

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">Analitik</h1>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Semua pembanding memakai R — hasil dibagi risiko yang kamu ambil. Nominal
          dikacaukan ukuran posisi dan berbeda mata uang antar akun; R tidak.
        </p>
      </div>

      {accounts.length > 0 && (
        <AccountFilter accounts={accounts} value={selectedId ?? "semua"} />
      )}

      {a.totalTrades === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            Belum ada trade tertutup untuk dianalisis.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <StatCard
              label="Ekspektansi"
              value={fmtR(a.expectancyR)}
              subValue="rata-rata per trade"
              trend={a.expectancyR === null ? "neutral" : a.expectancyR > 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Profit Factor"
              value={
                a.profitFactorR === null
                  ? "–"
                  : a.profitFactorR === Infinity
                  ? "∞"
                  : a.profitFactorR.toFixed(2)
              }
              subValue="untung R ÷ rugi R"
              trend={
                a.profitFactorR === null ? "neutral" : a.profitFactorR >= 1 ? "positive" : "negative"
              }
            />
            <StatCard
              label="Drawdown Terdalam"
              value={a.maxDrawdownR === null ? "–" : `−${a.maxDrawdownR.toFixed(1)}R`}
              subValue="puncak ke lembah"
              trend={a.maxDrawdownR ? "negative" : "neutral"}
            />
            <StatCard
              label="Rata-rata Ditahan"
              value={fmtHolding(a.avgHoldingMinutes)}
              subValue={`${a.totalTrades} trade · ${a.winRate.toFixed(0)}% menang`}
            />
          </div>

          {rGap > 0 && (
            <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
              {rGap} dari {a.totalTrades} trade belum punya R karena stop loss-nya kosong,
              jadi tidak ikut dihitung di angka berbasis R. Isi stop loss saat mencatat
              supaya analitiknya utuh.
            </p>
          )}

          {a.netProfit !== null && (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              <StatCard
                label="Net P&L"
                value={`${a.netProfit >= 0 ? "+" : "−"}${Math.abs(a.netProfit).toLocaleString("id-ID", { maximumFractionDigits: 2 })} ${a.currency}`}
                subValue="akun terpilih"
                trend={a.netProfit >= 0 ? "positive" : "negative"}
              />
            </div>
          )}

          <BreakdownList
            title="Performa per Setup"
            description="Setup mana yang benar-benar menghasilkan. Grup dengan kurang dari 4 trade disembunyikan — terlalu sedikit untuk disimpulkan."
            items={a.bySetup}
            emptyLabel="Belum ada setup yang tercatat cukup sering. Isi kolom Setup saat mencatat trade."
          />

          <BreakdownList
            title="Performa per Simbol"
            items={a.bySymbol}
            emptyLabel="Belum cukup trade per simbol."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <BreakdownList
              title="Per Sesi Pasar"
              description="Berdasarkan jam buka posisi, waktu Jakarta."
              items={a.bySession}
              emptyLabel="Belum cukup trade."
            />
            <BreakdownList
              title="Per Hari"
              items={a.byWeekday}
              emptyLabel="Belum cukup trade."
            />
          </div>

          <RHistogram bins={a.rHistogram} coverage={a.rCoverage} />

          <section className="space-y-3 rounded-xl border border-border bg-card px-4 py-3.5">
            <div>
              <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Setelah Menang vs Setelah Kalah
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Bagaimana trade berikutnya berubah setelah hasil sebelumnya. Risiko yang
                naik setelah kalah adalah tanda revenge trading.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <SequenceCard title="Setelah menang" stat={a.afterWin} />
              <SequenceCard title="Setelah kalah" stat={a.afterLoss} />
            </div>
            <RevengeVerdict
              afterWinRisk={a.afterWin.avgRiskPercent}
              afterLossRisk={a.afterLoss.avgRiskPercent}
              afterWinR={a.afterWin.expectancyR}
              afterLossR={a.afterLoss.expectancyR}
            />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <BreakdownList
              title="Performa per Tag"
              description="Pola yang kamu tandai sendiri."
              items={a.byTag}
              emptyLabel="Belum ada tag yang terpasang di cukup banyak trade. Pasang tag saat mencatat trade."
            />
            <BreakdownList
              title="Per Tingkat Keyakinan"
              description="Perasaan yang dicatat sebelum entry."
              items={a.byEmotion}
              emptyLabel="Belum ada catatan perasaan sebelum entry."
            />
          </div>
        </>
      )}
    </div>
  );
}

function SequenceCard({
  title,
  stat,
}: {
  title: string;
  stat: { trades: number; winRate: number; expectancyR: number | null; avgRiskPercent: number | null };
}) {
  return (
    <div className="rounded-lg border border-border px-3.5 py-3">
      <p className="text-[10.5px] tracking-wider text-muted-foreground uppercase">{title}</p>
      <p className="num mt-1.5 text-[19px] leading-none font-semibold">{fmtR(stat.expectancyR)}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        <span className="num">{stat.trades}</span> trade ·{" "}
        <span className="num">{stat.winRate.toFixed(0)}%</span> menang
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Risiko rata-rata{" "}
        <span className="num">
          {stat.avgRiskPercent === null ? "–" : `${stat.avgRiskPercent.toFixed(2)}%`}
        </span>
      </p>
    </div>
  );
}

/**
 * Menyatakan temuannya dengan kalimat, bukan menyerahkan pembacaan dua angka ke
 * pembaca. Ambangnya 15% supaya selisih kecil yang wajar tidak jadi tuduhan.
 */
function RevengeVerdict({
  afterWinRisk,
  afterLossRisk,
  afterWinR,
  afterLossR,
}: {
  afterWinRisk: number | null;
  afterLossRisk: number | null;
  afterWinR: number | null;
  afterLossR: number | null;
}) {
  if (afterWinRisk === null || afterLossRisk === null || afterWinRisk === 0) return null;

  const riskUp = (afterLossRisk - afterWinRisk) / afterWinRisk;
  const worse = afterWinR !== null && afterLossR !== null && afterLossR < afterWinR;

  if (riskUp > 0.15) {
    return (
      <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-[11.5px]">
        Risikomu naik <span className="num font-medium">{(riskUp * 100).toFixed(0)}%</span> setelah
        kalah dibanding setelah menang
        {worse && ", dan hasilnya justru lebih buruk"}. Ini pola revenge trading yang
        paling umum — ukuran posisi dinaikkan untuk mengejar kerugian.
      </p>
    );
  }

  if (riskUp < -0.15) {
    return (
      <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-[11.5px]">
        Risikomu turun <span className="num font-medium">{(Math.abs(riskUp) * 100).toFixed(0)}%</span>{" "}
        setelah kalah. Menahan diri itu baik, tapi kalau kelewat kecil kamu bisa melewatkan
        pemulihan.
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-[11.5px]">
      Ukuran risikomu konsisten setelah menang maupun kalah — tidak ada tanda revenge
      trading.
    </p>
  );
}
