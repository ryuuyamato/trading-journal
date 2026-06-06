import { unstable_cache } from "next/cache";

const TD_BASE = "https://api.twelvedata.com";

export interface TdEvent {
  id: string;
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:MM:SS"
  country: string;     // "United States", "Euro Zone", etc.
  currency: string;    // "USD", "EUR", "GBP", etc.
  importance: string;  // "high", "medium", "low"
  event: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

interface TdResponse {
  result?: { list?: TdEvent[] };
  status?: string;
  message?: string;
}

async function _fetchCalendar(from: string, to: string): Promise<TdEvent[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("TWELVE_DATA_API_KEY belum diset di environment variables");

  const url = `${TD_BASE}/economic_calendar?start_date=${from}&end_date=${to}&apikey=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Twelve Data: HTTP ${res.status}`);
    const data: TdResponse = await res.json();
    if (data.status === "error") throw new Error(`Twelve Data: ${data.message}`);
    return data.result?.list ?? [];
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Cache per date range — 1 hour. Errors NOT cached so they retry next request.
export const fetchCalendar = unstable_cache(
  _fetchCalendar,
  ["td-calendar"],
  { revalidate: 3600, tags: ["td-calendar"] },
);
