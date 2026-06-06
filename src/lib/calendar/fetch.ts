import { unstable_cache } from "next/cache";

const FF_BASE = (process.env.FF_FEED_BASE ?? "https://nfs.faireconomy.media").trim().replace(/\/$/, "");

export type FeedWeek = "thisweek" | "nextweek";

export interface FfEvent {
  title: string;
  country: string;
  date: string;     // "MM-DD-YYYY"
  time: string;     // "8:30am" | "All Day" | "Tentative"
  impact: string;   // "High" | "Medium" | "Low" | "Holiday"
  forecast: string;
  previous: string;
  actual?: string;
}

async function _fetchFeed(week: FeedWeek): Promise<FfEvent[]> {
  const url = `${FF_BASE}/ff_calendar_${week}.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingJournal/1.0)" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`ForexFactory ${week}: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(`ForexFactory ${week}: response bukan array`);
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Cache per week — 1 hour. Errors NOT cached so they retry next request.
export const fetchFeed = unstable_cache(
  _fetchFeed,
  ["ff-calendar"],
  { revalidate: 3600, tags: ["ff-calendar"] },
);
