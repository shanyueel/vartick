"use client"

import { useId } from "react"
import { cn } from "@/lib/utils/style"

const STROKE_WIDTH_CLASSES = {
  base: {
    6: "[--stroke-width:6]",
    7: "[--stroke-width:7]",
    8: "[--stroke-width:8]",
    9: "[--stroke-width:9]",
    10: "[--stroke-width:10]"
  },
  md: {
    6: "md:[--stroke-width:6]",
    7: "md:[--stroke-width:7]",
    8: "md:[--stroke-width:8]",
    9: "md:[--stroke-width:9]",
    10: "md:[--stroke-width:10]"
  },
  lg: {
    6: "lg:[--stroke-width:6]",
    7: "lg:[--stroke-width:7]",
    8: "lg:[--stroke-width:8]",
    9: "lg:[--stroke-width:9]",
    10: "lg:[--stroke-width:10]"
  }
}

type StrokeWidth = keyof typeof STROKE_WIDTH_CLASSES.base
type ResponsiveStrokeWidth = { base: StrokeWidth; md?: StrokeWidth; lg?: StrokeWidth }

const strokeWidthClass = (strokeWidth: StrokeWidth | ResponsiveStrokeWidth) => {
  if (typeof strokeWidth === "number") {
    return STROKE_WIDTH_CLASSES.base[strokeWidth]
  }

  const { base, md, lg } = strokeWidth

  return cn(
    STROKE_WIDTH_CLASSES.base[base],
    md && STROKE_WIDTH_CLASSES.md[md],
    lg && STROKE_WIDTH_CLASSES.lg[lg]
  )
}

interface CircularProgressProps {
  max?: number
  min?: number
  value: number
  color?: "orange" | "green"
  segments?: number
  segmentGapRatio?: number
  muted?: boolean
  strokeWidth?: StrokeWidth | ResponsiveStrokeWidth
  transitionLength?: string
  className?: string
  content?: React.ReactNode
}

export function CircularProgress({
  max = 100,
  min = 0,
  value = 0,
  color = "orange",
  segments = 0,
  segmentGapRatio = 0.35,
  muted = false,
  strokeWidth = 8,
  transitionLength = "1000ms",
  className,
  content
}: CircularProgressProps) {
  const progressColor = {
    orange: "var(--color-primary)",
    green: "var(--color-green-600)"
  }[color]
  const trackColor = "var(--color-secondary)"

  const circumference = 2 * Math.PI * 45
  const percentPx = circumference / 100
  const currentPercent = Math.round(((value - min) / (max - min)) * 10000) / 100 // round to 2 decimal places for smoother transitions

  // Segmented Progress
  const maskId = useId()
  const segmentPitch = circumference / segments
  const gapLength = segmentPitch * segmentGapRatio
  const dashLength = segmentPitch - gapLength

  return (
    <div
      className={cn(
        "relative size-40 text-2xl font-semibold",
        strokeWidthClass(strokeWidth),
        className
      )}
      style={
        {
          "--circle-size": "100px",
          "--circumference": circumference,
          "--percent-to-px": `${percentPx}px`,
          "--gap-percent": "0",
          "--offset-factor": "0",
          "--transition-length": transitionLength,
          "--delay": "0s",
          "--percent-to-deg": "3.6deg",
          transform: "translateZ(0)"
        } as React.CSSProperties
      }
    >
      <svg fill="none" className="size-full" viewBox="0 0 100 100">
        <defs>
          <mask id={maskId}>
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              fill="none"
              strokeDasharray={`${dashLength} ${gapLength}`}
              style={{ strokeWidth: "var(--stroke-width)" }}
            />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeDashoffset="0"
            strokeLinecap="butt"
            strokeLinejoin="round"
            opacity={1}
            style={
              {
                stroke: trackColor,
                strokeWidth: "var(--stroke-width)",
                "--stroke-percent": 100 - currentPercent,
                "--offset-factor-secondary": "calc(1 - var(--offset-factor))",
                strokeDasharray:
                  "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                transform:
                  "rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)",
                transition: "all var(--transition-length) linear var(--delay)",
                transformOrigin: "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)"
              } as React.CSSProperties
            }
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeDashoffset="0"
            strokeLinecap="butt"
            strokeLinejoin="round"
            opacity={1}
            style={
              {
                stroke: progressColor,
                strokeWidth: "var(--stroke-width)",
                "--stroke-percent": currentPercent,
                strokeDasharray:
                  "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                transition:
                  "var(--transition-length) linear var(--delay),stroke var(--transition-length) linear var(--delay)",
                transitionProperty: "stroke-dasharray,transform",
                transform:
                  "rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))",
                transformOrigin: "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)"
              } as React.CSSProperties
            }
          />
          {muted && (
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="black"
              fill="none"
              strokeDasharray={circumference}
              opacity={0.5}
              style={{ strokeWidth: "var(--stroke-width)" }}
            />
          )}
        </g>
      </svg>
      <span
        data-current-value={currentPercent}
        className="animate-in fade-in absolute inset-0 m-auto size-fit delay-(--delay) duration-(--transition-length) ease-linear"
      >
        {content || currentPercent}
      </span>
    </div>
  )
}
