import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/tags/tag-manager";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, color: true, _count: { select: { trades: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">Tag</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Tandai pola yang berulang — revenge trade, FOMO, setup A+, entry saat news.
          Tag inilah yang nanti membuat Analitik bisa menunjukkan kebiasaan mana yang
          benar-benar merugikanmu. Tag bisa dipasang langsung saat mencatat trade.
        </p>
      </div>

      <TagManager
        initialTags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          tradeCount: t._count.trades,
        }))}
      />
    </div>
  );
}
