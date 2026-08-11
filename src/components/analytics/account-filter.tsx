"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface FilterAccount {
  id: string;
  name: string;
  currency: string;
}

/**
 * Satu baris filter di atas semua yang dicakupnya — bukan filter per-kartu.
 * Setiap blok di halaman ini merender ulang terhadap irisan yang sama.
 */
export function AccountFilter({ accounts, value }: { accounts: FilterAccount[]; value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selected = accounts.find((a) => a.id === value);

  function change(next: string) {
    const q = new URLSearchParams(params);
    if (next === "semua") q.delete("akun");
    else q.set("akun", next);
    startTransition(() => {
      router.push(q.size ? `/analitik?${q}` : "/analitik");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={isPending ? "" : undefined}>
      <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Akun</span>
      <Select value={value} onValueChange={(v) => v && change(v as string)}>
        <SelectTrigger className="min-w-48">
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            {selected ? `${selected.name} · ${selected.currency}` : "Semua akun"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semua">Semua akun</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name} · {a.currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
