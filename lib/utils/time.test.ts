import { describe, expect, test } from "vitest"
import { formatDuration, convertMsToSec, isTimestamp, isRemainder } from "./time"

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

describe("convertMsToSec", () => {
  test("throws error if the input is invalid", () => {
    expect(() => convertMsToSec(1.5)).toThrow("remainingMs must be an integer")
    expect(() => convertMsToSec(-1)).toThrow("remainingMs cannot be negative")
  })

  test("transfers remaining milliseconds to the closest ceiling seconds", () => {
    expect(convertMsToSec(0)).toBe(0)
    expect(convertMsToSec(500)).toBe(1)
    expect(convertMsToSec(1000)).toBe(1)
    expect(convertMsToSec(1500)).toBe(2)
    expect(convertMsToSec(2000)).toBe(2)
    expect(convertMsToSec(2500)).toBe(3)
    expect(convertMsToSec(3000)).toBe(3)
    expect(convertMsToSec(3500)).toBe(4)
  })
})

describe("isTimestamp", () => {
  test("returns true for integers", () => {
    expect(isTimestamp(0)).toBe(true)
    expect(isTimestamp(1)).toBe(true)
    expect(isTimestamp(-1)).toBe(true)
    expect(isTimestamp(100)).toBe(true)
  })
})

describe("isRemainder", () => {
  test("returns true for integers between 0 and the duration", () => {
    expect(isRemainder(0, 100)).toBe(true)
    expect(isRemainder(50, 100)).toBe(true)
    expect(isRemainder(100, 100)).toBe(true)
  })

  test("returns false for non-integers or values outside the range", () => {
    expect(isRemainder(-1, 100)).toBe(false)
    expect(isRemainder(101, 100)).toBe(false)
    expect(isRemainder(1.5, 100)).toBe(false)
    expect(isRemainder("50", 100)).toBe(false)
    expect(isRemainder(null, 100)).toBe(false)
    expect(isRemainder(undefined, 100)).toBe(false)
  })
})
