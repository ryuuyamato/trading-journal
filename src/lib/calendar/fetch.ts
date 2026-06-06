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

export async function fetchFeed(week: FeedWeek): Promise<FfEvent[]> {
  const url = `${FF_BASE}/ff_calendar_${week}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "TradingJournal/1.0" },
    next: { revalidate: 3600 }, // cached 1 hour by Next.js
  });
  if (!res.ok) throw new Error(`ForexFactory feed error: ${res.status}`);
  return res.json();
}
