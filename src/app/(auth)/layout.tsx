export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Faint grid + a single brand glow: enough atmosphere to read as a
          trading product, quiet enough not to fight the form. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] left-1/2 size-[420px] -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
        style={{ backgroundColor: "var(--brand)" }}
      />

      <div className="relative w-full max-w-sm px-4">{children}</div>
    </div>
  );
}
