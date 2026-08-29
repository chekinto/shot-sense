"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker. Rendered once from the root layout.
 * Update-handling (stale PWA / new deploy) is hardened in Epic 17.
 */
const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: the app works without the SW, just without offline shell.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
};

export default ServiceWorkerRegistrar;
