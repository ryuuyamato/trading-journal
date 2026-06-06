import { unstable_cache } from "next/cache";

const FF_BASE = process.env.FF_FEED_BASE ?? "https://nfs.faireconomy.media";

export type FeedWeek = "thisweek" | "nextweek";

export interface FfEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
}

async function _fetchFeed(week: FeedWeek): Promise<FfEvent[]> {
  const url = `${FF_BASE}/ff_calendar_${week}.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "TradingJournal/1.0" },
    });
    if (!res.ok) return [];
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Cached with unstable_cache — revalidates every hour (Next.js 16 previous model)
export const fetchFeed = unstable_cache(
  _fetchFeed,
  ["ff-calendar"],
  { revalidate: 3600, tags: ["ff-calendar"] },
);
