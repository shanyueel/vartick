import { InitialState, SessionSetting, SessionType, TimerRecord } from "@/lib/timer/type"

/*
 * The singleton active timer, overwritten on every change and deleted only when stale.
 * Each timer cycle is written to `sessions` when it ends (skipped, abandoned, or completed).
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
export interface Session extends TimerRecord {
  id: number
  type: SessionType
}

export interface Settings extends SessionSetting {
  id: "singleton"
  soundEnabled: boolean
  notificationsEnabled: boolean
}
