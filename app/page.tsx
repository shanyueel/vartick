import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-4xl font-bold text-center">
          <Image
            src="/logo.png"
            alt="VarTick Logo"
            width={48}
            height={48}
            className="inline-block mr-2"
          />
          VarTick
        </h1>
        <p className="mt-4 text-lg text-center text-zinc-600 dark:text-zinc-400">
          A Pomodoro timer that learns why your day never goes to plan.
        </p>
        <a href="https://github.com/shanyueel/vartick" className="href">
          <Button className="mt-6">Github</Button>
        </a>
      </main>
    </div>
  )
}
