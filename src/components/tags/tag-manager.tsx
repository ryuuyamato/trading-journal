"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { invalidateTags, type TagOption } from "@/lib/tags-client";

// Palet tetap, bukan color picker bebas: label yang bisa dibedakan sekilas jauh
// lebih berguna daripada label yang bisa berwarna apa saja.
const PALETTE = [
  "#6366f1", "#22c55e", "#0ea5e9", "#f97316",
  "#ef4444", "#a855f7", "#eab308", "#14b8a6",
];

export function TagManager({ initialTags }: { initialTags: TagOption[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PALETTE[0]);

  function refresh() {
    invalidateTags();
    router.refresh();
  }

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: newColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal membuat tag");
        return;
      }
      const { tag } = (await res.json()) as { tag: TagOption };
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      toast.success(`Tag "${tag.name}" dibuat`);
      refresh();
    });
  }

  function startEdit(tag: TagOption) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: editColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal memperbarui tag");
        return;
      }
      setTags((prev) =>
        prev
          .map((t) => (t.id === id ? { ...t, name, color: editColor } : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      refresh();
    });
  }

  function remove(tag: TagOption) {
    const warning =
      tag.tradeCount > 0
        ? `Hapus tag "${tag.name}"? Tag ini terpasang di ${tag.tradeCount} trade dan akan dilepas dari semuanya. Trade-nya sendiri tidak ikut terhapus.`
        : `Hapus tag "${tag.name}"?`;
    if (!confirm(warning)) return;

    startTransition(async () => {
      const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus tag");
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      toast.success(`Tag "${tag.name}" dihapus`);
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="rounded-xl border border-border p-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="tagName" className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Tag baru
          </Label>
          <div className="flex gap-2">
            <Input
              id="tagName"
              value={newName}
              maxLength={40}
              placeholder="Mis: Revenge, FOMO, Setup A+"
              onChange={(e) => setNewName(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" size="sm" className="shrink-0 gap-1.5" disabled={isPending || !newName.trim()}>
              <Plus className="size-3.5" />
              Tambah
            </Button>
          </div>
        </div>
        <ColorSwatches value={newColor} onChange={setNewColor} />
      </form>

      <div className="rounded-xl border border-border overflow-hidden">
        {tags.length === 0 && (
          <p className="py-12 text-center text-[13px] text-muted-foreground">
            Belum ada tag.
          </p>
        )}

        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0"
          >
            {editingId === tag.id ? (
              <>
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={editName}
                    maxLength={40}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveEdit(tag.id); }
                      if (e.key === "Escape") { e.preventDefault(); setEditingId(null); }
                    }}
                  />
                  <ColorSwatches value={editColor} onChange={setEditColor} />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" disabled={isPending} onClick={() => saveEdit(tag.id)} aria-label="Simpan">
                    <Check className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Batal">
                    <X className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{tag.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground num">
                  {tag.tradeCount} trade
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => startEdit(tag)} aria-label={`Ubah ${tag.name}`}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" disabled={isPending} onClick={() => remove(tag)} aria-label={`Hapus ${tag.name}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Warna tag">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Warna ${color}`}
          aria-pressed={value === color}
          className={cn(
            "size-7 rounded-full border-2 transition-transform md:size-6",
            value === color ? "border-foreground scale-110" : "border-transparent",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
