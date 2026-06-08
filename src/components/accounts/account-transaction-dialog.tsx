"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AccountTransactionDialogProps {
  accountId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AccountTransactionDialog({ accountId, type, open, onOpenChange }: AccountTransactionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isDeposit = type === "DEPOSIT";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const amount = parseFloat(get("amount"));
    if (!get("amount") || isNaN(amount) || amount <= 0) {
      toast.error("Jumlah harus lebih besar dari 0");
      return;
    }

    const occurredAtStr = get("occurredAt");
    let occurredAtISO: string | undefined;
    if (occurredAtStr) {
      try { occurredAtISO = new Date(occurredAtStr).toISOString(); }
      catch { toast.error("Format tanggal tidak valid"); return; }
    }

    startTransition(async () => {
      const res = await fetch(`/api/accounts/${accountId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          note: get("note") || null,
          occurredAt: occurredAtISO,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? `Gagal mencatat ${isDeposit ? "deposit" : "penarikan"}`);
        return;
      }

      toast.success(`${isDeposit ? "Deposit" : "Penarikan"} berhasil dicatat`);
      onOpenChange(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isDeposit ? "Tambah Modal / Deposit" : "Tarik Keuntungan / Withdraw"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah *</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurredAt">Tanggal</Label>
            <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={nowLocal()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Catatan</Label>
            <Textarea id="note" name="note" placeholder="Opsional..." rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : isDeposit ? "Simpan Deposit" : "Simpan Penarikan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
