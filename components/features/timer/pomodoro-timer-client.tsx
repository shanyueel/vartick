"use client"

import { useEffect, useState } from "react"
import { loadActiveTimer, clearActiveTimer } from "@/lib/db/active-timer"
import { buildSessions } from "@/lib/timer/session"
import type { InitialState, SessionSetting } from "@/lib/timer/type"
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
    const restoreActiveTimer = async () => {
      const record = await loadActiveTimer()

      if (record) {
        const sessionsLength = buildSessions(cyclesBeforeLongBreak).length
        const isSessionIdxInCycle = record.sessionIdx >= 0 && record.sessionIdx < sessionsLength

        if (isSessionIdxInCycle) {
          setInitialState({ sessionIdx: record.sessionIdx, timerState: record.timerState })
        } else {
          await clearActiveTimer()
        }
      }

      setLoaded(true)
    }

    restoreActiveTimer()
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
