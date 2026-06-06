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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // User-Agent yang lebih umum agar tidak diblokir
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingJournal/1.0)" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`ForexFactory ${week}: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(`ForexFactory ${week}: bukan array`);
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err; // Biarkan error naik ke atas, jangan sembunyikan
  }
}
