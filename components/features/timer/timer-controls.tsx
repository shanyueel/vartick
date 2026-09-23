"use client"

import { useState } from "react"
import { saveActiveTimer } from "@/lib/db/active-timer"
import { Timer } from "@/lib/timer"
import type { TimerStatus } from "@/lib/timer/type"
import { cn } from "@/lib/utils/style"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

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

  const abandonModalContent = isFocusSession
    ? {
        title: "End this focus session",
        message: "Are you sure you want to end this focus session early?",
        requestBtnText: "End Focus",
        confirmBtnText: "End Focus Early"
      }
    : {
        title: "End this break",
        message: "Are you sure you want to end this break early?",
        requestBtnText: "End Break",
        confirmBtnText: "End Break Early"
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

      <Button
        size="sm"
        variant="ghost"
        className={cn(
          (isCycleNotStarted || status === "finished" || status === "ended") &&
            "invisible md:hidden"
        )}
        onClick={handleEndRequest}
      >
        {abandonModalContent.requestBtnText}
      </Button>

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
              {resumeOnCancel ? "Resume Timer" : "Stay Paused"}
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
