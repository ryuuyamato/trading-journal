import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminOverviewPage() {
  const [totalUsers, pendingUsers, approvedUsers, rejectedUsers, totalPosts, publishedPosts] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { status: "REJECTED" } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-[14px] font-medium">Pengguna</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard label="Total pengguna" value={totalUsers.toString()} />
          <StatCard
            label="Menunggu persetujuan"
            value={pendingUsers.toString()}
            trend={pendingUsers > 0 ? "negative" : "neutral"}
          />
          <StatCard label="Disetujui" value={approvedUsers.toString()} trend="positive" />
          <StatCard label="Ditolak" value={rejectedUsers.toString()} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-[14px] font-medium">Blog</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard label="Total tulisan" value={totalPosts.toString()} />
          <StatCard label="Dipublikasikan" value={publishedPosts.toString()} trend="positive" />
          <StatCard label="Draft" value={(totalPosts - publishedPosts).toString()} />
        </div>
      </div>

      {pendingUsers > 0 && (
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <p className="text-[13px]">
            Ada <span className="font-medium">{pendingUsers} pengguna</span> menunggu persetujuan akses.{" "}
            <a href="/admin/users" className="text-primary hover:underline">
              Tinjau di halaman Pengguna →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
