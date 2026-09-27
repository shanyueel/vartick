"use client"

import { useState } from "react"
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notification"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

const ASKED_KEY = "vartick:notifications-asked"

const hasAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) !== null
  } catch {
    // if the read fails, assume we've asked and don't prompt again.
    return true
  }
}

const markAsked = () => {
  try {
    localStorage.setItem(ASKED_KEY, "asked")
  } catch {
    // if the write fails, the user will be prompted again next time.
  }
}

export const NotificationPermissionPrompt = () => {
  const [open, setOpen] = useState(() => getNotificationPermission() === "default" && !hasAsked())

  const handleDismiss = () => {
    markAsked()
    setOpen(false)
  }

  const handleAllow = async () => {
    await requestNotificationPermission()
    handleDismiss()
  }

  return (
    <Dialog open={open} onOpenChange={handleDismiss} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Get notified when sessions end?</DialogTitle>
        </DialogHeader>
        <p>
          Allow notifications to let VarTick alert you when sessions end. Manage this anytime in
          Settings.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={handleDismiss}>
            Not now
          </Button>
          <Button size="lg" variant="secondary" onClick={handleAllow}>
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
