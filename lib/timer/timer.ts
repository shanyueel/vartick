type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }

export class Timer {
  private state: TimerState = { status: "pending" }
  private durationSec: number
  private isStopped: boolean = false

  constructor(durationSec: number) {
    if (durationSec <= 0 || !Number.isInteger(durationSec)) {
      throw new Error("Invalid timer duration, must be a positive integer")
    }

    this.durationSec = durationSec
  }

  getCurrent() {
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

    // status: "running"
    const now = Date.now()
    if (this.state.endsAt > now) {
      return {
        status: "running",
        remainingSec: Math.ceil((this.state.endsAt - now) / 1000)
      }
    }

    // status: "expired"
    return {
      status: "expired",
      remainingSec: 0
    }
  }

  start() {
    if (this.state.status !== "pending") {
      throw new Error("Timer can't be started since it has already started")
    }

    const startedAt = Date.now()
    this.state = { status: "running", startedAt, endsAt: startedAt + this.durationSec * 1000 }
  }

  pause() {
    if (this.state.status === "pending") {
      throw new Error("Timer can't be paused if it is not started")
    }

    if (this.state.status === "paused") return

    const now = Date.now()
    if (this.state.endsAt <= now) {
      throw new Error("Timer can't be paused if it has expired")
    }

    this.state = {
      status: "paused",
      startedAt: this.state.startedAt,
      remainingMs: this.state.endsAt - now
    }
  }

  resume() {
    if (this.state.status === "pending") {
      throw new Error("Timer can't be resumed before the timer has started")
    }

    if (this.state.status === "running") {
      if (this.state.endsAt <= Date.now()) {
        throw new Error("Timer can't be resumed if it has expired")
      }
      return
    }

    const now = Date.now()
    this.state = {
      status: "running",
      startedAt: this.state.startedAt,
      endsAt: now + this.state.remainingMs
    }
  }

  stop() {
    if (this.isStopped) {
      throw new Error("Timer has already been stopped")
    }

    this.isStopped = true

    if (this.state.status === "pending") {
      return {
        startedAt: undefined,
        endedAt: undefined,
        remainingSec: this.durationSec,
        durationSec: this.durationSec
      }
    }

    const now = Date.now()
    const remainingSec =
      this.state.status === "paused"
        ? Math.ceil(this.state.remainingMs / 1000)
        : Math.max(0, Math.ceil((this.state.endsAt - now) / 1000))

    return {
      startedAt: this.state.startedAt,
      endedAt: now,
      remainingSec,
      durationSec: this.durationSec
    }
  }
}
