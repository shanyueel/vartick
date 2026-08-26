import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { Timer } from "./timer"

describe("Timer Tests", () => {
  // Use fake timers to control the passage of time in tests
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  describe("construction", () => {
    test.for([
      { name: "negative", duration: -1 },
      { name: "zero", duration: 0 },
      { name: "non-integer", duration: 1.5 }
    ] as { name: string; duration: number }[])(
      "throws error if the parameters are invalid ($name)",
      ({ duration }) => {
        expect(() => new Timer(duration)).toThrow(
          "Invalid timer duration, must be a positive integer"
        )
      }
    )
  })

  describe("getCurrent()", () => {
    test("returns 'pending' status and remaining seconds before timer is started", () => {
      const timer = new Timer(10)

      expect(timer.getCurrent()).toEqual({
        status: "pending",
        remainingSec: 10
      })
    })

    test("returns 'running' status and remaining seconds while the timer is running", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 7
      })
    })

    test("returns 'paused' status and remaining seconds when the timer is paused", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingSec: 7
      })
    })

    test("returns 'running' status and remaining seconds after resuming", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(1000)
      timer.pause()
      timer.resume()

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 9
      })
    })

    test("returns 'expired' status and remaining seconds after the timer is expired", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(10000)

      expect(timer.getCurrent()).toEqual({
        status: "expired",
        remainingSec: 0
      })
    })

    test("never return a negative remaining seconds, even if the timer is overdue", () => {
      const timer = new Timer(1)

      timer.start()

      vi.advanceTimersByTime(2000)

      const current = timer.getCurrent()

      expect(current).toEqual({
        status: "expired",
        remainingSec: 0
      })
    })
  })

  describe("start()", () => {
    test("throws error if the timer has been stopped", () => {
      const timer = new Timer(10)

      timer.stop()

      expect(() => timer.start()).toThrow("Timer can't be started since it has been stopped")
    })

    test("throws error if the timer is already started (running / paused / expired)", () => {
      const timer = new Timer(10)

      timer.start()
      expect(() => timer.start()).toThrow("Timer can't be started since it has already started")

      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(() => timer.start()).toThrow("Timer can't be started since it has already started")

      timer.resume()
      vi.advanceTimersByTime(7000)

      expect(() => timer.start()).toThrow("Timer can't be started since it has already started")
    })
  })

  describe("pause()", () => {
    test("throws error if the timer has been stopped", () => {
      const timer = new Timer(10)

      timer.stop()

      expect(() => timer.pause()).toThrow("Timer can't be paused since it has been stopped")
    })

    test("throws error if the timer is not started or has expired", () => {
      const timer = new Timer(10)

      expect(() => timer.pause()).toThrow("Timer can't be paused if it is not started")

      timer.start()
      vi.advanceTimersByTime(10000)

      expect(() => timer.pause()).toThrow("Timer can't be paused if it has expired")
    })

    test("no-op if the timer is already paused", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingSec: 7
      })
      expect(() => timer.pause()).not.toThrow()
    })
  })

  describe("resume()", () => {
    test("throws error if the timer has been stopped", () => {
      const timer = new Timer(10)

      timer.stop()

      expect(() => timer.resume()).toThrow("Timer can't be resumed since it has been stopped")
    })

    test("throws error if the timer is not started or expired", () => {
      const timer = new Timer(10)

      expect(() => timer.resume()).toThrow("Timer can't be resumed before the timer has started")

      timer.start()
      vi.advanceTimersByTime(10000)

      expect(() => timer.resume()).toThrow("Timer can't be resumed if it has expired")
    })

    test("no-op if the timer is already running", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 7
      })
      expect(() => timer.resume()).not.toThrow()
    })
  })

  describe("stop()", () => {
    test("throws error if the timer has already been stopped", () => {
      const timer = new Timer(10)

      timer.start()
      timer.stop()

      expect(() => timer.stop()).toThrow("Timer has already been stopped")
    })

    test("returns the final snapshot and remove the timer before it has started", () => {
      const timer = new Timer(10)

      const snapshot = timer.stop()

      expect(snapshot).toEqual({
        startedAt: undefined,
        endedAt: undefined,
        remainingSec: 10,
        durationSec: 10
      })
    })

    test("return the final snapshot and remove the timer while running", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)

      const { startedAt, endedAt, remainingSec, durationSec } = timer.stop()
      if (startedAt === undefined || endedAt === undefined) {
        throw new Error("expected a started timer")
      }

      expect(endedAt - startedAt).toBe(3000)
      expect(remainingSec).toBe(7)
      expect(durationSec).toBe(10)
    })

    test("return the final snapshot and remove the timer while paused", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()
      vi.advanceTimersByTime(2000)

      const { startedAt, endedAt, remainingSec, durationSec } = timer.stop()

      if (startedAt === undefined || endedAt === undefined) {
        throw new Error("expected a started timer")
      }

      expect(endedAt - startedAt).toBe(5000)
      expect(remainingSec).toBe(7)
      expect(durationSec).toBe(10)
    })

    test("return the final snapshot and remove the timer while expired", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(10000)

      const { startedAt, endedAt, remainingSec, durationSec } = timer.stop()

      if (startedAt === undefined || endedAt === undefined) {
        throw new Error("expected a started timer")
      }

      expect(endedAt - startedAt).toBe(10000)
      expect(remainingSec).toBe(0)
      expect(durationSec).toBe(10)
    })
  })
})
