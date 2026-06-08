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
import { AccountFormDialog, type AccountFormValues } from "@/components/accounts/account-form-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AccountDetailActions({ account, tradeCount }: { account: AccountFormValues; tradeCount: number }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus akun");
        return;
      }
      toast.success("Akun berhasil dihapus");
      setDeleteOpen(false);
      router.push("/accounts");
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

      <AccountFormDialog mode="edit" account={account} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus akun ini?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Akun <span className="font-medium text-foreground">{account.name}</span> akan dihapus permanen
            {tradeCount > 0 && (
              <> beserta <span className="font-medium text-foreground">{tradeCount} trade</span> yang tercatat di dalamnya</>
            )}
            . Tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Menghapus..." : "Hapus Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
