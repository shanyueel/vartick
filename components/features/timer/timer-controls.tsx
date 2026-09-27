"use client"

import { useState } from "react"
import { saveActiveTimer } from "@/lib/db/active-timer"
import { Timer } from "@/lib/timer"
import type { TimerStatus } from "@/lib/timer/type"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { capitalizeFirstLetter } from "@/lib/utils/string"

interface TimerControlsProps {
  currentSessionIdx: number
  timer: Timer
  status: TimerStatus
  updateTimerView: () => Promise<void>
  endCurrentSession: () => Promise<void>
  nextSession: () => Promise<void>
  restartSession: () => Promise<void>
  isFocusSession: boolean
  isLastSession: boolean
  isCycleNotStarted: boolean
  isCycleEnded: boolean
}

export const TimerControls = ({
  currentSessionIdx,
  timer,
  status,
  updateTimerView,
  endCurrentSession,
  nextSession,
  restartSession,
  isFocusSession,
  isLastSession,
  isCycleNotStarted,
  isCycleEnded
}: TimerControlsProps) => {
  const handleStart = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "pending") {
      timer.start()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handlePause = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "running") {
      timer.pause()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handleResume = async () => {
    const latestStatus = timer.getCurrent().status

    if (latestStatus === "paused") {
      timer.resume()
    }

    await updateTimerView()
    await saveActiveTimer({
      sessionIdx: currentSessionIdx,
      timerState: timer.snapshot()
    })
  }

  const handleNext = async () => {
    if (isLastSession) {
      await endCurrentSession()
    } else {
      await nextSession()
    }

    await updateTimerView()
  }

  const handleReset = async () => {
    if (isCycleEnded) {
      await restartSession()
    }

    await updateTimerView()
  }

  /* Abandon Session Confirmation */
  const [abandonModalOpen, setAbandonModalOpen] = useState(false)
  const [resumeOnCancel, setResumeOnCancel] = useState(false)

  const canAbandonSession = !isCycleNotStarted && ["pending", "running", "paused"].includes(status)

  const action = status === "pending" ? "skip" : "end"
  const sessionName = isFocusSession ? "focus" : "break"

  const abandonModalContent = {
    title: `${capitalizeFirstLetter(action)} this ${sessionName} session`,
    message: `Are you sure you want to ${action} this ${sessionName}?`,
    requestBtnText: `${capitalizeFirstLetter(action)} ${capitalizeFirstLetter(sessionName)}`,
    confirmBtnText: `${capitalizeFirstLetter(action)} ${capitalizeFirstLetter(sessionName)}${action === "end" ? " Early" : ""}`,
    cancelBtnText: resumeOnCancel ? "Resume Timer" : "Keep It"
  }

  const handleEndRequest = async () => {
    setResumeOnCancel(status === "running")

    await handlePause()
    setAbandonModalOpen(true)
  }

  const handleCancelAbandon = async () => {
    setAbandonModalOpen(false)
    if (resumeOnCancel) {
      await handleResume()
    }
  }

  const handleConfirmAbandon = async () => {
    setAbandonModalOpen(false)
    await handleNext()
  }

  return (
    <div className="flex flex-col justify-center items-stretch gap-4 md:flex-row md:items-center md:gap-2">
      {status === "pending" && (
        <Button size="xl" variant="secondary" onClick={handleStart}>
          {isFocusSession ? "Start Focus" : "Start Break"}
        </Button>
      )}

      {status === "running" && (
        <Button size="xl" variant="secondary" onClick={handlePause}>
          Pause
        </Button>
      )}

      {status === "paused" && (
        <Button size="xl" variant="secondary" onClick={handleResume}>
          Resume
        </Button>
      )}

      {!isCycleEnded && (status === "finished" || status === "ended") && (
        <Button size="xl" variant="secondary" onClick={handleNext}>
          Next
        </Button>
      )}

      {isCycleEnded && (
        <Button size="xl" variant="secondary" onClick={handleReset}>
          Start a new Cycle
        </Button>
      )}

      {canAbandonSession && (
        <Button
          size="sm"
          variant="ghost"

          onClick={handleEndRequest}
        >
          {abandonModalContent.requestBtnText}
        </Button>
      )}

      {/* Abandon Session Confirmation Modal */}
      <Dialog
        open={abandonModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelAbandon()
        }}
        disablePointerDismissal
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{abandonModalContent.title}</DialogTitle>
          </DialogHeader>
          <p>{abandonModalContent.message}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelAbandon}>
              {abandonModalContent.cancelBtnText}
            </Button>
            <Button size="lg" variant="secondary" onClick={handleConfirmAbandon}>
              {abandonModalContent.confirmBtnText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
