import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  published: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, excerpt, content, published } = parsed.data;
  const slug = slugify(parsed.data.slug || title);
  if (!slug) {
    return NextResponse.json({ error: "Slug tidak valid" }, { status: 400 });
  }

  const slugTaken = await prisma.blogPost.findUnique({ where: { slug } });
  if (slugTaken) {
    return NextResponse.json({ error: "Slug sudah digunakan, coba judul atau slug lain" }, { status: 409 });
  }

  const post = await prisma.blogPost.create({
    data: {
      authorId: session.user.id,
      title,
      slug,
      excerpt: excerpt || null,
      content,
      published: published ?? false,
      publishedAt: published ? new Date() : null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
