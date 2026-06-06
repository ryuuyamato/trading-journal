import { createHash } from "crypto";
import type { FfEvent } from "./fetch";
import { Impact } from "@/generated/prisma/enums";

const DEFAULT_TZ = process.env.DEFAULT_TZ ?? "UTC";

export interface NormalizedEvent {
  externalId: string;
  title: string;
  country: string;
  impact: Impact;
  eventTime: Date;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export function normalizeEvents(raw: FfEvent[]): NormalizedEvent[] {
  return raw.map(normalizeEvent).filter((e): e is NormalizedEvent => e !== null);
}

function normalizeEvent(e: FfEvent): NormalizedEvent | null {
  const eventTime = parseEventTime(e.date, e.time);
  if (!eventTime) return null;

  const externalId = createHash("sha256")
    .update(`${e.country}|${e.date}|${e.time}|${e.title}`)
    .digest("hex")
    .slice(0, 32);

  return {
    externalId,
    title: e.title,
    country: e.country,
    impact: mapImpact(e.impact),
    eventTime,
    actual: e.actual || null,
    forecast: e.forecast || null,
    previous: e.previous || null,
  };
}

function parseEventTime(date: string, time: string): Date | null {
  // date is MM-DD-YYYY from ForexFactory
  const [month, day, year] = date.split("-");
  if (!month || !day || !year) return null;

  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  if (!time || time === "All Day" || time === "Tentative") {
    return new Date(`${iso}T00:00:00Z`);
  }

  // time is "8:30am" or "12:00pm" format
  const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return new Date(`${iso}T00:00:00Z`);

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  if (period === "am" && hours === 12) hours = 0;
  if (period === "pm" && hours !== 12) hours += 12;

  // ForexFactory times are in Eastern Time (ET), convert to UTC
  // ET is UTC-5 (EST) or UTC-4 (EDT) — we approximate with a fixed offset
  // For production, use the DEFAULT_TZ env var
  const etOffsetMinutes = DEFAULT_TZ === "America/New_York" ? getEtOffsetMinutes(iso) : 0;
  const utcHours = hours - Math.floor(etOffsetMinutes / 60);
  const utcMinutes = minutes - (etOffsetMinutes % 60);

  const dt = new Date(`${iso}T${String(utcHours).padStart(2, "0")}:${String(utcMinutes).padStart(2, "0")}:00Z`);
  if (isNaN(dt.getTime())) return new Date(`${iso}T00:00:00Z`);
  return dt;
}

function getEtOffsetMinutes(isoDate: string): number {
  // DST in US: second Sunday of March to first Sunday of November
  // Return minutes to subtract from ET to get UTC
  const d = new Date(`${isoDate}T12:00:00Z`);
  const month = d.getUTCMonth() + 1;
  if (month > 3 && month < 11) return -4 * 60; // EDT = UTC-4
  if (month === 3) {
    const secondSunday = getSecondSunday(d.getUTCFullYear(), 3);
    if (d.getUTCDate() >= secondSunday) return -4 * 60;
  }
  if (month === 11) {
    const firstSunday = getFirstSunday(d.getUTCFullYear(), 11);
    if (d.getUTCDate() < firstSunday) return -4 * 60;
  }
  return -5 * 60; // EST = UTC-5
}

function getSecondSunday(year: number, month: number): number {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getMonth() !== month - 1) break;
    if (date.getDay() === 0) {
      count++;
      if (count === 2) return d;
    }
  }
  return 8;
}

function getFirstSunday(year: number, month: number): number {
  for (let d = 1; d <= 7; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === 0) return d;
  }
  return 1;
}

function mapImpact(raw: string): Impact {
  const s = (raw ?? "").toLowerCase();
  if (s === "high") return Impact.HIGH;
  if (s === "medium" || s === "moderate") return Impact.MEDIUM;
  if (s === "low") return Impact.LOW;
  if (s === "holiday" || s === "bank holiday") return Impact.HOLIDAY;
  return Impact.LOW;
}
