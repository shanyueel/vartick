import { PomodoroTimer } from "@/components/features/timer"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <PomodoroTimer
          focusMin={25}
          shortBreakMin={5}
          longBreakMin={15}
          cyclesBeforeLongBreak={4}
        />
      </main>
    </div>
  )
}
