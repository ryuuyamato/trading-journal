import { Suspense } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { fetchFeed, type FfEvent } from "@/lib/calendar/fetch";
import { normalizeEvents } from "@/lib/calendar/normalize";
import { getNoTradeDays, type NoTradeDay, type NtdInstrument } from "@/lib/no-trade-days";

export const maxDuration = 30;

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const INSTRUMENT_LABEL: Record<NtdInstrument, string> = {
  GOLD: "Gold",
  CRYPTO: "Crypto",
};

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${DAY_NAMES[d.getUTCDay()]}, ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

function getDefaultRange(): { from: string; to: string } {
  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return { from: fmt(now), to: fmt(future) };
}

export default function NoTradeDaysPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-[20px] font-medium">No Trade Day</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Hari-hari yang sebaiknya dihindari atau diwaspadai untuk trading Gold &amp; Crypto,
          berdasarkan fundamental dasar (rilis data ekonomi berdampak tinggi, akhir pekan,
          expiry kontrak bulanan) · 14 hari ke depan
        </p>
      </div>
      <Suspense fallback={<NoTradeDaysSkeleton />}>
        <NoTradeDaysLoader />
      </Suspense>
    </div>
  );
}

async function NoTradeDaysLoader() {
  try {
    const range = getDefaultRange();

    const [thisWeekResult, nextWeekResult] = await Promise.allSettled([
      fetchFeed("thisweek"),
      fetchFeed("nextweek"),
    ]);

    const thisWeek: FfEvent[] = thisWeekResult.status === "fulfilled" ? thisWeekResult.value : [];
    const nextWeek: FfEvent[] = nextWeekResult.status === "fulfilled" ? nextWeekResult.value : [];

    if (thisWeekResult.status === "rejected" && nextWeekResult.status === "rejected") {
      const msg =
        thisWeekResult.reason instanceof Error ? thisWeekResult.reason.message : String(thisWeekResult.reason);
      return <FetchErrorPanel message={msg} />;
    }

    const events = normalizeEvents([...thisWeek, ...nextWeek]);
    const from = new Date(range.from + "T00:00:00Z");
    const to = new Date(range.to + "T23:59:59Z");
    const days = getNoTradeDays(events, from, to);

    return <NoTradeDaysList days={days} />;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return <FetchErrorPanel message={msg} />;
  }
}

function NoTradeDaysList({ days }: { days: NoTradeDay[] }) {
  if (days.length === 0) {
    return (
      <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
        Tidak ada hari yang perlu dihindari dalam 14 hari ke depan. Tetap disiplin dengan rencana trading Anda.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {days.map((day) => (
        <div key={day.date} className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <p className="text-[13px] font-medium">{formatDateLabel(day.date)}</p>
          </div>
          <div className="divide-y divide-border">
            {day.reasons.map((reason, i) => {
              const isAvoid = reason.severity === "avoid";
              const tintColor = isAvoid ? "var(--color-loss)" : "#D9A23B";
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span
                    className="shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      color: tintColor,
                      backgroundColor: `color-mix(in srgb, ${tintColor} 14%, transparent)`,
                    }}
                  >
                    <ShieldAlert className="h-3 w-3" />
                    {INSTRUMENT_LABEL[reason.instrument]} · {isAvoid ? "Hindari" : "Waspada"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium">{reason.label}</p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">{reason.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground px-1 pt-1">
        Data Kalender Ekonomi mencakup ±2 minggu ke depan. Di luar rentang itu, hanya aturan
        tetap (akhir pekan, NFP, expiry kontrak bulanan) yang aktif. Ini adalah panduan
        berbasis fundamental dasar, bukan jaminan — selalu sesuaikan dengan analisis &amp; rencana trading Anda sendiri.
      </p>
    </div>
  );
}

function NoTradeDaysSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <div className="h-4 w-40 bg-border rounded" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="h-5 w-24 bg-border rounded-full shrink-0" />
            <div className="h-3 flex-1 bg-border rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FetchErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border p-6 flex items-start gap-3">
      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-medium">Gagal mengambil data Kalender Ekonomi</p>
        <p className="text-[12px] text-muted-foreground mt-1 font-mono">{message}</p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Aturan tetap (akhir pekan, NFP, expiry bulanan) tetap aktif — coba refresh halaman dalam beberapa menit.
        </p>
      </div>
    </div>
  );
}
