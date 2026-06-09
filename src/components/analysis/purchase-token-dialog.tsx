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
} from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { PRICE_PER_TOKEN_IDR } from "@/lib/analysis/quota";

interface Props {
  accountId: string;
}

export function PurchaseTokenButton({ accountId }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium rounded-md border border-border text-foreground transition-colors hover:bg-secondary"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Beli Token
      </button>
      <PurchaseTokenDialog accountId={accountId} open={open} onOpenChange={setOpen} />
    </>
  );
}

interface DialogProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseTokenDialog({ accountId, open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);

  const totalPrice = quantity * PRICE_PER_TOKEN_IDR;
  const totalFormatted = `Rp ${totalPrice.toLocaleString("id-ID")}`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (quantity < 1 || quantity > 100) {
      toast.error("Jumlah token harus antara 1 dan 100");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${accountId}/token-purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal mengirim permintaan pembelian");
        return;
      }
      toast.success(`Permintaan pembelian ${quantity} token terkirim, menunggu persetujuan admin`);
      onOpenChange(false);
      setQuantity(1);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Beli Token Analisis AI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <p className="text-[12.5px] text-muted-foreground">
              Token yang dibeli bersifat permanen dan tidak hangus. Admin akan memproses
              pembayaran secara manual dan menyetujui permintaan Anda.
            </p>
            <p className="text-[12.5px] text-muted-foreground">
              Harga: <span className="font-medium text-foreground">Rp {PRICE_PER_TOKEN_IDR.toLocaleString("id-ID")} / token</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah token</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              required
            />
          </div>
          <div className="rounded-lg bg-secondary/50 px-3 py-2.5 flex items-center justify-between">
            <span className="text-[12.5px] text-muted-foreground">Total pembayaran</span>
            <span className="text-[14px] font-semibold">{totalFormatted}</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
