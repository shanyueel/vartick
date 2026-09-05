"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils/style"
import { Timer, type TimerState, type TimerStatus } from "@/lib/timer/timer"
import { TimerDisplay } from "@/components/features/timer/timer-display"
import { TimerControls } from "@/components/features/timer/timer-controls"
import { SessionTracker } from "@/components/features/timer/session-tracker"
import { SessionType, SessionSetting } from "@/lib/timer/type"

interface InitialState {
  currentSessionIdx: number
  currentTimerSnapshot: TimerState
}
interface PomodoroTimerProps extends SessionSetting {
  initialState?: InitialState
  className?: string
}

// How often the running timer is re-read and the display is updated.
const REFRESH_PERIOD_MS = 200

const getSubtitle = (status: TimerStatus, isFocusSession: boolean, isLastSession: boolean) => {
  switch (status) {
    case "pending":
      return { text: "Ready", style: "text-muted-foreground" }
    case "running":
      return isFocusSession
        ? { text: "Focus", style: "text-focus" }
        : { text: "Break", style: "text-break" }
    case "paused":
      return { text: "Paused", style: "text-muted-foreground" }
    case "ended":
      if (isLastSession) {
        return { text: "All sessions complete", style: "text-muted-foreground" }
      }

      return isFocusSession
        ? { text: "Focus Complete", style: "text-muted-foreground" }
        : { text: "Break Complete", style: "text-muted-foreground" }
    default:
      return { text: "Timer", style: "text-secondary" }
  }
}

export const PomodoroTimer = ({
  focusMin,
  shortBreakMin,
  longBreakMin,
  cyclesBeforeLongBreak,
  initialState,
  className
}: PomodoroTimerProps) => {
  const [sessionsDuration] = useState(() => {
    return {
      focus: focusMin * 60 * 1000,
      shortBreak: shortBreakMin * 60 * 1000,
      longBreak: longBreakMin * 60 * 1000
    }
  })

  /* Sessions */
  const [sessions] = useState(() => {
    const sessions: SessionType[] = []

    for (let i = 0; i < cyclesBeforeLongBreak; i++) {
      sessions.push("focus")

      if (i < cyclesBeforeLongBreak - 1) {
        sessions.push("shortBreak")
      }
    }

    sessions.push("longBreak")

    return sessions
  })

  const [currentSessionIdx, setCurrentSessionIdx] = useState(
    initialState ? initialState.currentSessionIdx : 0
  )

  /* Timer */
  const [timer] = useState(() => {
    if (initialState) {
      const currentSession = sessions[currentSessionIdx]

      return Timer.fromSnapshot(sessionsDuration[currentSession], initialState.currentTimerSnapshot)
    }

    return Timer.create(sessionsDuration[sessions[0]])
  })

  const [timerView, setTimerView] = useState(() => timer.getCurrent())
  const status = timerView.status
  const remainingMs = timerView.remainingMs

  /* Derived State */
  const isFocusSession = sessions[currentSessionIdx] === "focus"
  const isLastSession = currentSessionIdx === sessions.length - 1
  const isCycleNotStarted = currentSessionIdx === 0 && status === "pending"
  const isCycleEnded = isLastSession && (status === "ended" || status === "finished")

  /* Operations for Timer and Session Management */
  const updateTimerView = useCallback(() => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "finished") {
      timer.end()
    }

    setTimerView(timer.getCurrent())
  }, [timer])

  const endCurrentSession = () => {
    const latestStatus = timer.getCurrent().status
    if (latestStatus !== "ended") {
      timer.end()
    }
  }

  const moveToSession = (sessionIdx: number) => {
    if (sessionIdx < 0 || sessionIdx >= sessions.length) return

    endCurrentSession()

    const session = sessions[sessionIdx]

    setCurrentSessionIdx(sessionIdx)
    timer.reset(sessionsDuration[session])
  }

  const nextSession = () => {
    const nextSessionIdx = currentSessionIdx + 1

    if (nextSessionIdx >= sessions.length) {
      endCurrentSession()
    }

    moveToSession(nextSessionIdx)
  }

  const restartSession = () => {
    moveToSession(0)
  }

  /* Subtitle */
  const subtitle = getSubtitle(status, isFocusSession, isLastSession)

  // Only a running timer changes on its own, so the poll starts and stops with the
  // status: React tears the interval down on pause, finish, end, and unmount.
  useEffect(() => {
    if (status !== "running") return

    const intervalId = setInterval(updateTimerView, REFRESH_PERIOD_MS)

    return () => clearInterval(intervalId)
  }, [status, updateTimerView])

  return (
    <div data-component="timer" className={cn("flex flex-col items-center gap-8", className)}>
      <TimerDisplay
        status={status}
        remainingMs={remainingMs}
        durationMs={timer.getDurationMs()}
        color={sessions[currentSessionIdx] === "focus" ? "orange" : "green"}
        segmented={sessions[currentSessionIdx] !== "focus"}
        refreshPeriod={REFRESH_PERIOD_MS}
        subContent={
          <span className={cn("text-xs tracking-widest", subtitle.style)}>{subtitle.text}</span>
        }
      />
      <SessionTracker sessions={sessions} currentSessionIdx={currentSessionIdx} />
      <div className="w-full px-8">
        <TimerControls
          timer={timer}
          status={status}
          updateTimerView={updateTimerView}
          nextSession={nextSession}
          restartSession={restartSession}
          isFocusSession={isFocusSession}
          isCycleNotStarted={isCycleNotStarted}
          isCycleEnded={isCycleEnded}
        />
      </div>
    </div>
  )
}
