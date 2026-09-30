"use client"

import { useEffect } from "react"

export const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    // Only register the worker in production to avoid development hot reload issues.
    if (process.env.NODE_ENV !== "production") return

    if (!("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/service-worker.js")
      } catch (error) {
        // The app works without service workers.
        console.warn("Service worker registration failed:", error)
      }
    }

    void registerServiceWorker()
  }, [])

  return null
}
