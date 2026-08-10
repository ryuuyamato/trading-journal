import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Pemberian token langsung oleh admin. Pembayaran ditangani pihak ketiga di luar
// aplikasi, jadi barisnya langsung APPROVED — tidak ada yang perlu disetujui lagi.
const grantSchema = z.object({
  userId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(1000),
  note: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid (jumlah 1-1000, catatan maks 200 karakter)" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  const purchase = await prisma.tokenPurchase.create({
    data: {
      userId: target.id,
      quantity: parsed.data.quantity,
      status: "APPROVED",
      note: parsed.data.note || null,
      grantedById: session.user.id,
    },
  });

  return NextResponse.json({ purchase }, { status: 201 });
}
