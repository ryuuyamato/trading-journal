"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

export interface BlogPostFormValues {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
}

interface BlogPostFormProps {
  mode: "create" | "edit";
  post?: BlogPostFormValues;
}

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value ?? "";
    const published = (form.elements.namedItem("published") as HTMLInputElement)?.checked ?? false;

    if (!title.trim() || !slug.trim() || !get("content").trim()) {
      toast.error("Judul, slug, dan isi tulisan wajib diisi");
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: get("excerpt").trim() || null,
      content: get("content"),
      published,
    };

    startTransition(async () => {
      const url = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${post!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? `Gagal ${mode === "create" ? "membuat" : "memperbarui"} tulisan`);
        return;
      }

      toast.success(mode === "create" ? "Tulisan berhasil dibuat" : "Tulisan berhasil diperbarui");
      router.push("/admin/blog");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Judul *</Label>
        <Input id="title" name="title" value={title} onChange={handleTitleChange} placeholder="Judul tulisan" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          placeholder="judul-tulisan"
          required
        />
        <p className="text-[11px] text-muted-foreground">URL: /blog/{slug || "..."}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Ringkasan</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} placeholder="Ringkasan singkat (opsional)" rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Isi Tulisan *</Label>
        <Textarea id="content" name="content" defaultValue={post?.content ?? ""} placeholder="Tulis konten di sini..." rows={14} required />
      </div>

      <label className="flex items-center gap-2 text-[13px] cursor-pointer w-fit">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? false}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        Publikasikan tulisan ini
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : mode === "create" ? "Buat Tulisan" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
