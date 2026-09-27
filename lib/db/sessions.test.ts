import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import "fake-indexeddb/auto"
import { db } from "@/lib/db"
import { loadSessions, querySessions, concludeSession } from "./sessions"
import type { Session } from "@/lib/db/type"
import type { TimerState } from "@/lib/timer/type"

const BASE_TIME = new Date("2026-01-01T12:00:00Z").getTime()
const DURATION_MS = 25 * 60 * 1000

const runningState: TimerState = {
  status: "running",
  startedAt: BASE_TIME,
  endsAt: BASE_TIME + DURATION_MS
}

const endedState: TimerState = {
  status: "ended",
  startedAt: BASE_TIME,
  remainingMs: 0
}

const completedSession: Omit<Session, "id"> = {
  type: "focus",
  status: "completed",
  startedAt: BASE_TIME,
  endedAt: BASE_TIME + DURATION_MS,
  plannedDurationMs: DURATION_MS,
  actualDurationMs: DURATION_MS
}

describe("loadSessions()", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()

    await db.sessions.bulkAdd([
      {
        type: "focus",
        status: "completed",
        startedAt: BASE_TIME,
        endedAt: BASE_TIME + DURATION_MS,
        plannedDurationMs: DURATION_MS,
        actualDurationMs: DURATION_MS
      },
      {
        type: "shortBreak",
        status: "completed",
        startedAt: BASE_TIME + DURATION_MS,
        endedAt: BASE_TIME + 2 * DURATION_MS,
        plannedDurationMs: DURATION_MS,
        actualDurationMs: DURATION_MS
      },
      {
        type: "focus",
        status: "abandoned",
        startedAt: BASE_TIME + 2 * DURATION_MS,
        endedAt: BASE_TIME + 3 * DURATION_MS,
        plannedDurationMs: DURATION_MS,
        actualDurationMs: DURATION_MS
      },
      {
        type: "longBreak",
        status: "completed",
        startedAt: BASE_TIME + 3 * DURATION_MS,
        endedAt: BASE_TIME + 4 * DURATION_MS,
        plannedDurationMs: DURATION_MS,
        actualDurationMs: DURATION_MS
      }
    ])
  })

  // Rejecting the read itself, rather than the call that builds it, is what
  // proves the failure is caught after the await rather than before it.
  const failTheRead = () => {
    const collection = db.sessions.toCollection()

    vi.spyOn(collection, "toArray").mockRejectedValue(new Error("Simulated error"))
    vi.spyOn(db.sessions, "toCollection").mockReturnValue(collection)
  }

  test("returns empty and logs error if the read fails", async () => {
    failTheRead()
    const logError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(await loadSessions()).toEqual([])
    expect(logError).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  // useLiveQuery re-runs a querier by catching what it throws, so this one
  // must not swallow the failure the way loadSessions does.
  test("querySessions lets a failed read reject", async () => {
    failTheRead()

    await expect(querySessions()).rejects.toThrow("Simulated error")

    vi.restoreAllMocks()
  })

  test("returns empty array when no sessions exist", async () => {
    await db.sessions.clear()

    const sessions = await loadSessions()

    expect(sessions).toEqual([])
  })

  test("returns all sessions when no filters are applied", async () => {
    const sessions = await loadSessions()

    expect(sessions).toHaveLength(4)
  })

  test("filters sessions by type", async () => {
    const focusSessions = await loadSessions({ type: "focus" })

    expect(focusSessions).toHaveLength(2)
    expect(focusSessions.every((s) => s.type === "focus")).toBe(true)
  })

  test("filters sessions by status", async () => {
    const completedSessions = await loadSessions({ status: "completed" })

    expect(completedSessions).toHaveLength(3)
    expect(completedSessions.every((s) => s.status === "completed")).toBe(true)
  })

  test("filters sessions by startedAt range", async () => {
    const startRange: [number, number] = [BASE_TIME + DURATION_MS, BASE_TIME + 3 * DURATION_MS]
    const sessionsInRange = await loadSessions({ startedAtRange: startRange })

    expect(sessionsInRange).toHaveLength(2)
    expect(
      sessionsInRange.every((s) => s.startedAt >= startRange[0] && s.startedAt <= startRange[1])
    ).toBe(true)
  })

  test("filters sessions by endedAt range", async () => {
    const endRange: [number, number] = [BASE_TIME + 2 * DURATION_MS, BASE_TIME + 4 * DURATION_MS]
    const sessionsInRange = await loadSessions({ endedAtRange: endRange })

    expect(sessionsInRange).toHaveLength(2)
    expect(sessionsInRange.every((s) => s.endedAt >= endRange[0] && s.endedAt <= endRange[1])).toBe(
      true
    )
  })

  test("filters today's completed focus sessions", async () => {
    const todayStart = new Date("2026-01-01T00:00:00Z").getTime()
    const todayEnd = new Date("2026-01-01T23:59:59Z").getTime()

    const todayFocusSessions = await loadSessions({
      type: "focus",
      status: "completed",
      startedAtRange: [todayStart, todayEnd]
    })

    expect(todayFocusSessions).toHaveLength(1)
    expect(todayFocusSessions.every((s) => s.type === "focus")).toBe(true)
    expect(
      todayFocusSessions.every((s) => s.startedAt >= todayStart && s.startedAt <= todayEnd)
    ).toBe(true)
  })
})

