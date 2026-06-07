import { Suspense } from "react";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { CalendarDataLoader } from "@/components/calendar/CalendarDataLoader";
import { CalendarSkeleton } from "@/components/calendar/CalendarSkeleton";
import { getDefaultDateRange } from "@/lib/calendar/normalize";

// ForexFactory fetches can take several seconds on a cache miss (two feeds +
// AI-analysis lookup); the platform default function timeout is too short and
// surfaces as a 504 FUNCTION_INVOCATION_TIMEOUT.
export const maxDuration = 30;

interface SearchParams {
  from?: string;
  to?: string;
  currency?: string;
  impact?: string;
}

export default function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const defaultRange = getDefaultDateRange();

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-[20px] font-medium">Kalender Ekonomi</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Event ekonomi minggu ini &amp; minggu depan · diperbarui otomatis tiap jam
        </p>
      </div>

      <Suspense>
        <CalendarFilters defaultFrom={defaultRange.from} defaultTo={defaultRange.to} />
      </Suspense>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarDataLoader searchParams={searchParams} defaultRange={defaultRange} />
      </Suspense>
    </div>
  );
}
