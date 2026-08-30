import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { Timer } from "./timer"

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

  describe("construction", () => {
    test.for(invalidDurations)(
      "throws error if the parameters are invalid ($name)",
      ({ duration }) => {
        expect(() => new Timer(duration)).toThrow(
          "Invalid timer duration, must be a positive integer"
        )
      }
    )
  })

  describe("getDurationSec()", () => {
    test("returns the duration in seconds, unaffected by the timer lifecycle", () => {
      const timer = new Timer(10)

      expect(timer.getDurationSec()).toBe(10)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(timer.getDurationSec()).toBe(10)

      timer.pause()

      expect(timer.getDurationSec()).toBe(10)

      timer.resume()
      vi.advanceTimersByTime(7000)

      expect(timer.getDurationSec()).toBe(10)

      timer.end()

      expect(timer.getDurationSec()).toBe(10)
    })
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

    test("rounds the remaining seconds up within the final second", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(9500)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 1
      })
    })

    test("returns 'finished' status and remaining seconds after the timer runs out", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(10000)

      expect(timer.getCurrent()).toEqual({
        status: "finished",
        remainingSec: 0
      })

      vi.advanceTimersByTime(5000)

      // never return a negative remaining seconds, even if the timer is overdue
      expect(timer.getCurrent()).toEqual({
        status: "finished",
        remainingSec: 0
      })
    })

    test("returns 'ended' status when a timer is ended before it is started", () => {
      const timer = new Timer(10)

      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingSec: 10
      })
    })

    test("returns 'ended' status and remaining seconds after the timer is ended", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingSec: 7
      })
    })

    test("returns 'ended' status when a finished timer is ended", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(10000)
      timer.end()

      expect(timer.getCurrent()).toEqual({
        status: "ended",
        remainingSec: 0
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
      const timer = new Timer(10)

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
      const timer = new Timer(10)

      arrange(timer)

      expect(() => timer.pause()).toThrow(message)
    })

    test("no-op if the timer is already paused", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.pause()

      expect(() => timer.pause()).not.toThrow()

      // the second pause must not consume any of the remaining time
      vi.advanceTimersByTime(2000)
      timer.pause()

      expect(timer.getCurrent()).toEqual({
        status: "paused",
        remainingSec: 7
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
      const timer = new Timer(10)

      arrange(timer)

      expect(() => timer.resume()).toThrow(message)
    })

    test("no-op if the timer is already running", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)

      expect(() => timer.resume()).not.toThrow()

      // the redundant resume must not push the deadline back
      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 7
      })

      vi.advanceTimersByTime(2000)

      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 5
      })
    })
  })

  describe("end()", () => {
    test("throws error if the timer has already ended", () => {
      const timer = new Timer(10)

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
          remainingSec: 10,
          durationSec: 10
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
          remainingSec: 7,
          durationSec: 10
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
          remainingSec: 7,
          durationSec: 10
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
          remainingSec: 0,
          durationSec: 10
        }
      }
    ])("returns the final snapshot of the timer ($name)", ({ arrange, expected }) => {
      const timer = new Timer(10)

      arrange(timer)

      expect(timer.end()).toEqual(expected)
    })
  })

  describe("reset()", () => {
    test.for(invalidDurations)(
      "throws error if the parameters are invalid ($name)",
      ({ duration }) => {
        const timer = new Timer(10)

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
      const timer = new Timer(10)

      arrange(timer)

      expect(() => timer.reset(20)).toThrow("Timer can't be reset since it is not ended")
    })

    test("resets the timer with the given duration", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()
      timer.reset(20)

      expect(timer.getDurationSec()).toBe(20)
      expect(timer.getCurrent()).toEqual({
        status: "pending",
        remainingSec: 20
      })
    })

    test("an ended timer can be reset and started again", () => {
      const timer = new Timer(10)

      timer.start()
      vi.advanceTimersByTime(3000)
      timer.end()
      timer.reset(20)

      expect(() => timer.start()).not.toThrow()
      expect(timer.getCurrent()).toEqual({
        status: "running",
        remainingSec: 20
      })
    })
  })
})
