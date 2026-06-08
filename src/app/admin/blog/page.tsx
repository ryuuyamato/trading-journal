import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlogPostRowActions } from "@/components/admin/blog-post-row-actions";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-medium">Blog</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Tulisan ini hanya bisa dibaca oleh pengguna yang sudah masuk dan disetujui — tidak diindeks Google.
          </p>
        </div>
        <Button size="sm" className="gap-2" render={<Link href="/admin/blog/new" />}>
          <Plus className="h-3.5 w-3.5" />
          Tulisan Baru
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
          Belum ada tulisan. Klik &ldquo;Tulisan Baru&rdquo; untuk membuat yang pertama.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-140">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Judul</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Penulis</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Dibuat</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group">
                    <td className="py-2.5 px-4">
                      <Link href={`/admin/blog/${post.id}`} className="text-[13px] font-medium hover:underline">
                        {post.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground truncate max-w-xs">/blog/{post.slug}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      {post.published ? (
                        <Badge variant="outline" className="border-transparent" style={{ backgroundColor: "color-mix(in srgb, var(--color-profit) 15%, transparent)", color: "var(--color-profit)" }}>
                          Dipublikasikan
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{post.author.name}</td>
                    <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{formatDate(post.createdAt)}</td>
                    <td className="py-2.5 px-4">
                      <BlogPostRowActions post={{ id: post.id, title: post.title }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
