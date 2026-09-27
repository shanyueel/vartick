import type { NotificationContent, NotificationState } from "@/lib/notification/type"

const isSupported = () => typeof window !== "undefined" && "Notification" in window

export const getNotificationPermission = (): NotificationState =>
  isSupported() ? Notification.permission : "unsupported"

export const requestNotificationPermission = async (): Promise<NotificationState> => {
  if (!isSupported()) return "unsupported"

  if (Notification.permission !== "default") return Notification.permission

  try {
    return await Notification.requestPermission()
  } catch (error) {
    console.error("Failed to request notification permission:", error)
    return Notification.permission
  }
}

export const sendNotification = ({ title, body }: NotificationContent) => {
  if (getNotificationPermission() !== "granted") return undefined

  try {
    // Silent: the chime is ours to play, and the system sound would double it.
    return new Notification(title, {
      body,
      icon: "/logo.png",
      tag: "vartick-session", // replaces the previous notification rather than stacking
      silent: true
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
    return undefined
  }
}
