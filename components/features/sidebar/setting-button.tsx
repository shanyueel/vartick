"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { usePathname } from "next/navigation"

export const SettingsButton = () => {
  const pathname = usePathname()
  const isSettingsPage = pathname === "/settings"

  if (isSettingsPage) {
    return null
  }

  return (
    <Link href="/settings" className="fixed top-4 right-4 z-raised md:hidden">
      <Button variant="outline" size="icon-lg">
        <Settings className="size-6" />
      </Button>
    </Link>
  )
}
