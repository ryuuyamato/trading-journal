import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { TokenPurchaseStatusBadge } from "@/components/admin/token-purchase-badges";
import { TokenPurchaseRowActions } from "@/components/admin/token-purchase-row-actions";
import { GrantTokenDialog } from "@/components/admin/grant-token-dialog";
import { PRICE_PER_TOKEN_IDR } from "@/lib/analysis/constants";
import { getPurchasedTokenLedger } from "@/lib/analysis/quota";

export default async function AdminTokenPurchasesPage() {
  const [purchases, users, ledger] = await Promise.all([
    prisma.tokenPurchase.findMany({
      include: {
        user: { select: { name: true, email: true } },
        grantedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getPurchasedTokenLedger(),
  ]);

  const usersWithBalance = users.map((u) => ({
    ...u,
    ...(ledger.get(u.id) ?? { granted: 0, used: 0, balance: 0 }),
  }));
  const withTokens = usersWithBalance.filter((u) => u.granted > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium">Pembelian Token</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Tambahkan token setelah pembayaran diterima, atau tinjau permintaan yang diajukan
            pengguna. Token berlaku untuk semua akun trading pengguna.
          </p>
        </div>
        <GrantTokenDialog users={usersWithBalance} />
      </div>

      <div className="space-y-2">
        <h3 className="text-[13px] font-medium">Saldo Token Pengguna</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-120">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Pengguna</th>
                  <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Diberikan</th>
                  <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Terpakai</th>
                  <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {withTokens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[13px] text-muted-foreground">
                      Belum ada pengguna yang memiliki token berbayar.
                    </td>
                  </tr>
                )}
                {withTokens.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="text-[13px] font-medium">{u.name}</span>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-2.5 px-4 text-right text-[13px] num text-muted-foreground">{u.granted}</td>
                    <td className="py-2.5 px-4 text-right text-[13px] num text-muted-foreground">{u.used}</td>
                    <td className="py-2.5 px-4 text-right text-[13px] num font-medium">{u.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[13px] font-medium">Riwayat</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-160">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Pengguna</th>
                  <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Jumlah</th>
                  <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Total Harga</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Asal</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Tanggal</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[13px] text-muted-foreground">
                      Belum ada riwayat token.
                    </td>
                  </tr>
                )}
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="text-[13px] font-medium">{p.user.name}</span>
                      <p className="text-[11px] text-muted-foreground">{p.user.email}</p>
                    </td>
                    <td className="py-2.5 px-4 text-right text-[13px] font-medium num">{p.quantity} token</td>
                    <td className="py-2.5 px-4 text-right text-[13px] text-muted-foreground num">
                      Rp {(p.quantity * PRICE_PER_TOKEN_IDR).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[12px]">
                        {p.grantedById ? `Ditambahkan ${p.grantedBy?.name ?? "admin"}` : "Diminta pengguna"}
                      </span>
                      {p.note && <p className="text-[11px] text-muted-foreground">{p.note}</p>}
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
    </div>
  );
}
