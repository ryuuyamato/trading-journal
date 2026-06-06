import { prisma } from "@/lib/prisma";
import { fetchFeed } from "@/lib/calendar/fetch";
import { normalizeEvents } from "@/lib/calendar/normalize";
import { CalendarView } from "./CalendarView";

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

  // Fetch from ForexFactory (cached 1h via unstable_cache)
  const [thisWeek, nextWeek] = await Promise.all([
    fetchFeed("thisweek").catch(() => [] as Awaited<ReturnType<typeof fetchFeed>>),
    fetchFeed("nextweek").catch(() => [] as Awaited<ReturnType<typeof fetchFeed>>),
  ]);

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
      analysis: a ? { id: a.id, summary: a.summary, bias: a.bias, instruments: a.instruments } : null,
    };
  });

  return <CalendarView events={events} />;
}
