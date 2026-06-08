import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { TransactionType } from "@/generated/prisma/enums";

const createSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  note: z.string().optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.tradingAccount.findFirst({ where: { id, userId: session.user.id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const transactions = await prisma.accountTransaction.findMany({
    where: { accountId: id },
    orderBy: { occurredAt: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.tradingAccount.findFirst({ where: { id, userId: session.user.id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, amount, note, occurredAt } = parsed.data;
  const balanceDelta = type === "DEPOSIT" ? amount : -amount;

  // Neon's HTTP driver doesn't support transactions, so the transaction record
  // and the resulting balance update must be split into separate queries.
  const transaction = await prisma.accountTransaction.create({
    data: {
      accountId: id,
      type,
      amount,
      note: note || null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    },
  });

  await prisma.tradingAccount.update({
    where: { id },
    data: { balance: account.balance + balanceDelta },
  });

  return NextResponse.json(transaction, { status: 201 });
}
