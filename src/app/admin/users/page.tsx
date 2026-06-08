import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { UserStatusBadge, UserRoleBadge } from "@/components/admin/user-badges";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { tradingAccounts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[14px] font-medium">Pengguna</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Setujui akses pengguna baru, kelola peran, atau hapus akun.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-160">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Nama</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Email</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Peran</th>
                <th className="text-right py-2 px-4 text-[11px] text-muted-foreground font-medium">Akun</th>
                <th className="text-left py-2 px-4 text-[11px] text-muted-foreground font-medium">Bergabung</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group">
                  <td className="py-2.5 px-4">
                    <span className="text-[13px] font-medium">{user.name}</span>
                    {user.id === session?.user?.id && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">(Anda)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{user.email}</td>
                  <td className="py-2.5 px-4"><UserStatusBadge status={user.status} /></td>
                  <td className="py-2.5 px-4"><UserRoleBadge role={user.role} /></td>
                  <td className="py-2.5 px-4 text-right text-[13px] text-muted-foreground">{user._count.tradingAccounts}</td>
                  <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="py-2.5 px-4">
                    {user.id !== session?.user?.id && <UserRowActions user={user} />}
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
