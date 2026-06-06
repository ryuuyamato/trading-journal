import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TWELVE_DATA_API_KEY tidak diset" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const url = `https://api.twelvedata.com/economic_calendar?start_date=${today}&end_date=${today}&apikey=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      eventCount: data?.result?.list?.length ?? 0,
      preview: data?.result?.list?.slice(0, 2) ?? data,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
