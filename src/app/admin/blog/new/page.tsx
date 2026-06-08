import { BlogPostForm } from "@/components/admin/blog-post-form";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[14px] font-medium">Tulisan Baru</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Buat tulisan blog baru.</p>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
