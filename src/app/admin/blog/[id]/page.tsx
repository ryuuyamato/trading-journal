import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BlogPostForm, type BlogPostFormValues } from "@/components/admin/blog-post-form";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const values: BlogPostFormValues = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    published: post.published,
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[14px] font-medium">Edit Tulisan</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">{post.title}</p>
      </div>
      <BlogPostForm mode="edit" post={values} />
    </div>
  );
}
