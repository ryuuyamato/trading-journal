import { prisma } from "@/lib/prisma";
import { fetchCalendar } from "@/lib/calendar/fetch";
import { normalizeEvents } from "@/lib/calendar/normalize";
import { CalendarView } from "./CalendarView";
import { AlertCircle } from "lucide-react";

interface SearchParams {
  from?: string;
  to?: string;
  currency?: string;
  impact?: string;
}

export async function CalendarDataLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Calculate 2-week fetch range (this Mon → next Sun)
  const { from: defaultFrom, to: defaultTo } = getTwoWeekRange();
  const fetchFrom = params.from ?? defaultFrom;
  const fetchTo = params.to ?? defaultTo;

  let allEvents: ReturnType<typeof normalizeEvents> = [];
  let fetchError: string | null = null;

  try {
    const raw = await fetchCalendar(fetchFrom, fetchTo);
    allEvents = normalizeEvents(raw);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-border p-6 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium">Gagal mengambil data kalender</p>
          <p className="text-[12px] text-muted-foreground mt-1 font-mono">{fetchError}</p>
          {fetchError.includes("TWELVE_DATA_API_KEY") && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Tambahkan <span className="font-mono">TWELVE_DATA_API_KEY</span> di Vercel → Environment Variables.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Apply in-memory filters
  const currencyFilter = params.currency?.toUpperCase() ?? null;
  const impactFilter = params.impact
    ? params.impact.split(",").map((i) => i.trim().toUpperCase())
    : null;

  let filtered = allEvents;
  if (currencyFilter) filtered = filtered.filter((e) => e.country === currencyFilter);
  if (impactFilter) filtered = filtered.filter((e) => impactFilter.includes(e.impact as string));

  // Look up existing AI analyses
  const externalIds = filtered.map((e) => e.externalId);
  const analyses = externalIds.length
    ? await prisma.eventAnalysis.findMany({ where: { externalId: { in: externalIds } } })
    : [];
  const analysisMap = new Map(analyses.map((a) => [a.externalId, a]));

  const events = filtered.map((e) => {
    const a = analysisMap.get(e.externalId);
    return {
      id: e.externalId,
      externalId: e.externalId,
      title: e.title,
      country: e.country,
      impact: e.impact as string,
      eventTime: e.eventTime.toISOString(),
      actual: e.actual,
      forecast: e.forecast,
      previous: e.previous,
      analysis: a
        ? { id: a.id, summary: a.summary, bias: a.bias, instruments: a.instruments }
        : null,
    };
  });

  return <CalendarView events={events} rawCount={allEvents.length} />;
}

function getTwoWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 13);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}
