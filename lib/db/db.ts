import Dexie, { type EntityTable } from "dexie"

// The one currently-running timer, if any. Singleton row, deleted once the
// timer concludes and its result is written to `sessions`.
export interface ActiveTimer {
  id: "singleton"
  type: "focus" | "shortBreak" | "longBreak"
  startedAt: number // epoch ms
  endsAt: number // epoch ms — absolute target, never a countdown counter
  plannedDurationSec: number
}

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
  activeTimer: EntityTable<ActiveTimer, "id">
  settings: EntityTable<Settings, "id">
}

db.version(1).stores({
  sessions: "id, type, status, startedAt",
  activeTimer: "id",
  settings: "id"
})

export { db }
