"use client"

import { useEffect, useState } from "react"
import { PomodoroTimer } from "./pomodoro-timer"
import { DEFAULT_SETTINGS, loadSettings } from "@/lib/db/settings"
import type { Settings } from "@/lib/db/type"

export const PomodoroTimerClient = () => {
  const [settings, setSettings] = useState<Omit<Settings, "id">>()

  useEffect(() => {
    const fetchSettings = async () => {
      const savedSettings = await loadSettings()

      const settings = savedSettings ?? DEFAULT_SETTINGS

      setSettings({
        focusMin: settings.focusMin,
        shortBreakMin: settings.shortBreakMin,
        longBreakMin: settings.longBreakMin,
        cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
        soundEnabled: settings.soundEnabled,
        notificationsEnabled: settings.notificationsEnabled
      })
    }

    fetchSettings()
  }, [])

  if (!settings) return null

  return (
    <PomodoroTimer
      focusMin={settings.focusMin}
      shortBreakMin={settings.shortBreakMin}
      longBreakMin={settings.longBreakMin}
      cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
      soundEnabled={settings.soundEnabled}
      notificationsEnabled={settings.notificationsEnabled}
    />
  )
}
