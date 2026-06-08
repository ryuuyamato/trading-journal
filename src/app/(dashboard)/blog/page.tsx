import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — TradeJournal",
  robots: { index: false, follow: false },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-[20px] font-medium">Blog</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Tulisan dan update khusus untuk pengguna TradeJournal.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
          <Newspaper className="h-5 w-5 mx-auto mb-2 opacity-50" />
          Belum ada tulisan yang dipublikasikan.
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-border px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <h2 className="text-[14px] font-medium">{post.title}</h2>
              {post.excerpt && (
                <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
              )}
              {post.publishedAt && (
                <p className="text-[11px] text-muted-foreground mt-2">{formatDate(post.publishedAt)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
