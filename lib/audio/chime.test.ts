import { describe, test, expect } from "vitest"
import { CHIME_PRESETS, getChimeDuration } from "@/lib/audio/chime"
import type { ChimeName } from "@/lib/audio/type"

/*
  The synthesis itself needs a real AudioContext, so these cover the presets:
  the part that is data, and the part most likely to be broken while tuning.
 */
const names = Object.keys(CHIME_PRESETS) as ChimeName[]

describe("chime presets", () => {
  test.for(names)("%s is audible for its whole length", (name) => {
    CHIME_PRESETS[name].forEach((strike) => {
      expect(strike.freq).toBeGreaterThan(0)
      expect(strike.at).toBeGreaterThanOrEqual(0)
      expect(strike.ring).toBeGreaterThan(0)
      expect(strike.gain ?? 1).toBeGreaterThan(0)
      expect(strike.gain ?? 1).toBeLessThanOrEqual(1)
    })
  })

  test.for(names)("%s strikes its notes in order", (name) => {
    const times = CHIME_PRESETS[name].map((strike) => strike.at)

    expect(times).toStrictEqual([...times].sort((a, b) => a - b))
  })

  test("session chimes run for three seconds", () => {
    expect(getChimeDuration("focusEnd")).toBeCloseTo(3)
    expect(getChimeDuration("breakEnd")).toBeCloseTo(3)
  })

  test("the cycle chime runs for seven seconds", () => {
    expect(getChimeDuration("cycleEnd")).toBeCloseTo(7)
  })
})
