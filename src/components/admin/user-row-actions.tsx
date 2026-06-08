"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Check, X, Clock, ShieldCheck, ShieldOff, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function UserRowActions({ user }: { user: AdminUserItem }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function patch(data: Partial<{ role: string; status: string }>, successMsg: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal memperbarui pengguna");
        return;
      }
      toast.success(successMsg);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus pengguna");
        return;
      }
      toast.success("Pengguna berhasil dihapus");
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
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors data-[popup-open]:opacity-100"
              aria-label="Aksi pengguna"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user.status !== "APPROVED" && (
            <DropdownMenuItem className="gap-2" disabled={isPending} onClick={() => patch({ status: "APPROVED" }, "Akses pengguna disetujui")}>
              <Check className="h-3.5 w-3.5" />
              Setujui akses
            </DropdownMenuItem>
          )}
          {user.status !== "REJECTED" && (
            <DropdownMenuItem className="gap-2" disabled={isPending} onClick={() => patch({ status: "REJECTED" }, "Akses pengguna ditolak")}>
              <X className="h-3.5 w-3.5" />
              Tolak akses
            </DropdownMenuItem>
          )}
          {user.status !== "PENDING" && (
            <DropdownMenuItem className="gap-2" disabled={isPending} onClick={() => patch({ status: "PENDING" }, "Status diatur ke menunggu persetujuan")}>
              <Clock className="h-3.5 w-3.5" />
              Atur ke menunggu
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.role === "USER" ? (
            <DropdownMenuItem className="gap-2" disabled={isPending} onClick={() => patch({ role: "ADMIN" }, "Pengguna dijadikan admin")}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Jadikan admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="gap-2" disabled={isPending} onClick={() => patch({ role: "USER" }, "Akses admin pengguna dicabut")}>
              <ShieldOff className="h-3.5 w-3.5" />
              Cabut akses admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus pengguna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus pengguna ini?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Akun <span className="font-medium text-foreground">{user.name}</span> ({user.email}) beserta
            seluruh data trading miliknya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Menghapus..." : "Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
