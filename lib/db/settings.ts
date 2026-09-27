import { z } from "zod"
import { db } from "@/lib/db"
import type { Settings } from "@/lib/db/type"
import { boolean, positiveInteger } from "@/lib/utils/form-validation"

type SaveResult = { success: true } | { success: false; error: string }

export const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true
}

export const getSettingsSchema = (options?: { useFieldNames?: boolean }) => {
  const field = options?.useFieldNames ? (name: string) => name : () => undefined

  return z.object({
    focusMin: positiveInteger(field("focusMin")),
    shortBreakMin: positiveInteger(field("shortBreakMin")),
    longBreakMin: positiveInteger(field("longBreakMin")),
    cyclesBeforeLongBreak: positiveInteger(field("cyclesBeforeLongBreak")),
    soundEnabled: boolean(field("soundEnabled")),
    notificationsEnabled: boolean(field("notificationsEnabled"))
  })
}

export const loadSettings = async () => {
  try {
    return await db.settings.get("singleton")
  } catch (error) {
    console.error("Failed to load settings", error)
    return undefined
  }
}

export const saveSettings = async (settings: Omit<Settings, "id">): Promise<SaveResult> => {
  const settingsSchema = getSettingsSchema({ useFieldNames: true })
  const parsed = settingsSchema.safeParse(settings)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await db.settings.put({ id: "singleton", ...parsed.data })

    return { success: true }
  } catch (error) {
    console.error("Failed to save settings:", error)
    return { success: false, error: (error as Error).message }
  }
}
