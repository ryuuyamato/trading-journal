import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { TokenPurchaseStatus } from "@/generated/prisma/enums";

const updateSchema = z.object({
  status: z.nativeEnum(TokenPurchaseStatus),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.tokenPurchase.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const purchase = await prisma.tokenPurchase.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ purchase });
}
