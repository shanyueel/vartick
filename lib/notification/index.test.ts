import { afterEach, describe, expect, test, vi } from "vitest"
import type { NotificationState } from "@/lib/notification/type"
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification
} from "@/lib/notification"

// The suite runs in node, which has no Notification API.
class MockNotification {
  static permission: NotificationPermission = "default"
  static shouldFailToConstruct = false
  static requestPermission = vi.fn(async () => MockNotification.permission)

  constructor(
    readonly title: string,
    readonly options?: NotificationOptions
  ) {
    if (MockNotification.shouldFailToConstruct) {
      throw new Error("Failed to create notification")
    }
  }
}

const supportNotifications = (permission: NotificationPermission) => {
  MockNotification.permission = permission
  MockNotification.shouldFailToConstruct = false
  MockNotification.requestPermission.mockClear()

  vi.stubGlobal("window", globalThis)
  vi.stubGlobal("Notification", MockNotification)

  return MockNotification
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("getNotificationPermission", () => {
  test("reports unsupported when the API is missing", () => {
    expect(getNotificationPermission()).toBe("unsupported")
  })

  test.for<NotificationPermission>(["default", "granted", "denied"])(
    "reports %s straight from the browser",
    (permission) => {
      supportNotifications(permission)

      expect(getNotificationPermission()).toBe(permission)
    }
  )
})

describe("requestNotificationPermission", () => {
  test("reports unsupported without asking", async () => {
    await expect(requestNotificationPermission()).resolves.toBe("unsupported")
  })

  test("asks while the answer is still default", async () => {
    const notification = supportNotifications("default")
    notification.requestPermission.mockResolvedValueOnce("granted")

    await expect(requestNotificationPermission()).resolves.toBe("granted")
    expect(notification.requestPermission).toHaveBeenCalledOnce()
  })

  test.for<NotificationPermission>(["granted", "denied"])(
    "does not ask again once the answer is %s",
    async (permission) => {
      const notification = supportNotifications(permission)

      await expect(requestNotificationPermission()).resolves.toBe(permission)
      expect(notification.requestPermission).not.toHaveBeenCalled()
    }
  )

  test("keeps the current answer when the request throws", async () => {
    const notification = supportNotifications("default")
    notification.requestPermission.mockRejectedValueOnce(new Error("nope"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(requestNotificationPermission()).resolves.toBe("default")
  })
})

describe("sendNotification", () => {
  test.for<NotificationState>(["unsupported", "default", "denied"])(
    "shows nothing while permission is %s",
    (permission) => {
      if (permission !== "unsupported") supportNotifications(permission)

      expect(sendNotification({ title: "Focus complete" })).toBeUndefined()
    }
  )

  test("shows a silent, self-replacing notification once granted", () => {
    supportNotifications("granted")

    const shown = sendNotification({ title: "Focus complete", body: "Time for a break" })

    expect(shown).toMatchObject({
      title: "Focus complete",
      options: { body: "Time for a break", silent: true, tag: "vartick-session" }
    })
  })

  test("logs errors when the notification fails to show", () => {
    supportNotifications("granted")

    MockNotification.shouldFailToConstruct = true
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(sendNotification({ title: "Focus complete" })).toBeUndefined()
    expect(consoleError).toHaveBeenCalledWith("Failed to send notification:", expect.any(Error))
  })
})
