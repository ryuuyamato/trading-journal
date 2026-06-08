import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: { author: { select: { name: true } } },
  });
  if (!post) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Blog
        </Link>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-[22px] font-medium">{post.title}</h1>
        <p className="text-[12px] text-muted-foreground">
          {post.author.name}
          {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
        </p>
      </div>

      <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{post.content}</div>
    </div>
  );
}
