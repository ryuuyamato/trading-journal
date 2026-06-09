import { Badge } from "@/components/ui/badge";

export function TokenPurchaseStatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return (
      <Badge variant="outline" className="border-transparent" style={{ backgroundColor: "color-mix(in srgb, var(--color-profit) 15%, transparent)", color: "var(--color-profit)" }}>
        Disetujui
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return <Badge variant="destructive">Ditolak</Badge>;
  }
  return <Badge variant="secondary">Menunggu</Badge>;
}
