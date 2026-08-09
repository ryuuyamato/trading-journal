import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Library,
  BarChart2,
  ClipboardList,
  Calendar,
  CalendarOff,
  Sparkles,
  Newspaper,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Everyday screens — these get the primary block of the rail and the mobile
// bottom bar.
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Jurnal", icon: BookOpen },
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/calendar", label: "Kalender Ekonomi", icon: Calendar },
  { href: "/no-trade-days", label: "No Trade Day", icon: CalendarOff },
  { href: "/analisis-ai", label: "Analisis AI", icon: Sparkles },
];

// Reference / long-form screens, separated by a rule in the rail.
export const SECONDARY_NAV: NavItem[] = [
  { href: "/playbook", label: "Playbook", icon: Library },
  { href: "/analitik", label: "Analitik", icon: BarChart2 },
  { href: "/review", label: "Review", icon: ClipboardList },
  { href: "/blog", label: "Blog", icon: Newspaper },
];

export const ADMIN_NAV: NavItem = {
  href: "/admin",
  label: "Admin Panel",
  icon: ShieldCheck,
};

// The five that fit a phone bottom bar without crowding.
export const MOBILE_NAV: NavItem[] = PRIMARY_NAV.slice(0, 5);

export function isNavActive(pathname: string, href: string): boolean {
  // /dashboard must match exactly — every other route would otherwise be
  // shadowed by it being a prefix of nothing, while /trades should stay lit on
  // /trades/[id].
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
