type TimerStatus = "pending" | "running" | "paused" | "finished" | "ended"

type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }
  | { status: "ended"; startedAt?: number; remainingMs: number }

export class Timer {
  private state: TimerState = { status: "pending" }
  private durationSec: number

  private static validateDuration(durationSec: number) {
    if (durationSec <= 0 || !Number.isInteger(durationSec)) {
      throw new Error("Invalid timer duration, must be a positive integer")
    }
  }

  private isFinished() {
    return this.state.status === "running" && Date.now() >= this.state.endsAt
  }

  constructor(durationSec: number) {
    Timer.validateDuration(durationSec)

    this.durationSec = durationSec
  }

  getDurationSec() {
    return this.durationSec
  }

  getCurrent(): { status: TimerStatus; remainingSec: number } {
    if (this.state.status === "pending") {
      return {
        status: "pending",
        remainingSec: this.durationSec
      }
    }

    if (this.state.status === "paused") {
      return {
        status: "paused",
        remainingSec: Math.ceil(this.state.remainingMs / 1000)
      }
    }

    // status: "running" or "finished"
    if (this.state.status === "running") {
      const remainingMs = this.state.endsAt - Date.now()

      return remainingMs <= 0
        ? { status: "finished", remainingSec: 0 }
        : { status: "running", remainingSec: Math.ceil(remainingMs / 1000) }
    }

    // status: "ended"
    return {
      status: "ended",
      remainingSec: Math.ceil(this.state.remainingMs / 1000)
    }
  }

  start() {
    if (this.state.status !== "pending") {
      if (this.isFinished()) {
        throw new Error("Timer can't be started since it is finished")
      }

      if (this.state.status === "ended") {
        throw new Error("Timer can't be started since it has ended")
      }

      // status: "running" or "paused"
      throw new Error("Timer can't be started since it has already started")
    }

    const startedAt = Date.now()
    this.state = { status: "running", startedAt, endsAt: startedAt + this.durationSec * 1000 }
  }

  pause() {
    if (this.state.status === "pending") {
      throw new Error("Timer can't be paused since it is not started")
    }

    if (this.isFinished()) {
      throw new Error("Timer can't be paused since it is finished")
    }

    if (this.state.status === "ended") {
      throw new Error("Timer can't be paused since it has ended")
    }

    if (this.state.status === "paused") return

    this.state = {
      status: "paused",
      startedAt: this.state.startedAt,
      remainingMs: this.state.endsAt - Date.now()
    }
  }

  resume() {
    if (this.state.status === "pending") {
      throw new Error("Timer can't be resumed before it has started")
    }

    if (this.isFinished()) {
      throw new Error("Timer can't be resumed since it is finished")
    }

    if (this.state.status === "ended") {
      throw new Error("Timer can't be resumed since it has ended")
    }

    if (this.state.status === "running") {
      return
    }

    this.state = {
      status: "running",
      startedAt: this.state.startedAt,
      endsAt: Date.now() + this.state.remainingMs
    }
  }

  end() {
    if (this.state.status === "ended") {
      throw new Error("Timer can't be ended since it has already ended")
    }

    if (this.state.status === "pending") {
      this.state = {
        status: "ended",
        remainingMs: this.durationSec * 1000
      }

      return {
        startedAt: undefined,
        endedAt: undefined,
        remainingSec: this.durationSec,
        durationSec: this.durationSec
      }
    }

    // status: "running", "finished", or "paused"
    const now = Date.now()
    const remainingMs =
      this.state.status === "paused" ? this.state.remainingMs : Math.max(0, this.state.endsAt - now)
    const { startedAt } = this.state

    this.state = {
      status: "ended",
      startedAt,
      remainingMs
    }

    return {
      startedAt,
      endedAt: now,
      remainingSec: Math.ceil(remainingMs / 1000),
      durationSec: this.durationSec
    }
  }

  reset(durationSec: number) {
    Timer.validateDuration(durationSec)

    if (this.state.status !== "ended") {
      throw new Error("Timer can't be reset since it is not ended")
    }

    this.durationSec = durationSec
    this.state = { status: "pending" }
  }
}
