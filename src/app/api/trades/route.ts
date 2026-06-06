import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Direction, EntryMode, MarginMode, MarketType, TradeStatus } from "@/generated/prisma/enums";

const createSchema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(1).max(20),
  direction: z.nativeEnum(Direction),
  status: z.nativeEnum(TradeStatus).default("OPEN"),
  entryMode: z.nativeEnum(EntryMode).default("SINGLE"),
  openTime: z.string().datetime(),
  closeTime: z.string().datetime().optional().nullable(),
  openPrice: z.number(),
  closePrice: z.number().optional().nullable(),

  // Forex/Commodity
  lotSize: z.number().optional().nullable(),
  swap: z.number().default(0),

  // Multi-layer
  priceRangeHigh: z.number().optional().nullable(),
  priceRangeLow: z.number().optional().nullable(),
  layerCount: z.number().int().optional().nullable(),

  // Stocks
  quantity: z.number().optional().nullable(),
  buyFee: z.number().default(0),
  sellFee: z.number().default(0),
  taxAmount: z.number().default(0),
  dividend: z.number().default(0),

  // Crypto futures
  leverage: z.number().optional().nullable(),
  marginMode: z.nativeEnum(MarginMode).optional().nullable(),
  fundingRate: z.number().optional().nullable(),

  // P&L
  grossProfit: z.number().optional().nullable(),
  commission: z.number().default(0),
  netProfit: z.number().optional().nullable(),
  rMultiple: z.number().optional().nullable(),
  pips: z.number().optional().nullable(),

  // Risk
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  riskPercent: z.number().optional().nullable(),

  // Multi-asset: which specific asset type this trade is
  tradeMarketType: z.nativeEnum(MarketType).optional().nullable(),

  // Analysis
  setup: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // Psychology
  emotionBefore: z.number().int().min(1).max(5).optional().nullable(),
  emotionAfter: z.number().int().min(1).max(5).optional().nullable(),
  holdingMinutes: z.number().int().optional().nullable(),

  // Tags
  tagIds: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const status = searchParams.get("status") as TradeStatus | null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    account: { userId: session.user.id },
    ...(accountId && { accountId }),
    ...(status && { status }),
  };

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: {
        account: { select: { name: true, marketType: true, currency: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { openTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trade.count({ where }),
  ]);

  return NextResponse.json({ trades, total, page, limit });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  // Verify account belongs to user
  const account = await prisma.tradingAccount.findFirst({
    where: { id: parsed.data.accountId, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const { tagIds, ...tradeData } = parsed.data;

  const trade = await prisma.trade.create({
    data: {
      ...tradeData,
      openTime: new Date(tradeData.openTime),
      closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : null,
      tags: tagIds.length > 0
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      account: { select: { name: true, marketType: true, currency: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(trade, { status: 201 });
}
