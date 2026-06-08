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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const MARKET_TYPES = [
  { value: "FOREX", label: "Forex" },
  { value: "COMMODITY", label: "Komoditas (XAU/XAG)" },
  { value: "STOCK_IDX", label: "Saham IDX" },
  { value: "STOCK_US", label: "Saham US" },
  { value: "CRYPTO_SPOT", label: "Crypto Spot" },
  { value: "CRYPTO_FUTURES", label: "Crypto Futures" },
  { value: "MULTI_ASSET", label: "Multi Asset (IB / Universal)" },
];

const CURRENCIES = ["USD", "IDR", "EUR", "USDT", "USC"];

export function CreateAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [marketType, setMarketType] = useState("");
  const [currency, setCurrency] = useState("USD");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      broker: (form.elements.namedItem("broker") as HTMLInputElement).value || undefined,
      marketType,
      currency,
      balance: parseFloat((form.elements.namedItem("balance") as HTMLInputElement).value) || 0,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value || undefined,
    };

    if (!marketType) {
      toast.error("Pilih tipe market");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Gagal membuat akun");
        return;
      }

      toast.success("Akun berhasil dibuat");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Akun Baru
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Akun Trading</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Akun *</Label>
            <Input id="name" name="name" placeholder="Mis: Forex Main" required />
          </div>

          <div className="space-y-2">
            <Label>Tipe Market *</Label>
            <Select value={marketType} onValueChange={(v) => v && setMarketType(v)}>
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm">
                  {marketType
                    ? MARKET_TYPES.find((m) => m.value === marketType)?.label
                    : <span className="text-muted-foreground">Pilih tipe market</span>
                  }
                </span>
              </SelectTrigger>
              <SelectContent>
                {MARKET_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="broker">Broker</Label>
              <Input id="broker" name="broker" placeholder="Mis: ICMarkets" />
            </div>
            <div className="space-y-2">
              <Label>Mata Uang</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">{currency}</span>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Modal Awal</Label>
            <Input id="balance" name="balance" type="number" step="0.01" placeholder="0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" name="description" placeholder="Opsional..." rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
