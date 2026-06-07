import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; screenshotId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, screenshotId } = await params;
  const screenshot = await prisma.tradeScreenshot.findFirst({
    where: { id: screenshotId, tradeId: id, trade: { account: { userId: session.user.id } } },
  });
  if (!screenshot) return NextResponse.json({ error: "Screenshot tidak ditemukan" }, { status: 404 });

  await prisma.tradeScreenshot.delete({ where: { id: screenshotId } });

  return NextResponse.json({ ok: true });
}
