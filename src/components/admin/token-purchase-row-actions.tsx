"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export interface AdminTokenPurchaseItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  userName: string;
  quantity: number;
}

export function TokenPurchaseRowActions({ purchase }: { purchase: AdminTokenPurchaseItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function patch(data: { status: string }, successMsg: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/token-purchases/${purchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal memperbarui permintaan");
        return;
      }
      toast.success(successMsg);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors data-[popup-open]:opacity-100"
            aria-label="Aksi permintaan"
          />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {purchase.status !== "APPROVED" && (
          <DropdownMenuItem
            className="gap-2"
            disabled={isPending}
            onClick={() => patch({ status: "APPROVED" }, `Permintaan ${purchase.quantity} token disetujui`)}
          >
            <Check className="h-3.5 w-3.5" />
            Setujui
          </DropdownMenuItem>
        )}
        {purchase.status !== "REJECTED" && (
          <DropdownMenuItem
            className="gap-2"
            disabled={isPending}
            onClick={() => patch({ status: "REJECTED" }, `Permintaan ${purchase.quantity} token ditolak`)}
          >
            <X className="h-3.5 w-3.5" />
            Tolak
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
