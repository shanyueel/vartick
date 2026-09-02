import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { Timer, type TimerState } from "./timer"

const BASE_TIME = Date.parse("2026-01-01T00:00:00.000Z")

const invalidDurations: { name: string; duration: number }[] = [
  { name: "negative", duration: -1 },
  { name: "zero", duration: 0 },
  { name: "non-integer", duration: 1.5 }
]

describe("Timer Tests", () => {
  // Use fake timers to control the passage of time in tests
  beforeEach(() => vi.useFakeTimers({ now: BASE_TIME }))
  afterEach(() => vi.useRealTimers())

  describe("Timer.create()", () => {
    test.for(invalidDurations)(
      "throws error if the parameters are invalid ($name)",
      ({ duration }) => {
        expect(() => Timer.create(duration)).toThrow(
          "Invalid timer duration, must be a positive integer"
        )
      }
    )
  })

  describe("Timer.fromSnapshot()", () => {
    test("throws error if the duration is invalid, before the snapshot is read", () => {
      expect(() => Timer.fromSnapshot(0, { status: "pending" })).toThrow(
        "Invalid timer duration, must be a positive integer"
      )
    })

    test.for([
      {
        name: "unknown status",
        snapshot: { status: "unknown" },
        message: "Invalid timer snapshot, unknown status: unknown"
      },
      {
        name: "pending carrying keys it has no business holding",
        snapshot: { status: "pending", startedAt: BASE_TIME, endsAt: BASE_TIME + 10000 },
        message: "Invalid 'pending' timer snapshot, unexpected keys: startedAt, endsAt"
      },
      {
        name: "running carrying a paused timer's remainder",
        snapshot: {
          status: "running",
          startedAt: BASE_TIME,
          endsAt: BASE_TIME + 10000,
          remainingMs: 7000
        },
        message: "Invalid 'running' timer snapshot, unexpected keys: remainingMs"
      },
      {
        name: "running with a NaN startedAt",
        snapshot: { status: "running", startedAt: NaN, endsAt: BASE_TIME + 10000 },
        message: "Invalid 'running' timer snapshot, startedAt must be an integer"
      },
      {
        name: "ended with a fractional startedAt",
        snapshot: { status: "ended", startedAt: BASE_TIME + 1.5, remainingMs: 7000 },
        message: "Invalid 'ended' timer snapshot, startedAt must be an integer"
      },
      {
        name: "running missing endsAt entirely",
        snapshot: { status: "running", startedAt: BASE_TIME },
        message: "Invalid 'running' timer snapshot, endsAt must be an integer after startedAt"
      },
      {
        name: "running that ends before it started",
        snapshot: { status: "running", startedAt: BASE_TIME, endsAt: BASE_TIME - 1 },
        message: "Invalid 'running' timer snapshot, endsAt must be an integer after startedAt"
      },
      {
        name: "running that ends exactly when it started",
        snapshot: { status: "running", startedAt: BASE_TIME, endsAt: BASE_TIME },
        message: "Invalid 'running' timer snapshot, endsAt must be an integer after startedAt"
      },
      {
        name: "paused with a negative remainder",
        snapshot: { status: "paused", startedAt: BASE_TIME, remainingMs: -1 },
        message: "Invalid 'paused' timer snapshot, remainingMs must be between 0 and the duration"
      },
      {
        name: "paused with a remainder longer than the duration",
        snapshot: { status: "paused", startedAt: BASE_TIME, remainingMs: 10001 },
        message: "Invalid 'paused' timer snapshot, remainingMs must be between 0 and the duration"
      },
      {
        name: "paused with a fractional remainder",
        snapshot: { status: "paused", startedAt: BASE_TIME, remainingMs: 7000.5 },
        message: "Invalid 'paused' timer snapshot, remainingMs must be between 0 and the duration"
      },
      {
        name: "ended missing remainingMs entirely",
        snapshot: { status: "ended", startedAt: BASE_TIME },
        message: "Invalid 'ended' timer snapshot, remainingMs must be between 0 and the duration"
      }
    ])("throws error if the snapshot is invalid ($name)", ({ snapshot, message }) => {
      expect(() => Timer.fromSnapshot(10000, snapshot as TimerState)).toThrow(message)
    })

    test.for([
      {
        name: "ended without a startedAt, from a timer ended before it ran",
        snapshot: { status: "ended", remainingMs: 10000 }
      },
      {
        name: "ended with a zero remainder, from a timer that ran to completion",
        snapshot: { status: "ended", startedAt: BASE_TIME, remainingMs: 0 }
      },
      {
        name: "paused with a zero remainder",
        snapshot: { status: "paused", startedAt: BASE_TIME, remainingMs: 0 }
      },
      {
        name: "a remainder equal to the full duration",
        snapshot: { status: "paused", startedAt: BASE_TIME, remainingMs: 10000 }
      }
    ])("accepts a valid snapshot ($name)", ({ snapshot }) => {
      expect(() => Timer.fromSnapshot(10000, snapshot as TimerState)).not.toThrow()
    })

    test.for([
      {
        status: "pending"
      },
      {
        status: "running",
        startedAt: BASE_TIME - 3000,
        endsAt: BASE_TIME + 7000
      },
      {
        status: "paused",
        startedAt: BASE_TIME - 3000,
        remainingMs: 7000
      },
      {
        status: "ended",
        startedAt: BASE_TIME - 3000,
        remainingMs: 7000
      }
    ] as TimerState[])("restores a timer state from a snapshot ($status)", (snapshot) => {
      const timer = Timer.fromSnapshot(10000, snapshot)

      expect(timer.getCurrent()).toEqual({
        status: snapshot.status,
        remainingMs: snapshot.status === "pending" ? 10000 : 7000
      })
    })
  })

  describe("getDurationMs()", () => {
    test("returns the duration in milliseconds, unaffected by the timer lifecycle", () => {
      const timer = Timer.create(10000)

      expect(timer.getDurationMs()).toBe(10000)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.getDurationMs()).toBe(10000)

      timer.pause()

      expect(timer.getDurationMs()).toBe(10000)

      timer.resume()
      vi.advanceTimersByTime(7000)

      expect(timer.getDurationMs()).toBe(10000)

      timer.end()

      expect(timer.getDurationMs()).toBe(10000)
    })
  })

  describe("getCurrent()", () => {
    test("returns 'pending' status and remaining milliseconds before timer is started", () => {
      const timer = Timer.create(10000)

      expect(timer.getCurrent()).toEqual({
        status: "pending",
        remainingMs: 10000
      })
    })

    test("returns 'running' status and remaining milliseconds while the timer is running", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 7000
      })
    })

    test("keeps the sub-second remainder partway through a second", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3400)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 6600
      })
    })

    test("stays 'running' with a single millisecond left", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(9999)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 1
      })
    })

    test("returns 'paused' status and remaining milliseconds when the timer is paused", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingMs: 7000
      })
    })

    test("returns 'running' status and remaining milliseconds after resuming", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(1000)
      timer.pause()
      timer.resume()

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 9000
      })
    })

    test("returns 'finished' status and remaining milliseconds after the timer runs out", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(10000)

      expect(timer.getCurrent()).toEqual({
        status: "finished",
        remainingMs: 0
      })

      vi.advanceTimersByTime(5000)

      // never return a negative remaining milliseconds, even if the timer is overdue
      expect(timer.getCurrent()).toEqual({
        status: "finished",
        remainingMs: 0
      })
    })

    test("returns 'ended' status when a timer is ended before it is started", () => {
      const timer = Timer.create(10000)

      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingMs: 10000
      })
    })

    test("returns 'ended' status and remaining milliseconds after the timer is ended", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingMs: 7000
      })
    })

    test("returns 'ended' status when a finished timer is ended", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(10000)
      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingMs: 0
      })
    })
  })

  describe("snapshot()", () => {
    test("returns the current state of the timer", () => {
      const timer = Timer.create(10000)

      expect(timer.snapshot()).toEqual({
        status: "pending"
      })

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.snapshot()).toEqual({
        status: "running",
        startedAt: BASE_TIME,
        endsAt: BASE_TIME + 10000
      })

      timer.pause()

      expect(timer.snapshot()).toEqual({
        status: "paused",
        startedAt: BASE_TIME,
        remainingMs: 7000
      })

      timer.resume()
      vi.advanceTimersByTime(7000)

      expect(timer.snapshot()).toEqual({
        status: "running",
        startedAt: BASE_TIME,
        endsAt: BASE_TIME + 10000
      })

      timer.end()

      expect(timer.snapshot()).toEqual({
        status: "ended",
        startedAt: BASE_TIME,
        remainingMs: 0
      })
    })
  })

  describe("start()", () => {
    test.for([
      {
        name: "running",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
        },
        message: "Timer can't be started since it has already started"
      },
      {
        name: "paused",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
          timer.pause()
        },
        message: "Timer can't be started since it has already started"
      },
      {
        name: "finished",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(10000)
        },
        message: "Timer can't be started since it is finished"
      },
      {
        name: "ended",
        arrange: (timer: Timer) => timer.end(),
        message: "Timer can't be started since it has ended"
      }
    ])("throws error if the timer is not pending ($name)", ({ arrange, message }) => {
      const timer = Timer.create(10000)

      arrange(timer)

      expect(() => timer.start()).toThrow(message)
    })
  })

  describe("pause()", () => {
    test.for([
      {
        name: "pending",
        arrange: (_timer: Timer) => {},
        message: "Timer can't be paused since it is not started"
      },
      {
        name: "finished",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(10000)
        },
        message: "Timer can't be paused since it is finished"
      },
      {
        name: "ended",
        arrange: (timer: Timer) => timer.end(),
        message: "Timer can't be paused since it has ended"
      }
    ])("throws error if the timer can't be paused ($name)", ({ arrange, message }) => {
      const timer = Timer.create(10000)

      arrange(timer)

      expect(() => timer.pause()).toThrow(message)
    })

    test("freezes the exact sub-second remainder it was paused at", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3400)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingMs: 6600
      })

      // the frozen remainder must not drift while the timer sits paused
      vi.advanceTimersByTime(5000)

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingMs: 6600
      })
    })

    test("no-op if the timer is already paused", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(() => timer.pause()).not.toThrow()

      // the second pause must not consume any of the remaining time
      vi.advanceTimersByTime(2000)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingMs: 7000
      })
    })
  })

  describe("resume()", () => {
    test.for([
      {
        name: "pending",
        arrange: (_timer: Timer) => {},
        message: "Timer can't be resumed before it has started"
      },
      {
        name: "finished",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(10000)
        },
        message: "Timer can't be resumed since it is finished"
      },
      {
        name: "ended",
        arrange: (timer: Timer) => timer.end(),
        message: "Timer can't be resumed since it has ended"
      }
    ])("throws error if the timer can't be resumed ($name)", ({ arrange, message }) => {
      const timer = Timer.create(10000)

      arrange(timer)

      expect(() => timer.resume()).toThrow(message)
    })

    test("no-op if the timer is already running", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(() => timer.resume()).not.toThrow()

      // the redundant resume must not push the deadline back
      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 7000
      })

      vi.advanceTimersByTime(2000)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 5000
      })
    })
  })

  describe("end()", () => {
    test("throws error if the timer has already ended", () => {
      const timer = Timer.create(10000)

      timer.end()

      expect(() => timer.end()).toThrow("Timer can't be ended since it has already ended")
    })

    test.for([
      {
        name: "pending",
        arrange: (_timer: Timer) => {},
        expected: {
          startedAt: undefined,
          endedAt: undefined,
          remainingMs: 10000,
          durationMs: 10000
        }
      },
      {
        name: "running",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
        },
        expected: {
          startedAt: BASE_TIME,
          endedAt: BASE_TIME + 3000,
          remainingMs: 7000,
          durationMs: 10000
        }
      },
      {
        name: "paused",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
          timer.pause()
          vi.advanceTimersByTime(2000)
        },
        expected: {
          startedAt: BASE_TIME,
          endedAt: BASE_TIME + 5000,
          remainingMs: 7000,
          durationMs: 10000
        }
      },
      {
        name: "finished",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(10000)
        },
        expected: {
          startedAt: BASE_TIME,
          endedAt: BASE_TIME + 10000,
          remainingMs: 0,
          durationMs: 10000
        }
      }
    ])("returns the final snapshot of the timer ($name)", ({ arrange, expected }) => {
      const timer = Timer.create(10000)

      arrange(timer)

      expect(timer.end()).toEqual(expected)
    })
  })

  describe("reset()", () => {
    test.for(invalidDurations)(
      "throws error if the parameters are invalid ($name)",
      ({ duration }) => {
        const timer = Timer.create(10000)

        timer.end()

        expect(() => timer.reset(duration)).toThrow(
          "Invalid timer duration, must be a positive integer"
        )
      }
    )

    test.for([
      { name: "pending", arrange: (_timer: Timer) => {} },
      {
        name: "running",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
        }
      },
      {
        name: "paused",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(3000)
          timer.pause()
        }
      },
      {
        name: "finished",
        arrange: (timer: Timer) => {
          timer.start()
          vi.advanceTimersByTime(10000)
        }
      }
    ])("throws error if the timer has not ended ($name)", ({ arrange }) => {
      const timer = Timer.create(10000)

      arrange(timer)

      expect(() => timer.reset(20000)).toThrow("Timer can't be reset since it is not ended")
    })

    test("resets the timer with the given duration", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()
      timer.reset(20000)

      expect(timer.getDurationMs()).toBe(20000)
      expect(timer.getCurrent()).toEqual({
        status: "pending",
        remainingMs: 20000
      })
    })

    test("an ended timer can be reset and started again", () => {
      const timer = Timer.create(10000)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()
      timer.reset(20000)

      expect(() => timer.start()).not.toThrow()
      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingMs: 20000
      })
    })
  })
})
