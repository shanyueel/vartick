import { db } from "@/lib/db"
import { queryActiveTimer } from "@/lib/db/active-timer"
import type { Session } from "@/lib/db/type"
import type { PomodoroTimerState, SessionStatus, SessionType } from "@/lib/timer/type"

const matchStatus = (session: Session, status: SessionStatus | undefined) => {
  return status === undefined || session.status === status
}

const matchStartedAt = (session: Session, startedAtRange: [number, number] | undefined) => {
  return (
    startedAtRange === undefined ||
    (session.startedAt >= startedAtRange[0] && session.startedAt <= startedAtRange[1])
  )
}

const matchEndedAt = (session: Session, endedAtRange: [number, number] | undefined) => {
  return (
    endedAtRange === undefined ||
    (session.endedAt >= endedAtRange[0] && session.endedAt <= endedAtRange[1])
  )
}

interface LoadSessionsOptions {
  type?: SessionType
  status?: SessionStatus
  startedAtRange?: [number, number]
  endedAtRange?: [number, number]
}

// Separate query for useLiveQuery subscriptions.
export const querySessions = ({
  type,
  status,
  startedAtRange,
  endedAtRange
}: LoadSessionsOptions = {}) => {
  let collection = db.sessions.toCollection()

  if (type !== undefined) {
    collection = db.sessions
      .where("type")
      .equals(type)
      .filter((session) => {
        if (!matchStatus(session, status)) return false
        if (!matchStartedAt(session, startedAtRange)) return false
        if (!matchEndedAt(session, endedAtRange)) return false
        return true
      })
  } else if (status !== undefined) {
    collection = db.sessions
      .where("status")
      .equals(status)
      .filter((session) => {
        if (!matchStartedAt(session, startedAtRange)) return false
        if (!matchEndedAt(session, endedAtRange)) return false
        return true
      })
  } else if (startedAtRange !== undefined) {
    collection = db.sessions
      .where("startedAt")
      .between(startedAtRange[0], startedAtRange[1])
      .filter((session) => {
        if (!matchEndedAt(session, endedAtRange)) return false
        return true
      })
  } else if (endedAtRange !== undefined) {
    collection = db.sessions.where("endedAt").between(endedAtRange[0], endedAtRange[1])
  }

  return collection.toArray()
}

export const loadSessions = async (options: LoadSessionsOptions = {}) => {
  try {
    // Awaited, so a rejected read is caught here rather than reaching the caller.
    return await querySessions(options)
  } catch (error) {
    console.error("Error loading sessions:", error)
    return []
  }
}

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
