"use client"

import { Timer } from "@/lib/timer/timer"
import { Button } from "@/components/ui/button"

interface TimerControlsProps {
  timer: Timer
  current: ReturnType<Timer["getCurrent"]>
  updateCurrent: () => void
}

export const TimerControls = ({ timer, current, updateCurrent }: TimerControlsProps) => {
  const { status } = current
  const getStatus = () => timer.getCurrent().status

  const handleStart = () => {
    if (getStatus() !== "pending") {
      updateCurrent()
      return
    }

    timer.start()
    updateCurrent()
  }

  const handlePause = () => {
    if (getStatus() !== "running") {
      updateCurrent()
      return
    }

    timer.pause()
    updateCurrent()
  }

  const handleResume = () => {
    if (getStatus() !== "paused") {
      updateCurrent()
      return
    }

    timer.resume()
    updateCurrent()
  }

  const handleEnd = () => {
    if (getStatus() === "pending" || getStatus() === "ended") {
      updateCurrent()
      return
    }

    timer.end()
    updateCurrent()
  }

  const handleReset = () => {
    if (getStatus() !== "ended") {
      timer.end()
    }

    timer.reset(timer.getDurationMs())
    updateCurrent()
  }

  return (
    <div className="flex gap-4">
      {status === "pending" && (
        <Button size="lg" variant="secondary" onClick={handleStart}>
          Start
        </Button>
      )}

      {status === "running" && (
        <>
          <Button size="lg" variant="secondary" onClick={handlePause}>
            Pause
          </Button>
          <Button size="lg" variant="destructive" onClick={handleEnd}>
            Stop
          </Button>
        </>
      )}

      {status === "paused" && (
        <>
          <Button size="lg" variant="secondary" onClick={handleResume}>
            Resume
          </Button>
          <Button size="lg" variant="destructive" onClick={handleEnd}>
            Stop
          </Button>
        </>
      )}

      {(status === "finished" || status === "ended") && (
        <Button size="lg" variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      )}
    </div>
  )
}
