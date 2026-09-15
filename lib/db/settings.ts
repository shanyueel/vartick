import { db } from "@/lib/db"
import type { Settings } from "@/lib/db/type"
import { isPositiveInteger } from "@/lib/utils/validation"

type SaveResult = { success: true } | { success: false; error: string }

export const loadSettings = async () => {
  try {
    return await db.settings.get("singleton")
  } catch (error) {
    console.error("Failed to load settings", error)
    return undefined
  }
}

export const saveSettings = async (settings: Omit<Settings, "id">): Promise<SaveResult> => {
  try {
    const {
      focusMin,
      shortBreakMin,
      longBreakMin,
      cyclesBeforeLongBreak,
      soundEnabled,
      notificationsEnabled
    } = settings

    const numberFields = { focusMin, shortBreakMin, longBreakMin, cyclesBeforeLongBreak }
    for (const [field, value] of Object.entries(numberFields)) {
      if (!isPositiveInteger(value)) {
        return { success: false, error: `${field} must be a positive integer` }
      }
    }

    const booleanFields = { soundEnabled, notificationsEnabled }
    for (const [field, value] of Object.entries(booleanFields)) {
      if (typeof value !== "boolean") {
        return { success: false, error: `${field} must be a boolean` }
      }
    }

    await db.settings.put({
      id: "singleton",
      focusMin,
      shortBreakMin,
      longBreakMin,
      cyclesBeforeLongBreak,
      soundEnabled,
      notificationsEnabled
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to save settings:", error)
    return { success: false, error: (error as Error).message }
  }
}
