import Dexie, { type EntityTable, type Table } from "dexie"
import type { ActiveTimer, Session, Settings } from "@/lib/db/type"

const db = new Dexie("vartick") as Dexie & {
  sessions: EntityTable<Session, "id">
  activeTimer: Table<ActiveTimer, "singleton">
  settings: EntityTable<Settings, "id">
}

db.version(1).stores({
  sessions: "++id, type, status, startedAt, endedAt",
  activeTimer: "id",
  settings: "id"
})

export { db }
