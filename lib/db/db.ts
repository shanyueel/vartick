import Dexie, { type EntityTable, type Table } from "dexie"
import type { SessionSetting, SessionType } from "@/lib/timer/type"

// The one currently-running timer, if any. Singleton row, deleted once the
// timer concludes and its result is written to `sessions`.
export interface RunningActiveTimer {
  id: "singleton"
  type: SessionType
  status: "running"
  startedAt: number // epoch ms
  endsAt: number // epoch ms — absolute target, never a countdown counter
  plannedDurationMs: number
}

export interface PausedActiveTimer {
  id: "singleton"
  type: SessionType
  status: "paused"
  startedAt: number // epoch ms
  remainingMs: number // written when paused; used to recompute endsAt when resumed
  plannedDurationMs: number
}

export type ActiveTimer = RunningActiveTimer | PausedActiveTimer

export interface Session {
  id: string
  type: SessionType
  startedAt: number // epoch ms
  endedAt: number
  plannedDurationMs: number
  actualDurationMs: number
  status: "completed" | "abandoned"
}

export interface Settings extends SessionSetting {
  id: "singleton"
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
