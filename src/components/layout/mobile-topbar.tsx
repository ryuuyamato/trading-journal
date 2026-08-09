"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV,
  MORE_NAV,
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavActive,
} from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { KandelMark } from "@/components/brand/kandel-mark";

const ALL_DESTINATIONS = [...PRIMARY_NAV, ...SECONDARY_NAV, ...MORE_NAV, ADMIN_NAV];

function usePageTitle() {
  const pathname = usePathname();
  // Longest href first, so /accounts/[id] resolves to Akun rather than being
  // shadowed by a shorter prefix.
  const match = [...ALL_DESTINATIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isNavActive(pathname, item.href));
  return match?.label ?? "Kandel";
}

// Phone header: identity on the left, where you are in the middle, theme on the
// right. Account switching and the record button moved to the tab bar and Home,
// which is what made the desktop bar feel cramped at 375px.
export function MobileTopBar() {
  const title = usePageTitle();

  return (
    // Padding carries the status-bar inset and the inner row keeps its own
    // fixed height, so the bar grows on notched devices instead of squashing.
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-sidebar pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-13 items-center gap-2 px-3">
        <Link href="/dashboard" className="flex shrink-0 items-center" aria-label="Kandel">
          <KandelMark className="h-6 w-auto" />
        </Link>

        <span className="flex-1 truncate text-center font-display text-[14px] font-bold tracking-tight">
          {title}
        </span>

        <div className="flex shrink-0 items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
