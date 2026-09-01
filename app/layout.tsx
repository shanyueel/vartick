import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "VarTick",
  description: "A Pomodoro timer that learns why your day never goes to plan."
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased bg-gray-975">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
