import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { TokenPurchaseStatusBadge } from "@/components/admin/token-purchase-badges";
import { TokenPurchaseRowActions } from "@/components/admin/token-purchase-row-actions";
import { PRICE_PER_TOKEN_IDR } from "@/lib/analysis/quota";

export default async function AdminTokenPurchasesPage() {
  const purchases = await prisma.tokenPurchase.findMany({
    include: {
      user: { select: { name: true, email: true } },
      account: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[14px] font-medium">Pembelian Token</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Tinjau dan setujui permintaan pembelian token analisis AI dari pengguna.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-160">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Pengguna</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Akun</th>
                <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Jumlah</th>
                <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Total Harga</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Tanggal</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[13px] text-muted-foreground">
                    Belum ada permintaan pembelian token.
                  </td>
                </tr>
              )}
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="text-[13px] font-medium">{p.user.name}</span>
                    <p className="text-[11px] text-muted-foreground">{p.user.email}</p>
                  </td>
                  <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{p.account.name}</td>
                  <td className="py-2.5 px-4 text-right text-[13px] font-medium">{p.quantity} token</td>
                  <td className="py-2.5 px-4 text-right text-[13px] text-muted-foreground">
                    Rp {(p.quantity * PRICE_PER_TOKEN_IDR).toLocaleString("id-ID")}
                  </td>
                  <td className="py-2.5 px-4">
                    <TokenPurchaseStatusBadge status={p.status} />
                  </td>
                  <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="py-2.5 px-4">
                    <TokenPurchaseRowActions purchase={{ id: p.id, status: p.status, userName: p.user.name, quantity: p.quantity }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
