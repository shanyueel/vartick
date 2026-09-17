import { describe, test, expect } from "vitest"
import { boolean, positiveInteger } from "./form-validation"

describe("positiveInteger", () => {
  const field = positiveInteger("focusMin")

  test("accepts a positive integer", () => {
    expect(field.safeParse(25)).toMatchObject({ success: true, data: 25 })
  })

  test.for([-1, 0, 1.5, NaN, Infinity, "2", null, undefined])(
    "names the field when rejecting %s",
    (value) => {
      const result = field.safeParse(value)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("focusMin must be a positive integer")
    }
  )
})

describe("boolean", () => {
  const field = boolean("soundEnabled")

  test("accepts a boolean", () => {
    expect(field.safeParse(false)).toMatchObject({ success: true, data: false })
  })

  test.for(["true", 1, null, undefined])("names the field when rejecting %s", (value) => {
    const result = field.safeParse(value)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("soundEnabled must be a boolean")
  })
})

// describe("validatePositiveInteger", () => {
//   test("returns no error for positive whole-number input", () => {
//     expect(validatePositiveInteger("25")).toBeUndefined()
//   })

//   test("requires a value", () => {
//     expect(validatePositiveInteger(" ")).toBe("Required")
//   })

//   test("rejects non-positive and fractional input", () => {
//     expect(validatePositiveInteger("-1")).toBe("Must be a positive whole number")
//     expect(validatePositiveInteger("0")).toBe("Must be a positive whole number")
//     expect(validatePositiveInteger("1.5")).toBe("Must be a positive whole number")
//   })

//   test("rejects input that is not a number", () => {
//     expect(validatePositiveInteger("abc")).toBe("Must be a positive whole number")
//   })
// })
