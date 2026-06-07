"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TradeFormDialog, type TradeFormValues } from "@/components/trades/trade-form-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  marketType: string;
  currency: string;
}

export function TradeDetailActions({ trade, accounts }: { trade: TradeFormValues; accounts: Account[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus trade");
        return;
      }
      toast.success("Trade berhasil dihapus");
      setDeleteOpen(false);
      router.push("/trades");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" className="gap-2" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </Button>
      </div>

      <TradeFormDialog accounts={accounts} mode="edit" trade={trade} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus trade ini?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Trade <span className="font-medium text-foreground">{trade.symbol}</span> akan dihapus permanen beserta tag dan screenshot terkait. Tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Menghapus..." : "Hapus Trade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
