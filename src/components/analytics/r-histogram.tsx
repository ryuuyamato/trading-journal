import type { RHistogramBin } from "@/lib/analytics";

/**
 * Sebaran hasil trade dalam R.
 *
 * Bentuk ini menjawab pertanyaan yang tidak bisa dijawab win rate: apakah
 * kemenangan cukup besar untuk menutup kekalahan. Tumpukan tinggi persis di
 * −1R itu wajar (stop loss bekerja); ekor kanan yang tipis berarti profit
 * dipotong terlalu cepat.
 *
 * Kolomnya ordinal sepanjang sumbu R, jadi warnanya hanya menandai sisi nol —
 * urutannya dibawa posisi, bukan hue.
 */
export function RHistogram({ bins, coverage }: { bins: RHistogramBin[]; coverage: number }) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const total = bins.reduce((s, b) => s + b.count, 0);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <div>
        <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Sebaran Hasil (R)
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Berapa kali tiap ukuran menang dan kalah terjadi. Kolom kiri garis nol adalah
          kerugian, kanan keuntungan.
        </p>
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-[12px] text-muted-foreground">
          Belum ada trade dengan R — isi stop loss saat mencatat supaya R ikut terhitung.
        </p>
      ) : (
        <>
          <div className="flex h-32 items-end gap-[2px]">
            {bins.map((bin) => (
              <div
                key={bin.label}
                className="flex h-full min-w-0 flex-1 flex-col justify-end"
                title={`${bin.label}: ${bin.count} trade`}
              >
                {/* Nilai hanya pada kolom yang punya isi, dan hanya kalau muat. */}
                {bin.count > 0 && (
                  <span className="num mb-1 text-center text-[10px] text-muted-foreground tabular-nums">
                    {bin.count}
                  </span>
                )}
                <div
                  className="w-full rounded-t-[4px]"
                  style={{
                    height: `${(bin.count / max) * 100}%`,
                    minHeight: bin.count > 0 ? "2px" : "0",
                    backgroundColor: bin.negative ? "var(--color-loss)" : "var(--color-profit)",
                  }}
                  aria-hidden
                />
              </div>
            ))}
          </div>

          {/* Sumbu: hairline solid, satu langkah dari permukaan. */}
          <div className="h-px bg-border" aria-hidden />

          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>← rugi</span>
            <span className="num tabular-nums">
              −1R: {bins.find((b) => b.from === -1)?.count ?? 0} trade
            </span>
            <span>untung →</span>
          </div>

          <p className="text-[10.5px] text-muted-foreground">
            Dihitung dari {coverage} trade yang punya R.
          </p>
        </>
      )}
    </section>
  );
}
