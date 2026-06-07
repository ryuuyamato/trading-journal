"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImagePlus, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";

interface Screenshot {
  id: string;
  url: string;
  caption: string | null;
}

export function TradeScreenshots({ tradeId, screenshots }: { tradeId: string; screenshots: Screenshot[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const url = (form.elements.namedItem("url") as HTMLInputElement)?.value.trim();
    const caption = (form.elements.namedItem("caption") as HTMLInputElement)?.value.trim();

    if (!url) { toast.error("URL gambar wajib diisi"); return; }

    startTransition(async () => {
      const res = await fetch(`/api/trades/${tradeId}/screenshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, caption: caption || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menambah screenshot");
        return;
      }
      toast.success("Screenshot ditambahkan");
      setAddOpen(false);
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    startTransition(async () => {
      const res = await fetch(`/api/trades/${tradeId}/screenshots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus screenshot");
        setRemovingId(null);
        return;
      }
      toast.success("Screenshot dihapus");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Screenshot</h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <ImagePlus className="h-3.5 w-3.5" />
          Tambah
        </Button>
      </div>

      {screenshots.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="h-6 w-6 opacity-50" />
          <p className="text-[12px]">Belum ada screenshot untuk trade ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {screenshots.map((s) => (
            <div key={s.id} className="group relative rounded-lg overflow-hidden border border-border">
              {/* External, user-supplied URLs — next/image's optimizer would need every host allow-listed */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.caption ?? "Trade screenshot"} className="w-full h-32 object-cover bg-muted" />
              {s.caption && (
                <p className="px-2 py-1 text-[11px] text-muted-foreground truncate">{s.caption}</p>
              )}
              <button
                type="button"
                disabled={isPending && removingId === s.id}
                onClick={() => handleRemove(s.id)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                aria-label="Hapus screenshot"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Screenshot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="url">URL Gambar *</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Keterangan</Label>
              <Input id="caption" name="caption" placeholder="Mis: Entry M5, konfirmasi breakout" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
