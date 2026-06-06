import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Impact } from "@/generated/prisma/enums";
import { analyzeEvent } from "@/lib/calendar/analyze";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const currency = url.searchParams.get("currency");
  const impact = url.searchParams.get("impact");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
  startOfWeek.setUTCHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    eventTime: {
      gte: from ? new Date(from) : startOfWeek,
      lte: to ? new Date(to) : endOfWeek,
    },
  };

  if (currency) {
    where.country = currency.toUpperCase();
  }

  if (impact) {
    const impactValues = impact.split(",").map((i) => {
      const upper = i.trim().toUpperCase();
      if (Object.values(Impact).includes(upper as Impact)) return upper as Impact;
      return null;
    }).filter(Boolean);
    if (impactValues.length > 0) where.impact = { in: impactValues };
  }

  const events = await prisma.economicEvent.findMany({
    where,
    include: { analysis: true },
    orderBy: { eventTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId } = body;
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = await prisma.economicEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = await prisma.eventAnalysis.findUnique({ where: { eventId } });
  if (existing) {
    return NextResponse.json(existing);
  }

  const result = await analyzeEvent(
    event.title,
    event.country,
    event.forecast,
    event.previous,
    event.actual,
  );

  const analysis = await prisma.eventAnalysis.create({
    data: {
      eventId,
      summary: result.summary,
      bias: result.bias,
      instruments: result.instruments,
    },
  });

  return NextResponse.json(analysis);
}
