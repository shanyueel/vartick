export type TimerStatus = "pending" | "running" | "paused" | "finished" | "ended"

type TimerCurrent = {
  status: TimerStatus
  remainingMs: number
}

type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }
  | { status: "ended"; startedAt?: number; remainingMs: number }

export class Timer {
  private state: TimerState = { status: "pending" }
  private durationMs: number

  private static validateDuration(durationMs: number) {
    if (durationMs <= 0 || !Number.isInteger(durationMs)) {
      throw new Error("Invalid timer duration, must be a positive integer")
    }
  }

  private isFinished() {
    return this.state.status === "running" && Date.now() >= this.state.endsAt
  }

  constructor(durationMs: number) {
    Timer.validateDuration(durationMs)

    this.durationMs = durationMs
  }

  getDurationMs() {
    return this.durationMs
  }

  getCurrent(): TimerCurrent {
    if (this.state.status === "pending") {
      return {
        status: "pending",
        remainingMs: this.durationMs
      }
    }

    if (this.state.status === "paused") {
      return {
        status: "paused",
        remainingMs: this.state.remainingMs
      }
    }

    // status: "running" or "finished"
    if (this.state.status === "running") {
      const remainingMs = this.state.endsAt - Date.now()

      return remainingMs <= 0
        ? { status: "finished", remainingMs: 0 }
        : { status: "running", remainingMs }
    }

    // status: "ended"
    return {
      status: "ended",
      remainingMs: this.state.remainingMs
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
    this.state = { status: "running", startedAt, endsAt: startedAt + this.durationMs }
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
        remainingMs: this.durationMs
      }

      return {
        startedAt: undefined,
        endedAt: undefined,
        remainingMs: this.durationMs,
        durationMs: this.durationMs
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
      remainingMs,
      durationMs: this.durationMs
    }
  }

  reset(durationMs: number) {
    Timer.validateDuration(durationMs)

    if (this.state.status !== "ended") {
      throw new Error("Timer can't be reset since it is not ended")
    }

    this.durationMs = durationMs
    this.state = { status: "pending" }
  }
}
