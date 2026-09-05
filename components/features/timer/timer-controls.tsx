"use client"

import { Timer, type TimerStatus } from "@/lib/timer/timer"
import { cn } from "@/lib/utils/style"
import { Button } from "@/components/ui/button"

interface TimerControlsProps {
  timer: Timer
  status: TimerStatus
  updateTimerView: () => void
  nextSession: () => void
  restartSession: () => void
  isFocusSession: boolean
  isCycleNotStarted: boolean
  isCycleEnded: boolean
}

export const TimerControls = ({
  timer,
  status,
  updateTimerView,
  nextSession,
  restartSession,
  isFocusSession,
  isCycleNotStarted,
  isCycleEnded
}: TimerControlsProps) => {
  const handleStart = () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "pending") {
      timer.start()
    }

    updateTimerView()
  }

  const handlePause = () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "running") {
      timer.pause()
    }

    updateTimerView()
  }

  const handleResume = () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "paused") {
      timer.resume()
    }

    updateTimerView()
  }

  const handleNext = () => {
    nextSession()

    updateTimerView()
  }

  const handleReset = () => {
    if (isCycleEnded) {
      restartSession()
    }

    updateTimerView()
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
