import { prisma } from "@/lib/prisma";
import { fetchFeed, type FfEvent } from "@/lib/calendar/fetch";
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
  try {
    const params = await searchParams;

    // Fetch thisweek + nextweek independently (nextweek may 404 — that's OK)
    const [thisWeekResult, nextWeekResult] = await Promise.allSettled([
      fetchFeed("thisweek"),
      fetchFeed("nextweek"),
    ]);

    const thisWeek: FfEvent[] =
      thisWeekResult.status === "fulfilled" ? thisWeekResult.value : [];
    const nextWeek: FfEvent[] =
      nextWeekResult.status === "fulfilled" ? nextWeekResult.value : [];

    // Surface error only if thisweek also failed
    if (thisWeekResult.status === "rejected") {
      const msg =
        thisWeekResult.reason instanceof Error
          ? thisWeekResult.reason.message
          : String(thisWeekResult.reason);
      return <FetchErrorPanel message={msg} />;
    }

    const allEvents = normalizeEvents([...thisWeek, ...nextWeek]);

    // Apply in-memory filters
    const currencyFilter = params.currency?.toUpperCase() ?? null;
    const impactFilter = params.impact
      ? params.impact.split(",").map((i) => i.trim().toUpperCase())
      : null;
    const fromFilter = params.from ? new Date(params.from + "T00:00:00Z") : null;
    const toFilter = params.to ? new Date(params.to + "T23:59:59Z") : null;

    let filtered = allEvents;
    if (fromFilter) filtered = filtered.filter((e) => e.eventTime >= fromFilter!);
    if (toFilter) filtered = filtered.filter((e) => e.eventTime <= toFilter!);
    if (currencyFilter) filtered = filtered.filter((e) => e.country === currencyFilter);
    if (impactFilter)
      filtered = filtered.filter((e) => impactFilter.includes(e.impact as string));

    // Look up existing AI analyses
    const externalIds = filtered.map((e) => e.externalId);
    let analyses: Awaited<ReturnType<typeof prisma.eventAnalysis.findMany>> = [];
    if (externalIds.length) {
      analyses = await prisma.eventAnalysis.findMany({
        where: { externalId: { in: externalIds } },
      });
    }
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return <FetchErrorPanel message={msg} />;
  }
}

function FetchErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border p-6 flex items-start gap-3">
      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-medium">Gagal mengambil data kalender</p>
        <p className="text-[12px] text-muted-foreground mt-1 font-mono">{message}</p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Data di-cache 1 jam — tunggu beberapa menit lalu refresh halaman.
        </p>
      </div>
    </div>
  );
}
