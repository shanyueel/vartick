import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import "fake-indexeddb/auto"
import { db } from "@/lib/db"
import {
  queryActiveTimer,
  loadActiveTimer,
  saveActiveTimer,
  clearActiveTimer
} from "./active-timer"
import type { InitialState } from "@/lib/timer/type"

const BASE_TIME = new Date("2026-01-01T12:00:00Z").getTime()
const DURATION_MS = 25 * 60 * 1000

const running: InitialState = {
  sessionIdx: 0,
  timerState: { status: "running", startedAt: BASE_TIME, endsAt: BASE_TIME + DURATION_MS }
}

const paused: InitialState = {
  sessionIdx: 2,
  timerState: { status: "paused", startedAt: BASE_TIME, remainingMs: 7000 }
}

describe("active timer operations", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("queryActiveTimer()", () => {
    test("returns undefined when no timer is stored", async () => {
      expect(await queryActiveTimer()).toBeUndefined()
    })

    test("returns the stored timer", async () => {
      await db.activeTimer.put({ id: "singleton", ...running })

      expect(await queryActiveTimer()).toEqual({ id: "singleton", ...running })
    })

    // useLiveQuery re-runs a querier by catching what it throws, so this read
    // must not handle its own errors the way loadActiveTimer does.
    test("throws errors when reading the active timer fails", async () => {
      vi.spyOn(db.activeTimer, "get").mockRejectedValue(new Error("read failed"))

      await expect(queryActiveTimer()).rejects.toThrow("read failed")
    })
  })

  describe("loadActiveTimer()", () => {
    test("returns undefined and logs when the read fails", async () => {
      vi.spyOn(db.activeTimer, "get").mockRejectedValue(new Error("read failed"))
      const logError = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(await loadActiveTimer()).toBeUndefined()
      expect(logError).toHaveBeenCalled()
    })

    test("returns undefined when no timer is stored", async () => {
      expect(await loadActiveTimer()).toBeUndefined()
    })

    test("returns the stored timer", async () => {
      await db.activeTimer.put({ id: "singleton", ...paused })

      expect(await loadActiveTimer()).toEqual({ id: "singleton", ...paused })
    })
  })

  describe("saveActiveTimer()", () => {
    test("logs errors rather than throws when the write fails", async () => {
      vi.spyOn(db.activeTimer, "put").mockRejectedValue(new Error("write failed"))
      const logError = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(saveActiveTimer(running)).resolves.toBeUndefined()
      expect(logError).toHaveBeenCalled()
    })

    test("stores the timer under the singleton key", async () => {
      await saveActiveTimer(running)

      expect(await db.activeTimer.get("singleton")).toEqual({ id: "singleton", ...running })
      expect(await db.activeTimer.count()).toBe(1)
    })

    test("replaces the previously stored timer", async () => {
      await saveActiveTimer(running)
      await saveActiveTimer(paused)

      expect(await db.activeTimer.get("singleton")).toEqual({ id: "singleton", ...paused })
      expect(await db.activeTimer.count()).toBe(1)
    })
  })

  describe("clearActiveTimer()", () => {
    test("logs errors rather than throws when the delete fails", async () => {
      await db.activeTimer.put({ ...running, id: "singleton" })

      vi.spyOn(db.activeTimer, "delete").mockRejectedValue(new Error("delete failed"))
      const logError = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(clearActiveTimer()).resolves.toBeUndefined()

      expect(logError).toHaveBeenCalled()
      expect(await db.activeTimer.get("singleton")).toEqual({ ...running, id: "singleton" })
    })

    test("removes the stored timer", async () => {
      await db.activeTimer.put({ ...running, id: "singleton" })

      await clearActiveTimer()

      expect(await db.activeTimer.get("singleton")).toBeUndefined()
    })
  })
})
