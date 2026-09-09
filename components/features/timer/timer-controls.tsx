"use client"

import { saveActiveTimer } from "@/lib/db/active-timer"
import { Timer } from "@/lib/timer"
import type { TimerStatus } from "@/lib/timer/type"
import { cn } from "@/lib/utils/style"
import { Button } from "@/components/ui/button"

interface TimerControlsProps {
  currentSessionIdx: number
  timer: Timer
  status: TimerStatus
  updateTimerView: () => Promise<void>
  endCurrentSession: () => Promise<void>
  nextSession: () => Promise<void>
  restartSession: () => Promise<void>
  isFocusSession: boolean
  isLastSession: boolean
  isCycleNotStarted: boolean
  isCycleEnded: boolean
}

export const TimerControls = ({
  currentSessionIdx,
  timer,
  status,
  updateTimerView,
  endCurrentSession,
  nextSession,
  restartSession,
  isFocusSession,
  isLastSession,
  isCycleNotStarted,
  isCycleEnded
}: TimerControlsProps) => {
  const handleStart = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "pending") {
      timer.start()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handlePause = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "running") {
      timer.pause()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handleResume = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "paused") {
      timer.resume()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handleNext = async () => {
    if (isLastSession) {
      await endCurrentSession()
      await updateTimerView()

      return
    }

    await nextSession()
    await updateTimerView()
  }

  const handleReset = async () => {
    if (isCycleEnded) {
      await restartSession()
    }

    await updateTimerView()
  }

  return (
    <div className="flex flex-col justify-center items-center gap-2 md:flex-row">
      {status === "pending" && (
        <Button size="xl" variant="secondary" onClick={handleStart}>
          {isFocusSession ? "Start Focus" : "Start Break"}
        </Button>
      )}

      {status === "running" && (
        <Button size="xl" variant="secondary" onClick={handlePause}>
          Pause
        </Button>
      )}

      {status === "paused" && (
        <Button size="xl" variant="secondary" onClick={handleResume}>
          Resume
        </Button>
      )}

      {!isCycleEnded && (status === "finished" || status === "ended") && (
        <Button size="xl" variant="secondary" onClick={handleNext}>
          Next
        </Button>
      )}

      {isCycleEnded && (
        <Button size="xl" variant="secondary" onClick={handleReset}>
          Start a new Cycle
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "text-muted-foreground",
          (isCycleNotStarted || status === "finished" || status === "ended") &&
            "invisible md:hidden"
        )}
        onClick={handleNext}
      >
        {isFocusSession ? "Abandon" : "Skip Break"}
      </Button>
    </div>
  )
}