describe("concludeSession()", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.activeTimer.put({ id: "singleton", sessionIdx: 0, timerState: runningState })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("leaves the sessions untouched if the active timer cannot be recorded", async () => {
    vi.spyOn(db.activeTimer, "put").mockRejectedValue(new Error("disk full"))
    const logError = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })
    ).resolves.toBeUndefined()

    const activeTimer = await db.activeTimer.get("singleton")

    expect(activeTimer?.sessionIdx).toBe(0)
    expect(activeTimer?.timerState).toEqual(runningState)
    expect(await db.sessions.count()).toBe(0)
    expect(logError).toHaveBeenCalled()
  })

  test("leaves the active timer untouched if the session cannot be recorded", async () => {
    vi.spyOn(db.sessions, "add").mockRejectedValue(new Error("disk full"))
    const logError = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })
    ).resolves.toBeUndefined()

    const activeTimer = await db.activeTimer.get("singleton")

    expect(activeTimer?.sessionIdx).toBe(0)
    expect(activeTimer?.timerState).toEqual(runningState)
    expect(await db.sessions.count()).toBe(0)
    expect(logError).toHaveBeenCalled()

    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })
    ).resolves.toBeUndefined()
  })

  test("ends the active timer and records the session together", async () => {
    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })
    ).resolves.toBeUndefined()

    const activeTimer = await db.activeTimer.get("singleton")
    const sessions = await db.sessions.toArray()

    expect(activeTimer?.sessionIdx).toBe(0)
    expect(activeTimer?.timerState).toEqual(endedState)
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject(completedSession)
    expect(sessions[0].id).toEqual(expect.any(Number)) // auto-incremented ID
  })

  test("records a session once when more than one tab concludes it", async () => {
    await concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })
    await concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })

    expect(await db.sessions.count()).toBe(1)
  })

  test("records the next run of the same session index as a new session", async () => {
    await concludeSession({ sessionIdx: 0, timerState: endedState }, { ...completedSession })

    const laterStart = BASE_TIME + 60 * 60 * 1000
    await db.activeTimer.put({
      id: "singleton",
      sessionIdx: 0,
      timerState: { status: "running", startedAt: laterStart, endsAt: laterStart + DURATION_MS }
    })

    await concludeSession(
      { sessionIdx: 0, timerState: { status: "ended", startedAt: laterStart, remainingMs: 0 } },
      { ...completedSession, startedAt: laterStart, endedAt: laterStart + DURATION_MS }
    )

    expect(await db.sessions.count()).toBe(2)
  })
})
