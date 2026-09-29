import type { MetadataRoute } from "next"

// gray-950, sampled from the icon's own background so the splash screen and
// status bar meet the icon without a seam. Hex rather than the oklch() the
// theme uses: manifest colours are parsed outside the browser's CSS engine.
const background = "#0a0e0d"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VarTick",
    short_name: "VarTick",
    description: "A Pomodoro timer that learns why your day never goes to plan.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: background,
    theme_color: background,
    icons: [
      { src: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
      // Android masks icons to the launcher's shape. The mark sits well inside
      // the safe zone, so the same file survives being cropped to a circle.
      { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }
}
