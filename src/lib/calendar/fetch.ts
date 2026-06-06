import { unstable_cache } from "next/cache";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

export interface FmpEvent {
  event: string;
  date: string;          // "YYYY-MM-DD HH:MM:SS"
  country: string;       // "US", "EU", "GB", "JP", etc.
  actual: string | null;
  previous: string | null;
  consensus: string | null; // = forecast
  impact: string;        // "High", "Medium", "Low"
}

async function _fetchCalendar(from: string, to: string): Promise<FmpEvent[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error("FMP_API_KEY belum diset di environment variables");

  const url = `${FMP_BASE}/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`FMP API: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("FMP API: response bukan array");
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Cache per date range — 1 hour. Errors are NOT cached so they retry next request.
export const fetchCalendar = unstable_cache(
  _fetchCalendar,
  ["fmp-calendar"],
  { revalidate: 3600, tags: ["fmp-calendar"] },
);
