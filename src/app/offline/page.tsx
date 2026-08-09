import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { KandelMark } from "@/components/brand/kandel-mark";

export const metadata: Metadata = {
  title: "Offline — Kandel",
  robots: { index: false, follow: false },
};

// Served by the service worker when a navigation fails and nothing is cached.
// Deliberately static and dependency-free: it has to render with no network.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <KandelMark className="h-10 w-auto" />

      <div className="flex items-center gap-2 text-muted-foreground">
        <WifiOff className="size-4" />
        <span className="text-[13px]">Tidak ada koneksi</span>
      </div>

      <p className="max-w-xs text-[12.5px] text-muted-foreground">
        Kandel butuh internet untuk memuat jurnal kamu. Halaman yang sudah pernah
        dibuka tetap bisa diakses.
      </p>
    </div>
  );
}
