import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// One labelled control. The label sits in a fixed small size above the input so
// every row in the ticket lines up regardless of which market is selected.
export function Field({
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
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-normal tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="text-[10.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Groups a set of fields under a quiet rule, keeping long tabs scannable.
export function FieldSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {title && (
        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
