import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Jumlah token tidak valid (min 1, maks 100)" }, { status: 400 });
  }

  const purchase = await prisma.tokenPurchase.create({
    data: {
      userId: session.user.id,
      quantity: parsed.data.quantity,
    },
  });

  return NextResponse.json(purchase, { status: 201 });
}
