import { cn } from "@/lib/utils/style"
import { SessionType } from "@/lib/timer/type"

type SessionStatus = "finished" | "active" | "upcoming"

interface SessionSegment {
  type: SessionType
  status: SessionStatus
}

const getSizeClass = (type: SessionType) => {
  switch (type) {
    case "focus":
      return "w-6 h-2"
    case "shortBreak":
      return "size-2"
    case "longBreak":
      return "w-4 h-2"
  }
}

const getColorClass = (type: SessionType, status: SessionStatus) => {
  switch (status) {
    case "finished":
      return type === "focus" ? "bg-focus" : "bg-break"
    case "active":
      return type === "focus" ? "bg-focus ring-1 ring-focus" : "bg-break ring-1 ring-break"
    case "upcoming":
      return type === "focus" ? "bg-focus-muted" : "bg-break-muted"
  }
}

const SessionSegment = ({ type, status }: SessionSegment) => {
  const sizeClass = getSizeClass(type)
  const colorClass = getColorClass(type, status)

  return <div className={cn("rounded-full", sizeClass, colorClass)} />
}

interface SessionTrackerProps {
  sessions: SessionType[]
  currentSessionIdx: number
  className?: string
}

export const SessionTracker = ({ sessions, currentSessionIdx, className }: SessionTrackerProps) => {
  const isCurrentSessionIdxValid = currentSessionIdx >= 0 && currentSessionIdx < sessions.length

  if (sessions.length === 0 || !isCurrentSessionIdxValid) return null

  const getStatus = (idx: number): SessionStatus => {
    if (idx < currentSessionIdx) return "finished"
    if (idx === currentSessionIdx) return "active"
    return "upcoming"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {sessions.map((session, idx) => (
        <SessionSegment key={idx} type={session} status={getStatus(idx)} />
      ))}
    </div>
  )
}
