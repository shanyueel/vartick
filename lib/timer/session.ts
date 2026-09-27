import type { SessionSetting, SessionType } from "@/lib/timer/type"

const MINUTE_MS = 60 * 1000

/*
  The sessions of one cycle, in order: a focus session per cycle, a short break
  between consecutive ones, and a long break to close.
 */
export const buildSessions = (cyclesBeforeLongBreak: number): SessionType[] => {
  if (cyclesBeforeLongBreak <= 0 || !Number.isInteger(cyclesBeforeLongBreak)) {
    throw new Error("Invalid cyclesBeforeLongBreak, must be a positive integer")
  }

  const sessions: SessionType[] = []

  for (let i = 0; i < cyclesBeforeLongBreak; i++) {
    sessions.push("focus")

    if (i < cyclesBeforeLongBreak - 1) {
      sessions.push("shortBreak")
    }
  }

  sessions.push("longBreak")

  return sessions
}

export const getSessionsDuration = (
  focusMin: SessionSetting["focusMin"],
  shortBreakMin: SessionSetting["shortBreakMin"],
  longBreakMin: SessionSetting["longBreakMin"]
) => {
  if (focusMin <= 0 || !Number.isInteger(focusMin)) {
    throw new Error("Invalid duration, all durations must be a positive integer")
  }
  if (shortBreakMin <= 0 || !Number.isInteger(shortBreakMin)) {
    throw new Error("Invalid duration, all durations must be a positive integer")
  }
  if (longBreakMin <= 0 || !Number.isInteger(longBreakMin)) {
    throw new Error("Invalid duration, all durations must be a positive integer")
  }

  return {
    focus: focusMin * MINUTE_MS,
    shortBreak: shortBreakMin * MINUTE_MS,
    longBreak: longBreakMin * MINUTE_MS
  }
}
