import { db } from "@/lib/db"
import type { Session } from "@/lib/db/type"
import type { InitialState } from "@/lib/timer/type"

export const concludeSession = async (activeTimer: InitialState, session: Omit<Session, "id">) => {
  try {
    await db.transaction("rw", db.activeTimer, db.sessions, async () => {
      await db.activeTimer.put({ ...activeTimer, id: "singleton" })
      await db.sessions.add(session)
    })
  } catch (error) {
    console.error("Error concluding session:", error)
  }
}
