import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFeed } from "@/lib/calendar/fetch";
import { normalizeEvents } from "@/lib/calendar/normalize";
import { analyzeEvent } from "@/lib/calendar/analyze";
import { Impact } from "@/generated/prisma/enums";

export async function POST(request: Request) {
  const secret = request.headers.get("x-sync-secret");
  if (secret !== process.env.CALENDAR_SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const weeks = url.searchParams.get("weeks") ?? "thisweek";
  const analyze = url.searchParams.get("analyze") === "true";

  const weeksList = weeks === "both"
    ? (["thisweek", "nextweek"] as const)
    : ([weeks === "nextweek" ? "nextweek" : "thisweek"] as const);

  let upserted = 0;
  let analyzed = 0;
  const errors: string[] = [];

  for (const week of weeksList) {
    let raw;
    try {
      raw = await fetchFeed(week);
    } catch (err) {
      errors.push(`fetchFeed(${week}): ${err}`);
      continue;
    }

    const events = normalizeEvents(raw);

    for (const ev of events) {
      await prisma.economicEvent.upsert({
        where: { externalId: ev.externalId },
        create: {
          externalId: ev.externalId,
          title: ev.title,
          country: ev.country,
          impact: ev.impact,
          eventTime: ev.eventTime,
          forecast: ev.forecast,
          previous: ev.previous,
        },
        update: {
          title: ev.title,
          impact: ev.impact,
          eventTime: ev.eventTime,
          forecast: ev.forecast,
          previous: ev.previous,
        },
      });
      upserted++;

      if (analyze && ev.impact === Impact.HIGH) {
        try {
          const existing = await prisma.eventAnalysis.findFirst({
            where: { event: { externalId: ev.externalId } },
          });
          if (!existing) {
            const dbEvent = await prisma.economicEvent.findUnique({
              where: { externalId: ev.externalId },
            });
            if (dbEvent) {
              const result = await analyzeEvent(
                dbEvent.title,
                dbEvent.country,
                dbEvent.forecast,
                dbEvent.previous,
                dbEvent.actual,
              );
              await prisma.eventAnalysis.create({
                data: {
                  eventId: dbEvent.id,
                  summary: result.summary,
                  bias: result.bias,
                  instruments: result.instruments,
                },
              });
              analyzed++;
            }
          }
        } catch (err) {
          errors.push(`analyze(${ev.externalId}): ${err}`);
        }
      }
    }
  }

  return NextResponse.json({ upserted, analyzed, errors });
}
