import { NextResponse } from "next/server";

export async function GET() {
  const base = (process.env.FF_FEED_BASE ?? "https://nfs.faireconomy.media").trim().replace(/\/$/, "");
  const url = `${base}/ff_calendar_thisweek.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingJournal/1.0)" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    const text = await res.text();
    let preview = null;
    try { preview = JSON.parse(text)?.slice(0, 2); } catch { preview = text.slice(0, 300); }
    return NextResponse.json({ status: res.status, ok: res.ok, url, preview });
  } catch (err) {
    return NextResponse.json({ error: String(err), url }, { status: 500 });
  }
}
