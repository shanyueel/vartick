export type SessionType = "focus" | "shortBreak" | "longBreak"

export interface SessionSetting {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
}
