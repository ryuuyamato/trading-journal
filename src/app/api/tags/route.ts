import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus dalam format hex, mis. #6366f1")
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, color: true, _count: { select: { trades: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color, tradeCount: t._count.trades })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nama tag wajib diisi (maks 40 karakter)" }, { status: 400 });
  }

  // @@unique([userId, name]) menjaga ini di level database; pengecekan di sini
  // hanya supaya pesannya bisa dibaca manusia.
  const duplicate = await prisma.tag.findFirst({
    where: { userId: session.user.id, name: parsed.data.name },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ error: "Tag dengan nama itu sudah ada" }, { status: 409 });

  const tag = await prisma.tag.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      ...(parsed.data.color ? { color: parsed.data.color } : {}),
    },
    select: { id: true, name: true, color: true },
  });

  return NextResponse.json({ tag: { ...tag, tradeCount: 0 } }, { status: 201 });
}
