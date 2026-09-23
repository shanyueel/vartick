"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

export const NotificationPermissionPrompt = () => {
  const [modalOpen, setModalOpen] = useState(true)

  const handleDismiss = () => {
    setModalOpen(false)
  }

  const handleAllow = () => {
    setModalOpen(false)
  }

  return (
    <Dialog open={modalOpen} disablePointerDismissal>
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
