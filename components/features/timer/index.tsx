"use client"

import { useCallback, useEffect, useState } from "react"
import { Timer } from "@/lib/timer/timer"
import { TimerDisplay } from "@/components/features/timer/timer-display"
import { TimerControls } from "@/components/features/timer/timer-controls"

// How often the running timer is re-read. The arc's CSS transition is set to the
// same period so it sweeps between ticks instead of jumping.
const REFRESH_PERIOD_MS = 200

interface PomodoroTimerProps {
  durationMs: number
  color: "orange" | "green"
  segmented?: boolean
  subContent?: React.ReactNode
}

export const PomodoroTimer = ({
  durationMs,
  color,
  segmented = false,
  subContent = undefined
}: PomodoroTimerProps) => {
  const [timer] = useState(() => new Timer(durationMs))
  const [current, setCurrent] = useState(() => timer.getCurrent())

  const updateCurrent = useCallback(() => {
    setCurrent(timer.getCurrent())
  }, [timer])

  // Only a running timer changes on its own, so the poll starts and stops with the
  // status: React tears the interval down on pause, finish, end, and unmount.
  useEffect(() => {
    if (current.status !== "running") return

    const intervalId = setInterval(updateCurrent, REFRESH_PERIOD_MS)

    return () => clearInterval(intervalId)
  }, [current.status, updateCurrent, current])

  return (
    <div className="flex flex-col items-center gap-8">
      <TimerDisplay
        current={current}
        durationMs={timer.getDurationMs()}
        color={color}
        segmented={segmented}
        subContent={subContent}
        refreshPeriod={REFRESH_PERIOD_MS}
      />
      <TimerControls timer={timer} current={current} updateCurrent={updateCurrent} />
    </div>
  )
}
