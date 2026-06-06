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
  const params = await searchParams;

  // Fetch each week independently — nextweek may 404 if FF hasn't published it yet
  const [thisWeekResult, nextWeekResult] = await Promise.allSettled([
    fetchFeed("thisweek"),
    fetchFeed("nextweek"),
  ]);

  const thisWeek = thisWeekResult.status === "fulfilled" ? thisWeekResult.value : [];
  const nextWeek = nextWeekResult.status === "fulfilled" ? nextWeekResult.value : [];

  // Only show error if thisweek also failed (nextweek 404 is normal)
  if (thisWeekResult.status === "rejected" && thisWeek.length === 0) {
    const msg = thisWeekResult.reason instanceof Error
      ? thisWeekResult.reason.message
      : String(thisWeekResult.reason);
    return (
      <div className="rounded-xl border border-border p-6 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium">Gagal mengambil data ForexFactory</p>
          <p className="text-[12px] text-muted-foreground mt-1 font-mono">{msg}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Pastikan server dapat mengakses{" "}
            <span className="font-mono">nfs.faireconomy.media</span>, atau cek{" "}
            <span className="font-mono">/api/calendar/test</span> untuk diagnosis.
          </p>
        </div>
      </div>
    );
  }

  const allEvents = normalizeEvents([...thisWeek, ...nextWeek]);

  // Apply filters
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
