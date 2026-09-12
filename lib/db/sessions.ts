import { db } from "@/lib/db"
import { queryActiveTimer } from "@/lib/db/active-timer"
import type { Session } from "@/lib/db/type"
import type { PomodoroTimerState } from "@/lib/timer/type"

export const concludeSession = async (
  activeTimer: PomodoroTimerState,
  session: Omit<Session, "id">
) => {
  try {
    await db.transaction("rw", db.activeTimer, db.sessions, async () => {
      const { sessionIdx: activeSession, timerState: activeTimerState } = activeTimer

      if (activeTimerState.status !== "ended") {
        throw new Error("Cannot conclude a session that has not ended")
      }

      // check if the session has been concluded. If so, do not write the session again.
      const stored = await queryActiveTimer()
      if (stored) {
        const { sessionIdx: storedSession, timerState: storedTimer } = stored

        const isAlreadyConcluded =
          storedSession === activeSession &&
          storedTimer.status === "ended" &&
          storedTimer.startedAt === activeTimerState.startedAt

        if (isAlreadyConcluded) return
      }

      await db.activeTimer.put({ ...activeTimer, id: "singleton" })
      await db.sessions.add(session)
    })
  } catch (error) {
    console.error("Error concluding session:", error)
  }
}
