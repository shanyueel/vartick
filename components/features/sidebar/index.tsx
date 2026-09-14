import Image from "next/image"
import { cn } from "@/lib/utils/style"
import { NavItem } from "./nav-item"
import { SettingsButton } from "./setting-button"

export const Sidebar = ({ className }: { className?: string }) => {
  return (
    <>
      <SettingsButton />
      <nav
        className={cn(
          "bg-black w-full md:flex md:flex-col md:gap-4 md:p-4 md:w-60 md:h-full",
          className
        )}
      >
        <div className="hidden md:flex md:items-center md:gap-2 md:mt-4 md:px-2 md:font-bold">
          <Image src="/logo.png" alt="VarTick logo" width={32} height={32} />
          <span className="text-xl">VarTick</span>
        </div>
        <div className="flex justify-center gap-4 px-4 md:flex-1 md:flex-col md:justify-start md:gap-2 md:px-2">
          <NavItem href="/" text="Timer" />
        </div>
        <NavItem href="/settings" text="Settings" className="hidden md:flex" />
      </nav>
    </>
  )
}
