"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils/style"
import { useLiveQuery } from "dexie-react-hooks"
import { queryActiveTimer, saveActiveTimer } from "@/lib/db/active-timer"
import { concludeSession } from "@/lib/db/sessions"
import { Timer } from "@/lib/timer"
import { buildSessions, getSessionsDuration } from "@/lib/timer/session"
import type { TimerStatus, SessionSetting, InitialState } from "@/lib/timer/type"
import { TimerDisplay } from "@/components/features/timer/timer-display"
import { TimerControls } from "@/components/features/timer/timer-controls"
import { SessionTracker } from "@/components/features/timer/session-tracker"

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

const identifyTimer = ({ sessionIdx, timerState }: InitialState) => {
  const startedAt = "startedAt" in timerState ? timerState.startedAt : undefined
  const endsAt = "endsAt" in timerState ? timerState.endsAt : undefined
  const remainingMs = "remainingMs" in timerState ? timerState.remainingMs : undefined

  return `${sessionIdx}:${timerState.status}:${startedAt}:${endsAt}:${remainingMs}`
}

export const PomodoroTimer = ({
  focusMin,
  shortBreakMin,
  longBreakMin,
  cyclesBeforeLongBreak,
  initialState,
  className
}: PomodoroTimerProps) => {
  const [sessionsDuration] = useState(() =>
    getSessionsDuration(focusMin, shortBreakMin, longBreakMin)
  )

  /* Sessions */
  const [sessions] = useState(() => buildSessions(cyclesBeforeLongBreak))

  const [currentSessionIdx, setCurrentSessionIdx] = useState(
    initialState ? initialState.sessionIdx : 0
  )

  /* Timer */
  const [timer, setTimer] = useState(() => {
    if (initialState) {
      const currentSession = sessions[currentSessionIdx]

      const restoredTimer = Timer.fromSnapshot(
        sessionsDuration[currentSession],
        initialState.timerState
      )

      return restoredTimer || Timer.create(sessionsDuration[currentSession])
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
  const updateTimerView = useCallback(async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "finished") {
      const record = timer.end()

      await concludeSession(
        { sessionIdx: currentSessionIdx, timerState: timer.snapshot() },
        { type: sessions[currentSessionIdx], ...record }
      )
    }

    setTimerView(timer.getCurrent())
  }, [sessions, currentSessionIdx, timer])

  const endCurrentSession = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "ended") return

    const record = timer.end()

    await concludeSession(
      { sessionIdx: currentSessionIdx, timerState: timer.snapshot() },
      { type: sessions[currentSessionIdx], ...record }
    )
  }

  const moveToSession = async (sessionIdx: number) => {
    if (sessionIdx < 0 || sessionIdx >= sessions.length) return

    await endCurrentSession()

    const session = sessions[sessionIdx]

    setCurrentSessionIdx(sessionIdx)
    timer.reset(sessionsDuration[session])

    await saveActiveTimer({
      sessionIdx,
      timerState: timer.snapshot()
    })
  }

  const nextSession = async () => {
    const nextSessionIdx = currentSessionIdx + 1

    if (nextSessionIdx >= sessions.length) return

    await moveToSession(nextSessionIdx)
  }

  const restartSession = async () => {
    await moveToSession(0)
  }

  /* Subtitle */
  const subtitle = getSubtitle(status, isFocusSession, isLastSession)

  // Only a running timer changes on its own, so the poll starts and stops with the
  // status: React tears the interval down on pause, finish, end, and unmount.
  useEffect(() => {
    if (status !== "running") return

    const intervalId = setInterval(async () => {
      await updateTimerView()
    }, REFRESH_PERIOD_MS)

    return () => clearInterval(intervalId)
  }, [status, updateTimerView])

  /* Synchronize with timer state persisted by other tabs. */
  const storedActiveTimer = useLiveQuery(queryActiveTimer) // Shared timer state persisted in IndexedDB across tabs
  const [lastSeenStoredId, setLastSeenStoredId] = useState<string | null>(null) // Tracks the last seen stored timer, even if it's invalid.

  const storedId = storedActiveTimer ? identifyTimer(storedActiveTimer) : null
  const localId = identifyTimer({ sessionIdx: currentSessionIdx, timerState: timer.snapshot() })

  const isStoredTimerUnprocessed = storedId !== lastSeenStoredId
  const hasStoredTimer = storedActiveTimer && storedId
  const isStoredTimerOutOfSync = storedId !== localId

  if (isStoredTimerUnprocessed) {
    // Update the last seen stored timer so we don't process it again.
    setLastSeenStoredId(storedId)

    if (hasStoredTimer && isStoredTimerOutOfSync) {
      const { sessionIdx, timerState } = storedActiveTimer
      const session = sessions[sessionIdx]
      const restoredTimer = session && Timer.fromSnapshot(sessionsDuration[session], timerState)

      if (restoredTimer) {
        setCurrentSessionIdx(sessionIdx)
        setTimer(restoredTimer)
        setTimerView(restoredTimer.getCurrent())
      }
    }
  }

  /* Refresh the timer when a hidden tab becomes visible so the countdown reflects elapsed time. */
  useEffect(() => {
    if (status !== "running") return

    const recomputeIfVisible = () => {
      if (document.visibilityState !== "visible") return

      updateTimerView()
    }

    document.addEventListener("visibilitychange", recomputeIfVisible)

    return () => {
      document.removeEventListener("visibilitychange", recomputeIfVisible)
    }
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
          currentSessionIdx={currentSessionIdx}
          timer={timer}
          status={status}
          updateTimerView={updateTimerView}
          endCurrentSession={endCurrentSession}
          nextSession={nextSession}
          restartSession={restartSession}
          isFocusSession={isFocusSession}
          isLastSession={isLastSession}
          isCycleNotStarted={isCycleNotStarted}
          isCycleEnded={isCycleEnded}
        />
      </div>
    </div>
  )
}
