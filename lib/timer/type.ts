/* Timer */
export type TimerStatus = "pending" | "running" | "paused" | "finished" | "ended"

export type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }
  | { status: "ended"; startedAt?: number; remainingMs: number }

/* Session */
export type SessionType = "focus" | "shortBreak" | "longBreak"

export interface SessionSetting {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
}

export interface InitialState {
  currentSessionIdx: number
  currentTimerSnapshot: TimerState
}
