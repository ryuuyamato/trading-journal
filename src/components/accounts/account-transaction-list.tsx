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
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { formatCentWithUsd } from "@/lib/utils";
import { toast } from "sonner";

export interface AccountTransactionItem {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  occurredAt: string;
}

function formatAmount(amount: number, currency: string, type: string) {
  const sign = type === "DEPOSIT" ? "+" : "-";
  if (currency === "IDR") return `${sign}Rp ${amount.toLocaleString("id-ID")}`;
  if (currency === "USC") return formatCentWithUsd(amount, sign);
  return `${sign}$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}

export function AccountTransactionList({
  accountId,
  currency,
  transactions,
}: {
  accountId: string;
  currency: string;
  transactions: AccountTransactionItem[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<AccountTransactionItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!target) return;
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${accountId}/transactions/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal menghapus transaksi");
        return;
      }
      toast.success("Transaksi berhasil dihapus");
      setTarget(null);
      router.refresh();
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center text-[13px] text-muted-foreground border border-border rounded-xl">
        Belum ada riwayat deposit / withdraw.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {transactions.map((tx) => {
          const isDeposit = tx.type === "DEPOSIT";
          return (
            <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-2.5 group">
              <div className="flex items-center gap-2.5 min-w-0">
                {isDeposit ? (
                  <ArrowDownCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-profit)" }} />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-loss)" }} />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{isDeposit ? "Deposit" : "Withdraw"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {formatDate(tx.occurredAt)}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: isDeposit ? "var(--color-profit)" : "var(--color-loss)" }}
                >
                  {formatAmount(tx.amount, currency, tx.type)}
                </span>
                <button
                  type="button"
                  onClick={() => setTarget(tx)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Hapus transaksi"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus transaksi ini?</DialogTitle>
          </DialogHeader>
          {target && (
            <p className="text-[13px] text-muted-foreground">
              {target.type === "DEPOSIT" ? "Deposit" : "Withdraw"} sebesar{" "}
              <span className="font-medium text-foreground">{formatAmount(target.amount, currency, target.type)}</span>{" "}
              akan dihapus dan saldo akun disesuaikan kembali. Tindakan ini tidak bisa dibatalkan.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTarget(null)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
