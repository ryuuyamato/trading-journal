import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id!, isActive: true },
    select: { id: true, name: true, marketType: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav userName={session.user.name} accounts={accounts} isAdmin={session.user.role === "ADMIN"} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pt-18 pb-6 md:px-8 md:py-6">{children}</div>
      </main>
    </div>
  );
}
