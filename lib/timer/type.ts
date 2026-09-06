/* Timer */
export type TimerStatus = "pending" | "running" | "paused" | "finished" | "ended"

export type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }
  | { status: "ended"; startedAt?: number; remainingMs: number }

/* Session */
export type SessionType = "focus" | "shortBreak" | "longBreak"

export type SessionStatus = "completed" | "abandoned" | "skipped"

export interface SessionSetting {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
}

export interface InitialState {
  sessionIdx: number // index of the session in the current cycle (0-based)
  timerState: TimerState
}
