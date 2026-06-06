import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FMP_API_KEY tidak diset" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${today}&to=${today}&apikey=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      length: text.length,
      preview: text.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
