"use client";

import { useEffect } from "react";

// Registers the offline-shell worker. Renders nothing.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Registering during dev would cache Turbopack's dev assets and shadow
    // subsequent edits, so this is production-only.
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // A failed registration costs nothing but offline support — the app
        // works fine without it, so this stays silent.
      });
  }, []);

  return null;
}
