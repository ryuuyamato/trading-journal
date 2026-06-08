import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  published: z.boolean(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Tulisan tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ post });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tulisan tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, excerpt, content, published } = parsed.data;
  const slug = slugify(parsed.data.slug);
  if (!slug) {
    return NextResponse.json({ error: "Slug tidak valid" }, { status: 400 });
  }

  if (slug !== existing.slug) {
    const slugTaken = await prisma.blogPost.findUnique({ where: { slug } });
    if (slugTaken) {
      return NextResponse.json({ error: "Slug sudah digunakan, coba judul atau slug lain" }, { status: 409 });
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      published,
      publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tulisan tidak ditemukan" }, { status: 404 });

  await prisma.blogPost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
