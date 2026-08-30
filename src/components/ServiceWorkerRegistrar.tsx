"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that keeps the active-round route reachable
 * offline (§21). Network-first, so it never serves stale pages while online.
 * Production only — `next dev` chunks aren't hashed so the cache can't be
 * trusted. Rendered once from the root layout; update-handling is Epic 17.
 */
const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: the app works without the SW, just without the offline shell.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
};

export default ServiceWorkerRegistrar;
