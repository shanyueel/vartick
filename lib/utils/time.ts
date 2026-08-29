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
