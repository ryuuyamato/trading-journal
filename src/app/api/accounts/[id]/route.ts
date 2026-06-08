import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MarketType } from "@/generated/prisma/enums";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  broker: z.string().optional().nullable(),
  marketType: z.nativeEnum(MarketType),
  currency: z.string().min(1),
  balance: z.number(),
  description: z.string().optional().nullable(),
});

async function loadOwnedAccount(accountId: string, userId: string) {
  return prisma.tradingAccount.findFirst({
    where: { id: accountId, userId },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId: session.user.id },
    include: { _count: { select: { trades: true } } },
  });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  return NextResponse.json(account);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedAccount(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.tradingAccount.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(account);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedAccount(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  await prisma.tradingAccount.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
