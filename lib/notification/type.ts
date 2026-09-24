export type NotificationState = NotificationPermission | "unsupported"

export type NotificationContent = {
  title: string
  body?: string
}
