import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/features/sidebar"
import { Toaster } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "VarTick",
  description: "A Pomodoro timer that learns why your day never goes to plan."
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased bg-gray-975">
      <body className="flex flex-col items-center h-full min-h-full font-sans md:flex-row md:items-start">
        <main className="relative flex-1 w-full h-full px-4 py-8 overflow-auto">{children}</main>
        <Sidebar className="border-t md:-order-1 md:border-t-0 md:border-r" />
        <Toaster />
      </body>
    </html>
  )
}
