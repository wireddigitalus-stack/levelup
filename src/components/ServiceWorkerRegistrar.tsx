"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Only register service worker in production
    // In dev mode, SW intercepts HMR/webpack chunks and causes MODULE_NOT_FOUND crashes
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SubsonicDNA] SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SubsonicDNA] SW registration failed:", err);
        });
    } else if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
      // In dev, UNREGISTER any existing service worker to prevent stale caching
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister();
          console.log("[SubsonicDNA] Dev mode: Unregistered stale SW");
        });
      });
    }
  }, []);

  return null;
}
