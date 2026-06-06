import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchFeed } from "@/lib/calendar/fetch";
import { normalizeEvents } from "@/lib/calendar/normalize";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { Suspense } from "react";

interface SearchParams {
  from?: string;
  to?: string;
  currency?: string;
  impact?: string;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await auth();

  const params = await searchParams;

  // Fetch both weeks from ForexFactory (cached 1 hour by Next.js)
  const [thisWeek, nextWeek] = await Promise.all([
    fetchFeed("thisweek").catch(() => []),
    fetchFeed("nextweek").catch(() => []),
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
  if (fromFilter) filtered = filtered.filter((e) => e.eventTime >= fromFilter);
  if (toFilter) filtered = filtered.filter((e) => e.eventTime <= toFilter);
  if (currencyFilter) filtered = filtered.filter((e) => e.country === currencyFilter);
  if (impactFilter) filtered = filtered.filter((e) => impactFilter.includes(e.impact as string));

  // Look up existing AI analyses from DB by externalId
  const externalIds = filtered.map((e) => e.externalId);
  const analyses = externalIds.length
    ? await prisma.eventAnalysis.findMany({
        where: { externalId: { in: externalIds } },
      })
    : [];
  const analysisMap = new Map(analyses.map((a) => [a.externalId, a]));

  // Merge
  const events = filtered.map((e) => ({
    id: e.externalId,
    externalId: e.externalId,
    title: e.title,
    country: e.country,
    impact: e.impact as string,
    eventTime: e.eventTime.toISOString(),
    actual: e.actual,
    forecast: e.forecast,
    previous: e.previous,
    analysis: analysisMap.get(e.externalId)
      ? {
          id: analysisMap.get(e.externalId)!.id,
          summary: analysisMap.get(e.externalId)!.summary,
          bias: analysisMap.get(e.externalId)!.bias,
          instruments: analysisMap.get(e.externalId)!.instruments,
        }
      : null,
  }));

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium">Kalender Ekonomi</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Event ekonomi minggu ini &amp; minggu depan · diperbarui otomatis tiap jam
          </p>
        </div>
      </div>

      <Suspense>
        <CalendarFilters />
      </Suspense>

      <CalendarView events={events} />
    </div>
  );
}
