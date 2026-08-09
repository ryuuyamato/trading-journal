"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ADMIN_NAV, MORE_NAV, isNavActive } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

// Everything that doesn't fit the four tab slots, as a bottom sheet grid.
export function MoreSheet({
  open,
  onOpenChange,
  isAdmin,
  userName,
  userEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...MORE_NAV, ADMIN_NAV] : MORE_NAV;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-left text-[13px] font-semibold tracking-wide uppercase">
            Menu
          </SheetTitle>
          {userName && (
            <p className="text-left text-[11.5px] text-muted-foreground">
              {userName}
              {userEmail ? ` · ${userEmail}` : ""}
            </p>
          )}
        </SheetHeader>

        <div className="grid grid-cols-4 gap-1 overflow-y-auto px-3 pb-3">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  // 64px min height keeps every target comfortably past the
                  // 44px touch minimum.
                  "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-md px-1 py-2 text-center transition-colors active:bg-accent",
                  active ? "bg-accent/60 text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "text-primary")} />
                <span className="line-clamp-2 text-[10.5px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-border px-3 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-[13px] font-medium text-destructive transition-colors active:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
