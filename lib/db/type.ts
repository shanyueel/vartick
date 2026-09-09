import { InitialState, SessionSetting, SessionStatus, SessionType } from "@/lib/timer/type"

/*
  The one currently-running timer, if any. Singleton row, deleted once the
  timer concludes and its result is written to `sessions`.
 */
export interface ActiveTimer extends InitialState {
  id: "singleton"
}

/* 
  A concluded session, written once when a session ends. 
  - A skipped session never ran, so its startedAt and endedAt both held the moment the user skipped it.
  - plannedDurationMs is the duration the timer was set to run for
  - actualDurationMs is how long it actually ran before being completed, abandoned, or skipped.
*/
export interface Session {
  id: string
  type: SessionType
  startedAt: number // epoch ms — when the timer started, or when the session was skipped
  endedAt: number // epoch ms — when the timer stopped, or when the session was skipped
  plannedDurationMs: number
  actualDurationMs: number
  status: SessionStatus
}

export interface Settings extends SessionSetting {
  id: "singleton"
  soundEnabled: boolean
  notificationsEnabled: boolean
}
