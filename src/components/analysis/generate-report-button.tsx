"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  accountId: string;
  remaining: number;
}

export function GenerateReportButton({ accountId, remaining }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/analysis`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat analisis");
      router.push(`/analisis-ai/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  const disabled = loading || remaining <= 0;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={generate}
        disabled={disabled}
        className="flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium rounded-md border border-foreground bg-foreground text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Membuat analisis…" : remaining <= 0 ? "Token bulan ini habis" : "Buat Analisis Baru"}
      </button>
      {error && <p className="text-[11px] text-red-500 max-w-72 text-right">{error}</p>}
    </div>
  );
}
