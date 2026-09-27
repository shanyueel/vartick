import { describe, expect, test } from "vitest"
import { buildSessions, getSessionsDuration } from "./session"

describe("buildSessions Tests", () => {
  test.for([
    { name: "negative", duration: -1 },
    { name: "zero", duration: 0 },
    { name: "non-integer", duration: 1.5 }
  ])("throws error if the cyclesBeforeLongBreak is invalid ($name)", ({ duration }) => {
    expect(() => buildSessions(duration)).toThrow(
      "Invalid cyclesBeforeLongBreak, must be a positive integer"
    )
  })

  test.for([
    { name: "1", duration: 1, expected: ["focus", "longBreak"] },
    {
      name: "4",
      duration: 4,
      expected: [
        "focus",
        "shortBreak",
        "focus",
        "shortBreak",
        "focus",
        "shortBreak",
        "focus",
        "longBreak"
      ]
    }
  ])("returns correct sessions for $name cyclesBeforeLongBreak", ({ duration, expected }) => {
    expect(buildSessions(duration)).toEqual(expected)
  })
})

describe("getSessionsDuration Tests", () => {
  test.for([
    ["negative focus", -1, 5, 15],
    ["negative shortBreak", 25, -1, 15],
    ["negative longBreak", 25, 5, -1],
    ["zero focus", 0, 5, 15],
    ["zero shortBreak", 25, 0, 15],
    ["zero longBreak", 25, 5, 0],
    ["non-integer focus", 25.5, 5, 15],
    ["non-integer shortBreak", 25, 5.5, 15],
    ["non-integer longBreak", 25, 5, 15.5]
  ] as [string, number, number, number][])(
    "throws error if any duration is %s ",
    ([, focus, shortBreak, longBreak]) => {
      expect(() => getSessionsDuration(focus, shortBreak, longBreak)).toThrow(
        "Invalid duration, all durations must be a positive integer"
      )
    }
  )

  test.for([
    [25, 5, 15],
    [50, 10, 20],
    [15, 5, 10]
  ])("returns correct durations for valid inputs", ([focus, shortBreak, longBreak]) => {
    const MINUTE_MS = 60 * 1000

    const result = getSessionsDuration(focus, shortBreak, longBreak)
    expect(result).toEqual({
      focus: focus * MINUTE_MS,
      shortBreak: shortBreak * MINUTE_MS,
      longBreak: longBreak * MINUTE_MS
    })
  })
})
