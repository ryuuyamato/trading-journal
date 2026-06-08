import { Badge } from "@/components/ui/badge";

export function UserStatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return <Badge variant="outline" className="border-transparent" style={{ backgroundColor: "color-mix(in srgb, var(--color-profit) 15%, transparent)", color: "var(--color-profit)" }}>Disetujui</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge variant="destructive">Ditolak</Badge>;
  }
  return <Badge variant="secondary">Menunggu</Badge>;
}

export function UserRoleBadge({ role }: { role: "USER" | "ADMIN" }) {
  if (role === "ADMIN") {
    return <Badge variant="outline" className="border-primary/30 text-primary">Admin</Badge>;
  }
  return <Badge variant="outline">Pengguna</Badge>;
}
