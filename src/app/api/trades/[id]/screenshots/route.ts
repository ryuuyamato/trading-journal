import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const trade = await prisma.trade.findFirst({ where: { id, account: { userId: session.user.id } } });
  if (!trade) return NextResponse.json({ error: "Trade tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const screenshot = await prisma.tradeScreenshot.create({
    data: { tradeId: id, url: parsed.data.url, caption: parsed.data.caption ?? null },
  });

  return NextResponse.json(screenshot, { status: 201 });
}
