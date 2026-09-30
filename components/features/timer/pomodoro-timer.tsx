"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils/style"
import type { Session, Settings } from "@/lib/db/type"
import { saveActiveTimer } from "@/lib/db/active-timer"
import { concludeSession, loadSessions } from "@/lib/db/sessions"
import { Timer } from "@/lib/timer"
import { buildSessions, getSessionsDuration } from "@/lib/timer/session"
import type { TimerStatus } from "@/lib/timer/type"
import type { ChimeName } from "@/lib/audio/type"
import { playChime } from "@/lib/audio/chime"
import { sendNotification } from "@/lib/notification"
import { TimerDisplay } from "@/components/features/timer/timer-display"
import { TimerControls } from "@/components/features/timer/timer-controls"
import { SessionTracker } from "@/components/features/timer/session-tracker"
import { formatHoursMinutes } from "@/lib/utils/time"

interface PomodoroTimerProps extends Omit<Settings, "id"> {
  className?: string
}

// How often the running timer is re-read and the display is updated.
const REFRESH_PERIOD_MS = 200

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short" })

// How the end of a session announces itself, by what ended.
const SESSION_END_ALERTS: Record<string, { chime: ChimeName; title: string; body: string }> = {
  cycle: { chime: "cycleEnd", title: "Cycle complete", body: "All sessions done." },
  focus: { chime: "focusEnd", title: "Focus complete", body: "Time for a break." },
  break: { chime: "breakEnd", title: "Break complete", body: "Back to focus." }
}

const getSessionEndAlert = (isLastSession: boolean, isFocusSession: boolean) => {
  if (isLastSession) return SESSION_END_ALERTS.cycle
  if (isFocusSession) return SESSION_END_ALERTS.focus

  return SESSION_END_ALERTS.break
}

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
  soundEnabled,
  notificationsEnabled,
  className
}: PomodoroTimerProps) => {
  const [sessionsDuration] = useState(() =>
    getSessionsDuration(focusMin, shortBreakMin, longBreakMin)
  )

  /* Sessions */
  const [sessions] = useState(() => buildSessions(cyclesBeforeLongBreak))

  /*
    Each tab runs its own timer from the start of a cycle. Phase 1 is a timer
    and nothing more, so a reload or a closed tab starts over instead of
    resuming, and tabs do not share or adopt each other's state.
   */
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0)

  const [completedFocusToday, setCompletedFocusToday] = useState<Session[]>([])

  const todayFocusCount = completedFocusToday.length
  const todayFocusSeconds = completedFocusToday.reduce(
    (total, session) => total + Math.floor(session.actualDurationMs / 1000),
    0
  )

  const fetchTodayFocusSessions = useCallback(async () => {
    const sessions = await loadSessions({
      type: "focus",
      status: "completed",
      startedAtRange: [new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 999)]
    })

    setCompletedFocusToday(sessions)
  }, [])

  useEffect(() => {
    const loadTodayFocusSessions = async () => {
      await fetchTodayFocusSessions()
    }

    loadTodayFocusSessions()
  }, [fetchTodayFocusSessions])

  /* Timer */
  const [timer] = useState(() => Timer.create(sessionsDuration[sessions[0]]))

  const [timerView, setTimerView] = useState(() => timer.getCurrent())
  const status = timerView.status
  const remainingMs = timerView.remainingMs

  /* Derived State */
  const weekday = WEEKDAY_FORMAT.format(new Date()).toUpperCase()
  const isFocusSession = sessions[currentSessionIdx] === "focus"
  const isLastSession = currentSessionIdx === sessions.length - 1
  const isCycleNotStarted = currentSessionIdx === 0 && status === "pending"
  const isCycleEnded = isLastSession && (status === "ended" || status === "finished")

  /* Operations for Timer and Session Management */
  const updateTimerView = useCallback(async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "finished") {
      const alert = getSessionEndAlert(isLastSession, isFocusSession)

      if (soundEnabled) {
        playChime(alert.chime)
      }

      if (notificationsEnabled) {
        sendNotification({ title: alert.title, body: alert.body })
      }

      const record = timer.end()

      await concludeSession(
        { sessionIdx: currentSessionIdx, timerState: timer.snapshot() },
        { type: sessions[currentSessionIdx], ...record }
      )

      await fetchTodayFocusSessions()
    }

    setTimerView(timer.getCurrent())
  }, [
    sessions,
    currentSessionIdx,
    timer,
    soundEnabled,
    notificationsEnabled,
    isLastSession,
    isFocusSession,
    fetchTodayFocusSessions
  ])

  const endCurrentSession = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "ended") return

    const record = timer.end()

    await concludeSession(
      { sessionIdx: currentSessionIdx, timerState: timer.snapshot() },
      { type: sessions[currentSessionIdx], ...record }
    )

    await fetchTodayFocusSessions()
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
      <div className="-mb-4 text-muted-foreground tracking-widest">TODAY · {weekday}</div>
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

      <div className="w-full min-h-6 text-center text-muted-foreground">
        {completedFocusToday.length === 0 ? (
          <span>No sessions yet today</span>
        ) : (
          <span>
            {todayFocusCount} session{todayFocusCount === 1 ? "" : "s"} ·{" "}
            {formatHoursMinutes(todayFocusSeconds)} focused today
          </span>
        )}
      </div>

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
      {isCycleNotStarted && (
        <span className="text-sm text-muted-foreground">
          Short break {shortBreakMin}m · Long break {longBreakMin}m after {cyclesBeforeLongBreak}{" "}
          focus
        </span>
      )}
    </div>
  )
}
