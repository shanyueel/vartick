export const formatDuration = (seconds: number): string => {
  if (!Number.isInteger(seconds)) {
    throw new Error("duration must be an integer")
  }

  if (seconds < 0) {
    throw new Error("duration cannot be negative")
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  const formattedMinutes = String(minutes).padStart(2, "0")
  const formattedSeconds = String(remainingSeconds).padStart(2, "0")

  return `${formattedMinutes}:${formattedSeconds}`
}

export const convertMsToSec = (ms: number): number => {
  if (!Number.isInteger(ms)) {
    throw new Error("remainingMs must be an integer")
  }

  if (ms < 0) {
    throw new Error("remainingMs cannot be negative")
  }

  return Math.ceil(ms / 1000)
}

export const isTimestamp = (value: unknown) => {
  return Number.isInteger(value)
}

export const isRemainder = (value: unknown, durationMs: number) => {
  const isInteger = Number.isInteger(value)
  const isNonNegative = (value as number) >= 0
  const isWithinDuration = (value as number) <= durationMs

  return isInteger && isNonNegative && isWithinDuration
}
