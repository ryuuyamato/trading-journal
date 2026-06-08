"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/blog", label: "Blog" },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex items-center gap-1 border-b border-border">
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "px-3 py-2 text-[13px] transition-colors border-b-2 -mb-px",
            isActive(href)
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
