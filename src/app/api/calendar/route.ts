import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeEvent } from "@/lib/calendar/analyze";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { externalId, title, country, forecast, previous, actual } = body;
  if (!externalId || !title || !country) {
    return NextResponse.json({ error: "externalId, title, dan country wajib diisi" }, { status: 400 });
  }

  const existing = await prisma.eventAnalysis.findUnique({ where: { externalId } });
  if (existing) return NextResponse.json(existing);

  const result = await analyzeEvent(title, country, forecast ?? null, previous ?? null, actual ?? null);

  const analysis = await prisma.eventAnalysis.create({
    data: {
      externalId,
      summary: result.summary,
      bias: result.bias,
      instruments: result.instruments,
    },
  });

  return NextResponse.json(analysis);
}
