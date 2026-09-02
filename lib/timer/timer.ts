import { isRemainder, isTimestamp } from "@/lib/utils/time"

export type TimerStatus = "pending" | "running" | "paused" | "finished" | "ended"

type TimerCurrent = {
  status: TimerStatus
  remainingMs: number
}

export type TimerState =
  | { status: "pending" }
  | { status: "running"; startedAt: number; endsAt: number }
  | { status: "paused"; startedAt: number; remainingMs: number }
  | { status: "ended"; startedAt?: number; remainingMs: number }

const ALLOWED_KEYS: Record<TimerState["status"], readonly string[]> = {
  pending: ["status"],
  running: ["status", "startedAt", "endsAt"],
  paused: ["status", "startedAt", "remainingMs"],
  ended: ["status", "startedAt", "remainingMs"]
}

export class Timer {
  private state: TimerState = { status: "pending" }
  private durationMs: number

  private static validateDuration(durationMs: number) {
    if (durationMs <= 0 || !Number.isInteger(durationMs)) {
      throw new Error("Invalid timer duration, must be a positive integer")
    }
  }

  private static validateSnapshot(snapshot: TimerState, durationMs: number) {
    const { status } = snapshot

    // check if the status is valid
    const allowed = ALLOWED_KEYS[status]
    if (!allowed) {
      throw new Error(`Invalid timer snapshot, unknown status: ${status}`)
    }

    // check if the snapshot has any unexpected keys
    const unexpected = Object.keys(snapshot).filter((key) => !allowed.includes(key))
    if (unexpected.length > 0) {
      throw new Error(
        `Invalid '${status}' timer snapshot, unexpected keys: ${unexpected.join(", ")}`
      )
    }

    if (status === "pending") return

    // checked by field: the three rules below are the same wherever a field appears,
    // and a missing key arrives as undefined, failing them just as a malformed value.
    const { startedAt, endsAt, remainingMs } = snapshot as {
      startedAt?: unknown
      endsAt?: unknown
      remainingMs?: unknown
    }

    // startedAt: only "ended" can lack a startedAt: a timer ended before it started.
    const startedAtIsOptional = status === "ended" && startedAt === undefined
    if (!startedAtIsOptional && !isTimestamp(startedAt)) {
      throw new Error(`Invalid '${status}' timer snapshot, startedAt must be an integer`)
    }

    // endsAt: only "running" has an endsAt, and it must be after startedAt.
    if (status === "running") {
      if (!isTimestamp(endsAt) || (endsAt as number) <= (startedAt as number)) {
        throw new Error(
          "Invalid 'running' timer snapshot, endsAt must be an integer after startedAt"
        )
      }

      return
    }

    // remainingMs: "paused" and "ended" have a remainingMs, which must be between 0 and the duration.
    if (!isRemainder(remainingMs, durationMs)) {
      throw new Error(
        `Invalid '${status}' timer snapshot, remainingMs must be between 0 and the duration`
      )
    }
  }

  private constructor(durationMs: number, initialState?: TimerState) {
    Timer.validateDuration(durationMs)

    if (initialState) {
      Timer.validateSnapshot(initialState, durationMs)
      this.state = initialState
    }

    this.durationMs = durationMs
  }

  static create(durationMs: number) {
    return new Timer(durationMs)
  }

  static fromSnapshot(durationMs: number, snapshot: TimerState) {
    // clean the snapshot of any undefined values, which are not allowed in the TimerState type
    const cleaned = Object.fromEntries(
      Object.entries(snapshot).filter(([, value]) => value !== undefined)
    ) as TimerState

    return new Timer(durationMs, { ...cleaned })
  }

  private isFinished() {
    return this.state.status === "running" && Date.now() >= this.state.endsAt
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

  snapshot(): TimerState {
    return { ...this.state }
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
