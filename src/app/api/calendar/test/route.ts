import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.FF_FEED_BASE ?? "https://nfs.faireconomy.media";
  const url = `${base}/ff_calendar_thisweek.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      url,
      length: text.length,
      preview: text.slice(0, 300),
    });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      url,
    }, { status: 500 });
  }
}
