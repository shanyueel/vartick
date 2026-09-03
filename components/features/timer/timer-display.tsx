"use client"

import { convertMsToSec, formatDuration } from "@/lib/utils/time"
import { Timer } from "@/lib/timer/timer"
import { CircularProgress } from "@/components/ui/circular-progress"

interface TimerDisplayProps {
  current: ReturnType<Timer["getCurrent"]>
  durationMs: number
  color: "orange" | "green"
  segmented: boolean
  refreshPeriod: number
  subContent?: React.ReactNode
}

export const TimerDisplay = ({
  current,
  durationMs,
  color,
  segmented,
  subContent,
  refreshPeriod
}: TimerDisplayProps) => {
  const { status, remainingMs } = current

  // The arc transitions over 1 period, so while it is running we point it at the value
  // it should reach when the current period ends. Otherwise it trails the label
  // by a full period and is still sweeping once the label reads 00:00.
  const target = status === "running" ? remainingMs - refreshPeriod : remainingMs
  const value = Math.max(0, target)

  return (
    <div className="flex flex-col items-center gap-4">
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
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="text-5xl font-semibold tracking-widest text-center tabular-nums">
              {formatDuration(convertMsToSec(remainingMs))}
            </span>
            {subContent}
          </div>
        }
      />
    </div>
  )
}
