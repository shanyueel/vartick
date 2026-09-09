"use client"

import { useEffect, useState } from "react"
import { buildSessions } from "@/lib/timer/session"
import type { InitialState, SessionSetting } from "@/lib/timer/type"
import { db } from "@/lib/db"
import { PomodoroTimer } from "./pomodoro-timer"

export const PomodoroTimerClient = ({
  focusMin,
  shortBreakMin,
  longBreakMin,
  cyclesBeforeLongBreak
}: SessionSetting) => {
  const [initialState, setInitialState] = useState<InitialState | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadActiveTimer = async () => {
      try {
        const record = await db.activeTimer.get("singleton")

        if (!record) return

        const sessionsLength = buildSessions(cyclesBeforeLongBreak).length
        const isSessionIdxInCycle = record.sessionIdx >= 0 && record.sessionIdx < sessionsLength

        if (!isSessionIdxInCycle) {
          await db.activeTimer.delete("singleton")

          return
        }

        setInitialState({ sessionIdx: record.sessionIdx, timerState: record.timerState })
      } catch (error) {
        console.error("Failed to restore the active timer:", error)
      } finally {
        setLoaded(true)
      }
    }

    loadActiveTimer()
  }, [cyclesBeforeLongBreak])

  if (!loaded) return null

  return (
    <PomodoroTimer
      focusMin={focusMin}
      shortBreakMin={shortBreakMin}
      longBreakMin={longBreakMin}
      cyclesBeforeLongBreak={cyclesBeforeLongBreak}
      initialState={initialState}
    />
  )
}
