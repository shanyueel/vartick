"use client"

import Link from "next/link"
import { cn } from "@/lib/utils/style"
import { usePathname } from "next/navigation"

export const NavItem = ({
  href,
  text,
  className
}: {
  href: string
  text: string
  className?: string
}) => {
  const pathname = usePathname()
  const isActive = href === pathname

  return (
    <Link
      href={href}
      className={cn(
        "flex-1 text-center p-4 hover:bg-primary/20 hover:text-primary md:flex-initial md:text-start md:py-2 md:px-4 md:rounded-md",
        isActive && "font-semibold text-primary",
        className
      )}
    >
      {text}
    </Link>
  )
}
