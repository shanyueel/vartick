import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import "fake-indexeddb/auto"
import { db } from "@/lib/db"
import { concludeSession } from "./sessions"
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
      concludeSession({ sessionIdx: 0, timerState: endedState }, completedSession)
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
      concludeSession({ sessionIdx: 0, timerState: endedState }, completedSession)
    ).resolves.toBeUndefined()

    const activeTimer = await db.activeTimer.get("singleton")

    expect(activeTimer?.sessionIdx).toBe(0)
    expect(activeTimer?.timerState).toEqual(runningState)
    expect(await db.sessions.count()).toBe(0)
    expect(logError).toHaveBeenCalled()

    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, completedSession)
    ).resolves.toBeUndefined()
  })

  test("ends the active timer and records the session together", async () => {
    await expect(
      concludeSession({ sessionIdx: 0, timerState: endedState }, completedSession)
    ).resolves.toBeUndefined()

    const activeTimer = await db.activeTimer.get("singleton")
    const sessions = await db.sessions.toArray()

    expect(activeTimer?.sessionIdx).toBe(0)
    expect(activeTimer?.timerState).toEqual(endedState)
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject(completedSession)
    expect(sessions[0].id).toEqual(expect.any(Number)) // auto-incremented ID
  })
})
