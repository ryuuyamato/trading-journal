"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  ADMIN_NAV,
  MOBILE_NAV,
  isNavActive,
  type NavItem,
} from "@/components/layout/nav-items";

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md px-[13px] transition-colors",
        active
          ? "bg-accent/60 text-foreground"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
    >
      {/* Position marker: a brand tick on the rail edge stays readable when the
          rail is collapsed to icons only. */}
      <span
        className={cn(
          "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
      {/* Label is laid out at all times and revealed with the rail, so the icon
          never shifts horizontally on hover. */}
      <span className="truncate text-[13px] opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
        {item.label}
      </span>
    </Link>
  );
}

export function AppRail({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop rail ─────────────────────────────────────────────────
          Collapsed to 56px, overlays content when it expands so the page
          beside it never reflows. */}
      <aside
        className={cn(
          "group/rail fixed top-12 bottom-0 left-0 z-30 hidden w-14 flex-col overflow-hidden",
          "border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
          "hover:w-52 hover:shadow-xl hover:shadow-black/20 md:flex"
        )}
      >
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
          {PRIMARY_NAV.map((item) => (
            <RailLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
          ))}

          <div className="my-1.5 border-t border-sidebar-border" />

          {SECONDARY_NAV.map((item) => (
            <RailLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
          ))}

          {isAdmin && (
            <>
              <div className="my-1.5 border-t border-sidebar-border" />
              <RailLink item={ADMIN_NAV} active={isNavActive(pathname, ADMIN_NAV.href)} />
            </>
          )}
        </nav>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────────────────────────
          A hover-expanding rail is meaningless on touch, so the phone gets a
          fixed five-slot tab bar instead. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-sidebar-border bg-sidebar md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-b bg-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="size-[18px]" />
              <span className="max-w-full truncate px-1 text-[10px] leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
