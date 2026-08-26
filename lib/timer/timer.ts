export class Timer {
  private status: "pending" | "running" | "paused" | "expired" = "pending"
  private startedAt: number | undefined = undefined
  private endsAt: number | undefined = undefined
  private remainingSec: number | undefined
  private durationSec: number

  constructor(durationSec: number) {
    this.durationSec = durationSec
    this.remainingSec = durationSec
  }

  getCurrent(): { status: string; remainingSec: number } {}

  start(): void {}

  pause(): void {}

  resume(): void {}

  stop(): {
    startedAt: number
    endedAt: number
    remainingSec: number
    durationSec: number
  } {}
}
