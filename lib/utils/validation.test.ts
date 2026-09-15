import { describe, test, expect } from "vitest"
import { isPositiveInteger } from "./validation"

describe("isPositiveInteger", () => {
  test("returns true for positive integers", () => {
    expect(isPositiveInteger(1)).toBe(true)
    expect(isPositiveInteger(100)).toBe(true)
  })

  test("returns false for non-positive integers", () => {
    expect(isPositiveInteger(-1)).toBe(false)
    expect(isPositiveInteger(0)).toBe(false)
  })

  test("returns false for non-integers", () => {
    expect(isPositiveInteger(1.5)).toBe(false)
    expect(isPositiveInteger("1")).toBe(false)
  })
})
