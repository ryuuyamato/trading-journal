import { createHash } from "crypto";
import type { FfEvent } from "./fetch";
import { Impact } from "@/generated/prisma/enums";

// Default calendar view: today through the next 7 days, in WIB (Asia/Jakarta).
export function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return { from: fmt(now), to: fmt(future) };
}

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
    .update(`${e.country}|${e.date}|${e.time ?? ""}|${e.title}`)
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

function parseEventTime(date: string, time?: string): Date | null {
  // Newer FF feeds send `date` as a full ISO 8601 datetime with offset,
  // e.g. "2026-06-07T05:15:00-04:00" — parse it directly.
  if (date.includes("T")) {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }

  // Older FF feeds: date "MM-DD-YYYY", time "8:30am" | "All Day" | "Tentative"
  const [month, day, year] = date.split("-");
  if (!month || !day || !year) return null;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  if (!time || time === "All Day" || time === "Tentative") {
    return new Date(`${iso}T00:00:00Z`);
  }

  // time: "8:30am", "12:00pm"
  const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return new Date(`${iso}T00:00:00Z`);

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toLowerCase();
  if (period === "am" && hours === 12) hours = 0;
  if (period === "pm" && hours !== 12) hours += 12;

  // ForexFactory times are Eastern Time — convert to UTC (+4h EDT / +5h EST)
  const etOffsetHours = isDst(iso) ? 4 : 5;
  const utcHours = hours + etOffsetHours;
  const d = new Date(`${iso}T${String(utcHours % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`);
  if (utcHours >= 24) d.setUTCDate(d.getUTCDate() + 1);
  if (isNaN(d.getTime())) return new Date(`${iso}T00:00:00Z`);
  return d;
}

function isDst(isoDate: string): boolean {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (m > 3 && m < 11) return true;
  if (m === 3) return day >= getSecondSunday(d.getUTCFullYear(), 3);
  if (m === 11) return day < getFirstSunday(d.getUTCFullYear(), 11);
  return false;
}

function getSecondSunday(year: number, month: number): number {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getMonth() !== month - 1) break;
    if (date.getDay() === 0 && ++count === 2) return d;
  }
  return 8;
}

function getFirstSunday(year: number, month: number): number {
  for (let d = 1; d <= 7; d++) {
    if (new Date(year, month - 1, d).getDay() === 0) return d;
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
