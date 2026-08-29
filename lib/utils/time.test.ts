import { describe, expect, test } from "vitest"
import { formatDuration } from "./time"

describe("formatDuration", () => {
  test("throws error if the input is invalid", () => {
    expect(() => formatDuration(1.5)).toThrow("duration must be an integer")
    expect(() => formatDuration(-1)).toThrow("duration cannot be negative")
  })

  test("formats seconds into MM:SS format", () => {
    expect(formatDuration(0)).toBe("00:00")
    expect(formatDuration(5)).toBe("00:05")
    expect(formatDuration(60)).toBe("01:00")
    expect(formatDuration(65)).toBe("01:05")
    expect(formatDuration(3599)).toBe("59:59")
    expect(formatDuration(3600)).toBe("60:00")
    expect(formatDuration(7200)).toBe("120:00")
    expect(formatDuration(36000)).toBe("600:00")
  })
})
