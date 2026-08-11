import type { Breakdown } from "@/lib/analytics";

/**
 * Daftar bar diverging berperingkat — satu bentuk yang dipakai untuk setiap
 * pembanding di halaman ini (setup, simbol, sesi, hari, tag, emosi).
 *
 * Barnya bertumpu pada garis nol: ekspektansi negatif tumbuh ke kiri, positif ke
 * kanan. Sisi bar itu penting — hijau dan merah hanya terpisah ΔE 7 di bawah
 * deuteranopia, jadi polaritas tidak boleh bergantung pada warna saja. Sisi bar
 * dan tanda +/− pada label menanggungnya; warna cuma memperkuat.
 */
export function BreakdownList({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description?: string;
  items: Breakdown[];
  emptyLabel: string;
}) {
  const scale = Math.max(0.5, ...items.map((i) => Math.abs(i.expectancyR ?? 0)));

  return (
    <section className="space-y-2.5 rounded-xl border border-border bg-card px-4 py-3.5">
      <div>
        <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {title}
        </h2>
        {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <BreakdownRow key={item.key} item={item} scale={scale} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BreakdownRow({ item, scale }: { item: Breakdown; scale: number }) {
  const r = item.expectancyR;
  const positive = (r ?? 0) >= 0;
  const width = r === null ? 0 : (Math.abs(r) / scale) * 50; // % dari lebar penuh, nol di tengah

  return (
    <li className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-2.5 md:grid-cols-[minmax(0,10rem)_1fr_auto]">
      <div className="flex min-w-0 items-center gap-1.5">
        {item.color && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
        )}
        <span className="truncate text-[12px]" title={item.label}>
          {item.label}
        </span>
      </div>

      {/* Trek bar. Garis nol adalah hairline solid satu langkah dari permukaan. */}
      <div
        className="relative h-2.5"
        title={`${item.label}: ${item.trades} trade, ${item.wins} menang, R dari ${item.rCoverage} trade`}
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" aria-hidden />
        {r !== null && (
          <div
            className={
              positive
                ? "absolute inset-y-0 left-1/2 rounded-r-[4px]"
                : "absolute inset-y-0 right-1/2 rounded-l-[4px]"
            }
            style={{
              width: `${width}%`,
              backgroundColor: positive ? "var(--color-profit)" : "var(--color-loss)",
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Nilai memakai token teks, bukan warna data — barnya yang membawa warna. */}
      <div className="flex shrink-0 items-baseline gap-2 text-right">
        <span className="num w-14 text-[12px] font-medium tabular-nums">
          {r === null ? "–" : `${r >= 0 ? "+" : "−"}${Math.abs(r).toFixed(2)}R`}
        </span>
        <span className="num w-20 text-[11px] text-muted-foreground tabular-nums">
          {item.trades}× · {item.winRate.toFixed(0)}%
        </span>
      </div>
    </li>
  );
}
