"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadTags, invalidateTags, type TagOption } from "@/lib/tags-client";
import { toast } from "sonner";

interface TagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadTags().then((t) => {
      if (!alive) return;
      setTags(t);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  async function createTag() {
    const name = draft.trim();
    if (!name) {
      setCreating(false);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Gagal membuat tag");
      return;
    }

    const { tag } = (await res.json()) as { tag: TagOption };
    invalidateTags();
    setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    // Tag yang baru dibuat langsung menempel — itu alasan orang membuatnya di sini
    // alih-alih di halaman kelola tag.
    onChange([...value, tag.id]);
    setDraft("");
    setCreating(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {loading && <span className="text-[12px] text-muted-foreground">Memuat tag…</span>}

        {!loading && tags.length === 0 && !creating && (
          <span className="text-[12px] text-muted-foreground">
            Belum ada tag. Buat yang pertama untuk menandai pola trade-mu.
          </span>
        )}

        {tags.map((tag) => {
          const active = value.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors md:min-h-7",
                active
                  ? "border-transparent text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
              style={
                active
                  ? { backgroundColor: `color-mix(in srgb, ${tag.color} 22%, transparent)` }
                  : undefined
              }
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden
              />
              {tag.name}
              {active && <Check className="size-3 shrink-0" />}
            </button>
          );
        })}

        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-border px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary md:min-h-7"
          >
            <Plus className="size-3" />
            Tag baru
          </button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={draft}
            maxLength={40}
            disabled={busy}
            placeholder="Nama tag, mis: Revenge"
            onChange={(e) => setDraft(e.target.value)}
            // Ticket ini satu <form>; Enter di sini harus membuat tag, bukan
            // menyimpan trade yang belum selesai diisi.
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createTag();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft("");
                setCreating(false);
              }
            }}
            onBlur={() => void createTag()}
          />
        </div>
      )}
    </div>
  );
}
