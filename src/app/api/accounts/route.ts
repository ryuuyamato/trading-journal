import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MarketType } from "@/generated/prisma/enums";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  broker: z.string().optional(),
  marketType: z.nativeEnum(MarketType),
  currency: z.string().default("USD"),
  balance: z.number().default(0),
  description: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { trades: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.tradingAccount.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
