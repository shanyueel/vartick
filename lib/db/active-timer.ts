import { db } from "@/lib/db"
import type { ActiveTimer } from "@/lib/db/type"
import type { InitialState } from "@/lib/timer/type"

// Separate query for useLiveQuery subscriptions.
export const queryActiveTimer = () => db.activeTimer.get("singleton")

export const loadActiveTimer = async (): Promise<ActiveTimer | undefined> => {
  try {
    return await queryActiveTimer()
  } catch (error) {
    console.error("Error loading active timer:", error)
    return undefined
  }
}

export const saveActiveTimer = async (activeTimer: InitialState) => {
  try {
    await db.activeTimer.put({ ...activeTimer, id: "singleton" })
  } catch (error) {
    console.error("Error saving active timer:", error)
  }
}

export const clearActiveTimer = async () => {
  try {
    await db.activeTimer.delete("singleton")
  } catch (error) {
    console.error("Error clearing active timer:", error)
  }
}
