"use client"

import { type TimerStatus } from "@/lib/timer/timer"
import { convertMsToSec, formatDuration } from "@/lib/utils/time"
import { CircularProgress } from "@/components/ui/circular-progress"

interface TimerDisplayProps {
  status: TimerStatus
  remainingMs: number
  durationMs: number
  color: "orange" | "green"
  segmented: boolean
  refreshPeriod: number
  subContent?: React.ReactNode
}

export const TimerDisplay = ({
  status,
  remainingMs,
  durationMs,
  color,
  segmented,
  refreshPeriod,
  subContent
}: TimerDisplayProps) => {
  // The arc transitions over 1 period, so while it is running we point it at the value
  // it should reach when the current period ends. Otherwise it trails the label
  // by a full period and is still sweeping once the label reads 00:00.
  const target = status === "running" ? remainingMs - refreshPeriod : remainingMs
  const value = Math.max(0, target)

  return (
    <CircularProgress
      className="size-70 md:size-80"
      max={durationMs}
      min={0}
      value={value}
      color={color}
      segments={segmented ? 60 : undefined}
      strokeWidth={{ base: 7, md: 8 }}
      muted={status === "pending" || status === "paused" || status === "ended"}
      transitionLength={`${refreshPeriod}ms`}
      content={
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <h1 className="w-full text-center text-4xl font-mono font-semibold tracking-wider tabular-nums md:font-light">
            {formatDuration(convertMsToSec(remainingMs))}
          </h1>
          {subContent}
        </div>
      }
    />
  )
}
