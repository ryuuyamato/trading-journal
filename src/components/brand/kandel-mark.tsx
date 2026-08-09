import { cn } from "@/lib/utils";

// The Kandel mark: a K built from one candlestick — wick + body form the stem,
// the two arms are price direction. Geometry is lifted from
// kandel-brand/svg/kandel-mark.svg, re-expressed in the artwork's own
// coordinate space so it scales from a 16px favicon to a login header.
//
// The kit forbids recolouring outside its supplied variants, so there are
// exactly two: `duotone` (the yellow pair, theme-aware) and `mono`
// (currentColor — for placement on top of yellow or in a single-colour context).
export function KandelMark({
  variant = "duotone",
  className,
}: {
  variant?: "duotone" | "mono";
  className?: string;
}) {
  const arms = variant === "mono" ? "currentColor" : "var(--primary-deep)";
  const stem = variant === "mono" ? "currentColor" : "var(--primary)";

  return (
    <svg
      viewBox="18 11.5 66 77"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g stroke={arms} strokeWidth="13" strokeLinecap="round">
        <path d="M42 50 L78 18" />
        <path d="M42 50 L78 82" />
      </g>
      <rect x="23.5" y="12" width="7" height="76" rx="3.5" fill={stem} />
      <rect x="18" y="26" width="18" height="48" rx="6" fill={stem} />
    </svg>
  );
}

// Mark + wordmark. The kit sets a 120px minimum width for the full lockup, so
// anything tighter than that should use <KandelMark /> on its own.
export function KandelLockup({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <KandelMark className="h-[1.15em] w-auto" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1em] font-bold tracking-tight">Kandel</span>
        {showTagline && (
          <span className="mt-0.5 text-[0.55em] tracking-[0.18em] text-muted-foreground uppercase">
            Trading Journal
          </span>
        )}
      </span>
    </span>
  );
}
