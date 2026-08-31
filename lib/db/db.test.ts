import { describe, test, expect, beforeEach } from "vitest"
import "fake-indexeddb/auto"
import { db, type Session } from "./db"

const clearDb = async () => {
  await db.delete()
  await db.open()
}

describe("IndexedDB Tests", () => {
  beforeEach(async () => {
    await clearDb()
  })

  test("db is created with expected tables", async () => {
    const tables = db.tables.map((t) => t.name).sort()
    expect(tables).toEqual(["activeTimer", "sessions", "settings"])
  })

  /* settings Table */
  test("update the singleton settings", async () => {
    await db.settings.put({
      id: "singleton",
      focusMin: 15,
      shortBreakMin: 5,
      longBreakMin: 30,
      cyclesBeforeLongBreak: 6,
      soundEnabled: false,
      notificationsEnabled: false
    })

    const oldSettings = await db.settings.get("singleton")

    expect(oldSettings).toBeDefined()
    expect(oldSettings?.focusMin).toBe(15)
    expect(oldSettings?.shortBreakMin).toBe(5)
    expect(oldSettings?.longBreakMin).toBe(30)
    expect(oldSettings?.cyclesBeforeLongBreak).toBe(6)
    expect(oldSettings?.soundEnabled).toBe(false)
    expect(oldSettings?.notificationsEnabled).toBe(false)

    await db.settings.put({
      id: "singleton",
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      cyclesBeforeLongBreak: 4,
      soundEnabled: true,
      notificationsEnabled: true
    })

    const settings = await db.settings.get("singleton")

    expect(settings).toBeDefined()
    expect(settings?.focusMin).toBe(25)
    expect(settings?.shortBreakMin).toBe(5)
    expect(settings?.longBreakMin).toBe(15)
    expect(settings?.cyclesBeforeLongBreak).toBe(4)
    expect(settings?.soundEnabled).toBe(true)
    expect(settings?.notificationsEnabled).toBe(true)

    // checking the singleton nature
    const allSettings = await db.settings.count()
    expect(allSettings).toBe(1)
  })

  /* activeTimer Table */
  describe("activeTimer table", () => {
    const startTime = new Date("2026-01-01T12:00:00Z").getTime()
    const durationMs = 25 * 60 * 1000

    test("stores a running timer", async () => {
      await db.activeTimer.put({
        id: "singleton",
        type: "shortBreak",
        status: "running",
        startedAt: startTime,
        endsAt: startTime + durationMs,
        plannedDurationMs: durationMs
      })

      const timer = await db.activeTimer.get("singleton")

      if (timer?.status !== "running") throw new Error("expected running timer")

      expect(timer.type).toBe("shortBreak")
      expect(timer.startedAt).toBe(startTime)
      expect(timer.endsAt).toBe(startTime + durationMs)
      expect(timer.plannedDurationMs).toBe(durationMs)
    })

    test("stores a paused timer", async () => {
      const remainingMs = durationMs - 5 * 60 * 1000

      await db.activeTimer.put({
        id: "singleton",
        type: "shortBreak",
        status: "paused",
        startedAt: startTime,
        remainingMs,
        plannedDurationMs: durationMs
      })

      const timer = await db.activeTimer.get("singleton")

      if (timer?.status !== "paused") throw new Error("expected paused timer")

      expect(timer.type).toBe("shortBreak")
      expect(timer.startedAt).toBe(startTime)
      expect(timer.remainingMs).toBe(remainingMs)
      expect(timer.plannedDurationMs).toBe(durationMs)
    })

    test("put() fully overwrites and no stale fields survive a status change", async () => {
      // start running
      await db.activeTimer.put({
        id: "singleton",
        type: "shortBreak",
        status: "running",
        startedAt: startTime,
        endsAt: startTime + durationMs,
        plannedDurationMs: durationMs
      })

      // pause after 5 minutes
      const remainingMs = durationMs - 5 * 60 * 1000

      await db.activeTimer.put({
        id: "singleton",
        type: "shortBreak",
        status: "paused",
        startedAt: startTime,
        remainingMs,
        plannedDurationMs: durationMs
      })

      const pausedTimer = await db.activeTimer.get("singleton")
      if (pausedTimer?.status !== "paused") throw new Error("expected paused timer")
      expect("endsAt" in pausedTimer).toBe(false)

      // resume
      const resumedStartTime = new Date("2026-01-01T12:30:00Z").getTime()
      const newEndsAt = resumedStartTime + remainingMs

      await db.activeTimer.put({
        id: "singleton",
        type: "shortBreak",
        status: "running",
        startedAt: startTime,
        endsAt: newEndsAt,
        plannedDurationMs: durationMs
      })

      const resumedTimer = await db.activeTimer.get("singleton")
      if (resumedTimer?.status !== "running") throw new Error("expected running timer")
      expect("remainingMs" in resumedTimer).toBe(false)
      expect(resumedTimer.endsAt).toBe(newEndsAt)
    })

    test("singleton stays singleton across multiple writes", async () => {
      await db.activeTimer.put({
        id: "singleton",
        type: "focus",
        status: "running",
        startedAt: startTime,
        endsAt: startTime + durationMs,
        plannedDurationMs: durationMs
      })

      await db.activeTimer.put({
        id: "singleton",
        type: "longBreak",
        status: "paused",
        startedAt: startTime,
        remainingMs: durationMs - 60 * 1000,
        plannedDurationMs: durationMs
      })

      const allTimers = await db.activeTimer.count()
      expect(allTimers).toBe(1)
    })

    test("delete removes the active timer", async () => {
      await db.activeTimer.put({
        id: "singleton",
        type: "focus",
        status: "running",
        startedAt: startTime,
        endsAt: startTime + durationMs,
        plannedDurationMs: durationMs
      })

      await db.activeTimer.delete("singleton")

      const noTimer = await db.activeTimer.get("singleton")
      expect(noTimer).toBeUndefined()
    })
  })

  /* sessions Table */
  describe("sessions table", () => {
    test("insert a session", async () => {
      const startTime = new Date("2026-01-01T12:00:00Z").getTime()
      const durationSec = 25 * 60

      await db.sessions.add({
        id: "1",
        type: "focus",
        startedAt: startTime,
        endedAt: startTime + durationSec * 1000,
        plannedDurationMs: durationSec * 1000,
        actualDurationMs: 15 * 60 * 1000, // user abandoned after 15 minutes
        status: "abandoned"
      })

      const session = await db.sessions.get("1")

      expect(session).toBeDefined()
      expect(session?.type).toBe("focus")
      expect(session?.startedAt).toBe(startTime)
      expect(session?.endedAt).toBe(startTime + durationSec * 1000)
      expect(session?.plannedDurationMs).toBe(25 * 60 * 1000)
      expect(session?.actualDurationMs).toBe(15 * 60 * 1000)
      expect(session?.status).toBe("abandoned")
    })

    test("query sessions by type and status", async () => {
      const dummyData: Session[] = [
        {
          id: "1",
          type: "focus",
          startedAt: new Date("2026-01-01T12:00:00Z").getTime(),
          endedAt: new Date("2026-01-01T12:30:00Z").getTime(),
          plannedDurationMs: 25 * 60 * 1000,
          actualDurationMs: 25 * 60 * 1000,
          status: "completed"
        },
        {
          id: "2",
          type: "shortBreak",
          startedAt: new Date("2026-01-01T12:30:00Z").getTime(),
          endedAt: new Date("2026-01-01T12:35:00Z").getTime(),
          plannedDurationMs: 5 * 60 * 1000,
          actualDurationMs: 5 * 60 * 1000,
          status: "completed"
        },
        {
          id: "3",
          type: "focus",
          startedAt: new Date("2026-01-01T12:35:00Z").getTime(),
          endedAt: new Date("2026-01-01T12:50:00Z").getTime(),
          plannedDurationMs: 15 * 60 * 1000,
          actualDurationMs: 10 * 60 * 1000,
          status: "abandoned"
        },
        {
          id: "4",
          type: "longBreak",
          startedAt: new Date("2026-01-01T12:50:00Z").getTime(),
          endedAt: new Date("2026-01-01T13:05:00Z").getTime(),
          plannedDurationMs: 15 * 60 * 1000,
          actualDurationMs: 15 * 60 * 1000,
          status: "completed"
        }
      ]

      await db.sessions.bulkAdd(dummyData)

      const focusSessions = await db.sessions.where("type").equals("focus").toArray()

      expect(focusSessions.length).toBe(2)

      const completedSessions = await db.sessions.where("status").equals("completed").toArray()

      expect(completedSessions.length).toBe(3)
    })
  })
})
