import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { SyncButton } from "@/components/calendar/SyncButton";
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
  const session = await auth();
  const userId = session!.user!.id!;
  void userId;

  const params = await searchParams;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
  startOfWeek.setUTCHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    eventTime: {
      gte: params.from ? new Date(params.from) : startOfWeek,
      lte: params.to ? new Date(params.to) : endOfWeek,
    },
  };

  if (params.currency) {
    where.country = params.currency.toUpperCase();
  }

  if (params.impact) {
    const validImpacts = ["HIGH", "MEDIUM", "LOW", "HOLIDAY"];
    const impacts = params.impact.split(",").filter((i) => validImpacts.includes(i.toUpperCase()));
    if (impacts.length > 0) where.impact = { in: impacts.map((i) => i.toUpperCase()) };
  }

  const events = await prisma.economicEvent.findMany({
    where,
    include: { analysis: true },
    orderBy: { eventTime: "asc" },
  });

  const serialized = events.map((e) => ({
    ...e,
    eventTime: e.eventTime.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    analysis: e.analysis
      ? {
          ...e.analysis,
          createdAt: e.analysis.createdAt.toISOString(),
          updatedAt: e.analysis.updatedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium">Kalender Ekonomi</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Event ekonomi yang mempengaruhi pasar forex dan komoditas
          </p>
        </div>
        <SyncButton />
      </div>

      <Suspense>
        <CalendarFilters />
      </Suspense>

      <CalendarView events={serialized} />
    </div>
  );
}
