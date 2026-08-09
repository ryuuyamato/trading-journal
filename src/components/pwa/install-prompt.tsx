"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import { KandelMark } from "@/components/brand/kandel-mark";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noopSubscribe = () => () => {};

// Read once on the client via useSyncExternalStore rather than an effect: the
// server snapshot is `false`, so the banner is absent from the SSR output and
// appears after hydration without a state-set-in-effect.
function useClientFlag(read: () => boolean) {
  return useSyncExternalStore(noopSubscribe, read, () => false);
}

const DISMISS_KEY = "kandel-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone = useClientFlag(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari predates display-mode and uses this instead.
      (navigator as unknown as { standalone?: boolean }).standalone === true
  );
  const isIOS = useClientFlag(() => /iPad|iPhone|iPod/.test(navigator.userAgent));
  const wasDismissed = useClientFlag(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // Chrome shows its own mini-infobar unless the event is cancelled; we
      // want the install to happen from our button instead.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function close() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  // Already installed, previously dismissed, or — on browsers that fire
  // beforeinstallprompt — not yet installable.
  if (isStandalone || dismissed || wasDismissed) return null;
  if (!deferred && !isIOS) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 md:hidden">
      <KandelMark className="h-8 w-auto" />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">Pasang Kandel</p>
        <p className="text-[11px] text-muted-foreground">
          {isIOS ? (
            <>
              Ketuk <Share className="inline size-3 align-[-2px]" /> lalu &ldquo;Add to Home
              Screen&rdquo;
            </>
          ) : (
            "Buka layar penuh, langsung dari home screen"
          )}
        </p>
      </div>

      {/* iOS Safari never fires beforeinstallprompt, so there is nothing to
          trigger — that path is instructions only. */}
      {deferred && (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-md bg-primary px-3 py-2 font-display text-[12px] font-bold text-primary-foreground"
        >
          Pasang
        </button>
      )}

      <button
        type="button"
        onClick={close}
        aria-label="Tutup"
        className="shrink-0 rounded-md p-2 text-muted-foreground active:bg-accent"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
