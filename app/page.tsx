import { PomodoroTimer } from "@/components/features/timer"

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-4 w-full h-full">
      <PomodoroTimer focusMin={25} shortBreakMin={5} longBreakMin={15} cyclesBeforeLongBreak={4} />
    </div>
  )
}
