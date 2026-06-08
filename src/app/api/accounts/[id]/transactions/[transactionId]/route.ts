import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, transactionId } = await params;
  const account = await prisma.tradingAccount.findFirst({ where: { id, userId: session.user.id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const transaction = await prisma.accountTransaction.findFirst({
    where: { id: transactionId, accountId: id },
  });
  if (!transaction) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  // Reverse the balance change this transaction applied, then remove it.
  const balanceDelta = transaction.type === "DEPOSIT" ? -transaction.amount : transaction.amount;

  await prisma.tradingAccount.update({
    where: { id },
    data: { balance: account.balance + balanceDelta },
  });

  await prisma.accountTransaction.delete({ where: { id: transactionId } });

  return NextResponse.json({ ok: true });
}
