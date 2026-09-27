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
