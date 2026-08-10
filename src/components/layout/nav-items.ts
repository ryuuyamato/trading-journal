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
  Settings,
  Calculator,
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
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
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

export const SETTINGS_NAV: NavItem = {
  href: "/settings",
  label: "Setelan",
  icon: Settings,
};

// The phone tab bar holds four destinations around the centre action button.
// Everything else lives behind "Lainnya".
const TAB_HREFS = ["/dashboard", "/trades", "/accounts"];

export const MOBILE_TABS: NavItem[] = TAB_HREFS.map(
  (href) => PRIMARY_NAV.find((i) => i.href === href)!
);

// Derived rather than hand-listed, so a destination added to PRIMARY_NAV or
// SECONDARY_NAV shows up on the phone automatically instead of silently going
// missing.
export const MORE_NAV: NavItem[] = [
  ...PRIMARY_NAV.filter((i) => !TAB_HREFS.includes(i.href)),
  ...SECONDARY_NAV,
  SETTINGS_NAV,
];

export function isNavActive(pathname: string, href: string): boolean {
  // /dashboard must match exactly — every other route would otherwise be
  // shadowed by it being a prefix of nothing, while /trades should stay lit on
  // /trades/[id].
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
