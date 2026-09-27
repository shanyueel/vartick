import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import "fake-indexeddb/auto"
import { db } from "@/lib/db"
import { loadSettings, saveSettings } from "./settings"
import type { Settings } from "@/lib/db/type"

const settings: Omit<Settings, "id"> = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: false,
  notificationsEnabled: false
}

const stored: Settings = { id: "singleton", ...settings }

describe("settings operations", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("loadSettings()", () => {
    test("returns undefined and logs when the read fails", async () => {
      vi.spyOn(db.settings, "get").mockRejectedValue(new Error("read failed"))
      const logError = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(loadSettings()).resolves.toBeUndefined()
      expect(logError).toHaveBeenCalled()
    })

    test("returns undefined when no settings are stored", async () => {
      expect(await loadSettings()).toBeUndefined()
    })

    test("returns the stored settings", async () => {
      await db.settings.put(stored)

      expect(await loadSettings()).toEqual(stored)
    })
  })

  describe("saveSettings()", () => {
    test("returns false and the error message when the write fails", async () => {
      vi.spyOn(db.settings, "put").mockRejectedValue(new Error("write failed"))
      const logError = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(await saveSettings(settings)).toEqual({
        success: false,
        error: "write failed"
      })
      expect(logError).toHaveBeenCalled()
    })

    const numberFields = ["focusMin", "shortBreakMin", "longBreakMin", "cyclesBeforeLongBreak"]
    const booleanFields = ["soundEnabled", "notificationsEnabled"]

    const invalidNumberCases = [
      { name: "negative", value: -1 },
      { name: "zero", value: 0 },
      { name: "float", value: 1.5 },
      { name: "nan", value: NaN },
      { name: "infinity", value: Infinity },
      { name: "string", value: "2" }
    ]

    const invalidBooleanCases = [
      { name: "string", value: "true" },
      { name: "number", value: 1 },
      { name: "null", value: null },
      { name: "undefined", value: undefined }
    ]

    test.for([
      ...numberFields.flatMap((field) => {
        return invalidNumberCases.map(({ name: caseName, value }) => ({
          field,
          caseName,
          value,
          expectedError: `${field} must be a positive integer`
        }))
      }),
      ...booleanFields.flatMap((field) => {
        return invalidBooleanCases.map(({ name: caseName, value }) => ({
          field,
          caseName,
          value,
          expectedError: `${field} must be a boolean`
        }))
      })
    ])(
      "returns false and the error message when the settings are invalid ($field: $caseName)",
      async ({ field, value, expectedError }) => {
        await saveSettings(settings)

        const invalidSettings = { ...settings, [field]: value }

        expect(await saveSettings(invalidSettings)).toEqual({
          success: false,
          error: expectedError
        })
        expect(await loadSettings()).toEqual(stored) // Ensure the original settings remain unchanged
      }
    )

    test("stores the setting under the singleton key", async () => {
      expect(await saveSettings(settings)).toEqual({ success: true })

      expect(await loadSettings()).toEqual(stored)
      expect(await db.settings.count()).toEqual(1)
    })

    test("replaces the previously stored settings", async () => {
      const newSettings: Omit<Settings, "id"> = { ...settings, focusMin: 30, soundEnabled: true }
      const newStored: Settings = { id: "singleton", ...newSettings }

      await saveSettings(settings)

      expect(await saveSettings(newSettings)).toEqual({ success: true })

      expect(await db.settings.get("singleton")).toEqual(newStored)
      expect(await db.settings.count()).toBe(1)
    })
  })
})
