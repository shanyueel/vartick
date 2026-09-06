import { describe, test, expect, beforeEach } from "vitest"
import "fake-indexeddb/auto"
import { db, type Session } from "."
import type { TimerState } from "@/lib/timer/type"

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

    test("stores a pending timer", async () => {
      const timerState: TimerState = {
        status: "pending"
      }

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 1,
        timerState: { ...timerState }
      })

      const timer = await db.activeTimer.get("singleton")

      if (!timer) {
        throw new Error("expected an existing timer record")
      }

      if (timer.timerState.status !== "pending") {
        throw new Error("expected pending timer")
      }

      expect(timer.sessionIdx).toBe(1)
      expect(timer.timerState).toEqual(timerState)
    })

    test("stores a running timer", async () => {
      const timerState: TimerState = {
        status: "running",
        startedAt: startTime,
        endsAt: startTime + durationMs
      }

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 2,
        timerState: { ...timerState }
      })

      const timer = await db.activeTimer.get("singleton")

      if (!timer) {
        throw new Error("expected an existing timer record")
      }

      if (timer.timerState.status !== "running") {
        throw new Error("expected running timer")
      }

      expect(timer.sessionIdx).toBe(2)
      expect(timer.timerState).toEqual(timerState)
    })

    test("stores a paused timer", async () => {
      const remainingMs = durationMs - 5 * 60 * 1000

      const timerState: TimerState = {
        status: "paused",
        startedAt: startTime,
        remainingMs
      }

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 3,
        timerState: { ...timerState }
      })

      const timer = await db.activeTimer.get("singleton")

      if (!timer) {
        throw new Error("expected an existing timer record")
      }

      if (timer.timerState.status !== "paused") {
        throw new Error("expected paused timer")
      }

      expect(timer.sessionIdx).toBe(3)
      expect(timer.timerState).toEqual(timerState)
    })

    test("put() fully overwrites and no stale fields survive a status change", async () => {
      // start running
      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 4,
        timerState: {
          status: "running",
          startedAt: startTime,
          endsAt: startTime + durationMs
        }
      })

      // pause after 5 minutes
      const remainingMs = durationMs - 5 * 60 * 1000

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 4,
        timerState: {
          status: "paused",
          startedAt: startTime,
          remainingMs: remainingMs
        }
      })

      const pausedTimer = await db.activeTimer.get("singleton")

      if (!pausedTimer) {
        throw new Error("expected an existing timer record")
      }

      if (pausedTimer.timerState.status !== "paused") throw new Error("expected paused timer")
      expect("endsAt" in pausedTimer.timerState).toBe(false)

      // resume
      const resumedStartTime = new Date("2026-01-01T12:30:00Z").getTime()
      const newEndsAt = resumedStartTime + remainingMs

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 4,
        timerState: {
          status: "running",
          startedAt: startTime,
          endsAt: newEndsAt
        }
      })

      const resumedTimer = await db.activeTimer.get("singleton")

      if (!resumedTimer) {
        throw new Error("expected an existing timer record")
      }

      if (resumedTimer.timerState.status !== "running") {
        throw new Error("expected running timer")
      }

      expect("remainingMs" in resumedTimer.timerState).toBe(false)
      expect(resumedTimer.timerState.endsAt).toBe(newEndsAt)
    })

    test("singleton stays singleton across multiple writes", async () => {
      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 5,
        timerState: {
          status: "running",
          startedAt: startTime,
          endsAt: startTime + durationMs
        }
      })

      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 5,
        timerState: {
          status: "paused",
          startedAt: startTime,
          remainingMs: durationMs - 60 * 1000
        }
      })

      const allTimers = await db.activeTimer.count()
      expect(allTimers).toBe(1)
    })

    test("delete removes the active timer", async () => {
      await db.activeTimer.put({
        id: "singleton",
        sessionIdx: 6,
        timerState: {
          status: "running",
          startedAt: startTime,
          endsAt: startTime + durationMs
        }
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
          startedAt: new Date("2026-01-01T12:35:00Z").getTime(),
          endedAt: new Date("2026-01-01T12:35:00Z").getTime(),
          plannedDurationMs: 5 * 60 * 1000,
          actualDurationMs: 0,
          status: "skipped"
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

      expect(completedSessions.length).toBe(2)
    })
  })
})
