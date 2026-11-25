"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Records one page view per public navigation (skips /admin).
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/api") || pathname.startsWith("/print-station")) {
      return;
    }

    const ctrl = new AbortController();
    void fetch("/api/analytics/visit", {
      method: "POST",
      signal: ctrl.signal,
      keepalive: true,
    }).catch(() => {
      /* ignore offline / abort */
    });

    return () => ctrl.abort();
  }, [pathname]);

  return null;
}
