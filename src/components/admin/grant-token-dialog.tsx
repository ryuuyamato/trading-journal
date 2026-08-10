"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PRICE_PER_TOKEN_IDR } from "@/lib/analysis/constants";

export interface GrantTokenUser {
  id: string;
  name: string;
  email: string;
  balance: number;
}

export function GrantTokenDialog({ users }: { users: GrantTokenUser[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");

  const selected = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  const qty = Number.parseInt(quantity, 10);
  const validQty = Number.isFinite(qty) && qty >= 1 && qty <= 1000;

  function reset() {
    setUserId("");
    setQuantity("1");
    setNote("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) {
      toast.error("Pilih pengguna terlebih dahulu");
      return;
    }
    if (!validQty) {
      toast.error("Jumlah token harus antara 1 dan 1000");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/token-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, quantity: qty, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menambahkan token");
        return;
      }
      toast.success(`${qty} token ditambahkan untuk ${selected?.name ?? "pengguna"}`);
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-3.5 w-3.5" />
        Beri Token
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beri Token</DialogTitle>
          <DialogDescription className="text-[12px]">
            Tambahkan token ke saldo pengguna setelah pembayaran diterima. Token langsung
            aktif dan berlaku untuk semua akun trading pengguna tersebut.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pengguna *</Label>
            <Select value={userId} onValueChange={(v) => v && setUserId(v as string)}>
              <SelectTrigger className="w-full">
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                  {selected ? (
                    `${selected.name} — ${selected.email}`
                  ) : (
                    <span className="text-muted-foreground">Pilih pengguna</span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{u.name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {u.email} · saldo {u.balance} token
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {users.length === 0 && (
              <p className="text-[11px] text-muted-foreground">Belum ada pengguna terdaftar.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah Token *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={1000}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Setara Rp{" "}
              <span className="num">
                {validQty ? (qty * PRICE_PER_TOKEN_IDR).toLocaleString("id-ID") : "0"}
              </span>
              {selected && validQty && (
                <> · saldo {selected.name} menjadi <span className="num">{selected.balance + qty}</span> token</>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan Pembayaran</Label>
            <Input
              id="note"
              name="note"
              maxLength={200}
              placeholder="Mis: Transfer BCA 10 Agu — ref 8829"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Opsional, tapi disarankan — pembayaran diproses di luar aplikasi, jadi ini
              satu-satunya jejak asal token.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !userId || !validQty}>
              {isPending ? "Menambahkan…" : "Tambahkan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
