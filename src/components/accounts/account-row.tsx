"use client";

import { useRouter } from "next/navigation";

export function AccountRow({
  accountId,
  actions,
  children,
}: {
  accountId: string;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/accounts/${accountId}`)}
      className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group cursor-pointer"
    >
      {children}
      <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
        {actions}
      </td>
    </tr>
  );
}
