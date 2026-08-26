import Dexie, { type EntityTable, type Table } from "dexie"

// The one currently-running timer, if any. Singleton row, deleted once the
// timer concludes and its result is written to `sessions`.
export interface RunningActiveTimer {
  id: "singleton"
  type: "focus" | "shortBreak" | "longBreak"
  status: "running"
  startedAt: number // epoch ms
  endsAt: number // epoch ms — absolute target, never a countdown counter
  plannedDurationSec: number
}

export interface PausedActiveTimer {
  id: "singleton"
  type: "focus" | "shortBreak" | "longBreak"
  status: "paused"
  startedAt: number // epoch ms
  remainingSec: number // written when paused; used to recompute endsAt when resumed
  plannedDurationSec: number
}

export type ActiveTimer = RunningActiveTimer | PausedActiveTimer

export interface Session {
  id: string
  type: "focus" | "shortBreak" | "longBreak"
  startedAt: number // epoch ms
  endedAt: number
  plannedDurationSec: number
  actualDurationSec: number
  status: "completed" | "abandoned"
}

export interface Settings {
  id: "singleton"
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
  soundEnabled: boolean
  notificationsEnabled: boolean
}

const db = new Dexie("vartick") as Dexie & {
  sessions: EntityTable<Session, "id">
  activeTimer: Table<ActiveTimer, "singleton">
  settings: EntityTable<Settings, "id">
}

db.version(1).stores({
  sessions: "id, type, status, startedAt",
  activeTimer: "id",
  settings: "id"
})

export { db }
