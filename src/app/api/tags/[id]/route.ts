import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

/** Memuat tag hanya kalau ia milik pemanggil — mencegah tag orang lain disentuh. */
async function loadOwnedTag(id: string, userId: string) {
  return prisma.tag.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedTag(id, session.user.id))) {
    return NextResponse.json({ error: "Tag tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  if (parsed.data.name) {
    const duplicate = await prisma.tag.findFirst({
      where: { userId: session.user.id, name: parsed.data.name, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) return NextResponse.json({ error: "Tag dengan nama itu sudah ada" }, { status: 409 });
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, color: true },
  });

  return NextResponse.json({ tag });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedTag(id, session.user.id))) {
    return NextResponse.json({ error: "Tag tidak ditemukan" }, { status: 404 });
  }

  // TradeTag ikut terhapus lewat cascade — trade-nya sendiri tidak tersentuh.
  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
