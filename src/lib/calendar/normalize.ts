import { createHash } from "crypto";
import type { TdEvent } from "./fetch";
import { Impact } from "@/generated/prisma/enums";

export interface NormalizedEvent {
  externalId: string;
  title: string;
  country: string;   // currency code: USD, EUR, GBP, etc.
  impact: Impact;
  eventTime: Date;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export function normalizeEvents(raw: TdEvent[]): NormalizedEvent[] {
  return raw.map(normalizeEvent).filter((e): e is NormalizedEvent => e !== null);
}

function normalizeEvent(e: TdEvent): NormalizedEvent | null {
  const eventTime = parseEventTime(e.date, e.time);
  if (!eventTime) return null;

  const externalId = createHash("sha256")
    .update(`${e.currency}|${e.date}|${e.time}|${e.event}`)
    .digest("hex")
    .slice(0, 32);

  return {
    externalId,
    title: e.event,
    country: e.currency.toUpperCase(),
    impact: mapImpact(e.importance),
    eventTime,
    actual: e.actual || null,
    forecast: e.forecast || null,
    previous: e.previous || null,
  };
}

function parseEventTime(date: string, time: string): Date | null {
  if (!date) return null;
  // Twelve Data: date = "YYYY-MM-DD", time = "HH:MM:SS" — UTC
  const timeStr = time && time !== "00:00:00" ? time : "00:00:00";
  const dt = new Date(`${date}T${timeStr}Z`);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function mapImpact(raw: string): Impact {
  const s = (raw ?? "").toLowerCase();
  if (s === "high") return Impact.HIGH;
  if (s === "medium" || s === "moderate") return Impact.MEDIUM;
  if (s === "low") return Impact.LOW;
  if (s === "holiday") return Impact.HOLIDAY;
  return Impact.LOW;
}
