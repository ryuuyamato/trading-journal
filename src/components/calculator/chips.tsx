"use client";

import { cn } from "@/lib/utils";

// A row of mutually exclusive choices. Used throughout the calculator in place
// of dropdowns: every option stays visible, which matters when the whole point
// of the screen is comparing setups.
export function ChipGroup<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "num min-h-11 rounded-md border px-2.5 text-[11.5px] transition-colors md:min-h-0 md:py-1.5",
              active
                ? "border-primary bg-primary font-semibold text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Same look, but each press just fires an action rather than selecting a value.
export function ChipActions({
  options,
  onSelect,
  className,
}: {
  options: { value: number; label: string }[];
  onSelect: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onSelect(opt.value)}
          className="num min-h-11 rounded-md border border-border bg-secondary px-2.5 text-[11.5px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground md:min-h-0 md:py-1.5"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CalcField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[11.5px] text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10.5px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </p>
  );
}
