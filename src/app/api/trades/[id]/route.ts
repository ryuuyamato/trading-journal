import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Direction, EntryMode, MarginMode, MarketType, TradeStatus } from "@/generated/prisma/enums";

const updateSchema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(1).max(20),
  direction: z.nativeEnum(Direction),
  status: z.nativeEnum(TradeStatus),
  entryMode: z.nativeEnum(EntryMode),
  openTime: z.string().datetime(),
  closeTime: z.string().datetime().optional().nullable(),
  openPrice: z.number(),
  closePrice: z.number().optional().nullable(),

  lotSize: z.number().optional().nullable(),
  swap: z.number().default(0),

  priceRangeHigh: z.number().optional().nullable(),
  priceRangeLow: z.number().optional().nullable(),
  layerCount: z.number().int().optional().nullable(),

  quantity: z.number().optional().nullable(),
  buyFee: z.number().default(0),
  sellFee: z.number().default(0),
  taxAmount: z.number().default(0),
  dividend: z.number().default(0),

  leverage: z.number().optional().nullable(),
  marginMode: z.nativeEnum(MarginMode).optional().nullable(),
  fundingRate: z.number().optional().nullable(),

  grossProfit: z.number().optional().nullable(),
  commission: z.number().default(0),
  netProfit: z.number().optional().nullable(),
  rMultiple: z.number().optional().nullable(),
  pips: z.number().optional().nullable(),

  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  riskPercent: z.number().optional().nullable(),

  tradeMarketType: z.nativeEnum(MarketType).optional().nullable(),

  setup: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  emotionBefore: z.number().int().min(1).max(5).optional().nullable(),
  emotionAfter: z.number().int().min(1).max(5).optional().nullable(),
  holdingMinutes: z.number().int().optional().nullable(),

  tagIds: z.array(z.string()).default([]),
});

async function loadOwnedTrade(tradeId: string, userId: string) {
  return prisma.trade.findFirst({
    where: { id: tradeId, account: { userId } },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    include: {
      account: { select: { name: true, marketType: true, currency: true } },
      tags: { include: { tag: true } },
      screenshots: true,
    },
  });
  if (!trade) return NextResponse.json({ error: "Trade tidak ditemukan" }, { status: 404 });

  return NextResponse.json(trade);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedTrade(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Trade tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: parsed.data.accountId, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const { tagIds, ...tradeData } = parsed.data;

  // Neon's HTTP driver doesn't support transactions, so update + nested tag
  // writes (which Prisma would run as an implicit transaction) fail with
  // "Transactions are not supported in HTTP mode". Split into separate queries.
  await prisma.trade.update({
    where: { id },
    data: {
      ...tradeData,
      openTime: new Date(tradeData.openTime),
      closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : null,
    },
  });

  await prisma.tradeTag.deleteMany({ where: { tradeId: id } });
  if (tagIds.length > 0) {
    await prisma.tradeTag.createMany({
      data: tagIds.map((tagId) => ({ tradeId: id, tagId })),
    });
  }

  const trade = await prisma.trade.findUniqueOrThrow({
    where: { id },
    include: {
      account: { select: { name: true, marketType: true, currency: true } },
      tags: { include: { tag: true } },
      screenshots: true,
    },
  });

  return NextResponse.json(trade);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedTrade(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Trade tidak ditemukan" }, { status: 404 });

  await prisma.trade.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
