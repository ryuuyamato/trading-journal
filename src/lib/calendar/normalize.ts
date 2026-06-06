import { createHash } from "crypto";
import type { FmpEvent } from "./fetch";
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

export function normalizeEvents(raw: FmpEvent[]): NormalizedEvent[] {
  return raw.map(normalizeEvent).filter((e): e is NormalizedEvent => e !== null);
}

function normalizeEvent(e: FmpEvent): NormalizedEvent | null {
  const eventTime = parseEventTime(e.date);
  if (!eventTime) return null;

  const externalId = createHash("sha256")
    .update(`${e.country}|${e.date}|${e.event}`)
    .digest("hex")
    .slice(0, 32);

  return {
    externalId,
    title: e.event,
    country: mapCountryToCurrency(e.country),
    impact: mapImpact(e.impact),
    eventTime,
    actual: e.actual || null,
    forecast: e.consensus || null,
    previous: e.previous || null,
  };
}

function parseEventTime(dateStr: string): Date | null {
  if (!dateStr) return null;
  // FMP format: "YYYY-MM-DD HH:MM:SS" — treat as UTC
  const dt = new Date(dateStr.replace(" ", "T") + "Z");
  if (isNaN(dt.getTime())) return null;
  return dt;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  EU: "EUR",
  GB: "GBP",
  JP: "JPY",
  AU: "AUD",
  NZ: "NZD",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  HK: "HKD",
  SG: "SGD",
  KR: "KRW",
  IN: "INR",
  BR: "BRL",
  MX: "MXN",
};

function mapCountryToCurrency(country: string): string {
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? country.toUpperCase();
}

function mapImpact(raw: string): Impact {
  const s = (raw ?? "").toLowerCase();
  if (s === "high") return Impact.HIGH;
  if (s === "medium" || s === "moderate") return Impact.MEDIUM;
  if (s === "low") return Impact.LOW;
  if (s === "holiday") return Impact.HOLIDAY;
  return Impact.LOW;
}
