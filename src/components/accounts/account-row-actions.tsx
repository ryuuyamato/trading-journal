"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountFormDialog, type AccountFormValues } from "@/components/accounts/account-form-dialog";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export function AccountRowActions({ account, tradeCount }: { account: AccountFormValues; tradeCount: number }) {
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
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
              aria-label="Aksi akun"
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="gap-2" onClick={() => router.push(`/accounts/${account.id}`)}>
            <Eye className="h-3.5 w-3.5" />
            Lihat detail
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
