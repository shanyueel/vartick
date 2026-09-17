"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSettingsSchema, loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/db/settings"
import { SettingRow } from "@/components/features/settings/setting-row"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

type DurationId = "focusMin" | "shortBreakMin" | "longBreakMin" | "cyclesBeforeLongBreak"
type AlertId = "soundEnabled" | "notificationsEnabled"
type SettingsId = DurationId | AlertId

type FormValues = Record<DurationId, string> & Record<AlertId, boolean>

const MinutesLabel = () => {
  return (
    <>
      <span className="hidden sm:block sm:text-sm sm:text-muted-foreground">minutes</span>
      <span className="text-sm text-muted-foreground sm:hidden">min.</span>
    </>
  )
}

const SessionLabel = () => {
  return (
    <>
      <span className="hidden sm:block sm:text-sm sm:text-muted-foreground">sessions</span>
      <span className="text-sm text-muted-foreground sm:hidden">sess.</span>
    </>
  )
}

const settingsSchema = getSettingsSchema()

const durations: {
  id: DurationId
  label: string
  unit: React.ReactNode
}[] = [
  { id: "focusMin", label: "Focus", unit: <MinutesLabel /> },
  { id: "shortBreakMin", label: "Short break", unit: <MinutesLabel /> },
  { id: "longBreakMin", label: "Long break", unit: <MinutesLabel /> },
  { id: "cyclesBeforeLongBreak", label: "Long break after", unit: <SessionLabel /> }
]

export default function SettingsPage() {
  const [form, setForm] = useState<FormValues>()
  const [savedForm, setSavedForm] = useState<FormValues>()

  useEffect(() => {
    const loadStoredSettings = async () => {
      const stored = await loadSettings()

      const settings = stored ?? DEFAULT_SETTINGS

      const values = {
        focusMin: String(settings.focusMin),
        shortBreakMin: String(settings.shortBreakMin),
        longBreakMin: String(settings.longBreakMin),
        cyclesBeforeLongBreak: String(settings.cyclesBeforeLongBreak),
        soundEnabled: settings.soundEnabled,
        notificationsEnabled: settings.notificationsEnabled
      }

      setForm(values)
      setSavedForm(values)
    }

    loadStoredSettings()
  }, [])

  if (!form || !savedForm) return null

  const handleValueChange = (field: DurationId, value: string) => {
    const digitsOnly = value.replace(/\D/g, "")
    const noLeadingZeros = digitsOnly.replace(/^0+/, "")

    setForm({ ...form, [field]: noLeadingZeros })
  }

  const handleValueUpdate = async (field: SettingsId, value: string | boolean) => {
    if (typeof value === "string" && !value) {
      setForm({ ...form, [field]: savedForm[field] })
      return
    }

    const newForm = { ...form, ...{ [field]: value } }

    if (newForm[field] === savedForm[field]) return

    const result = settingsSchema.safeParse({
      focusMin: Number(newForm.focusMin),
      shortBreakMin: Number(newForm.shortBreakMin),
      longBreakMin: Number(newForm.longBreakMin),
      cyclesBeforeLongBreak: Number(newForm.cyclesBeforeLongBreak),
      soundEnabled: newForm.soundEnabled,
      notificationsEnabled: newForm.notificationsEnabled
    })

    if (!result.success) {
      // todo: handle validation errors (result.error.issues) with a toast or something
      return
    }

    // todo: handle success/failure feedback to user with a toast or something
    await saveSettings(result.data)

    setForm(newForm)
    setSavedForm(newForm)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <Link href="/" className="md:hidden">
          <X />
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <FieldGroup>
          <FieldSet className="gap-4">
            <FieldLegend variant="label" className="mb-4 uppercase text-muted-foreground">
              Durations
            </FieldLegend>
            {durations.map((duration) => (
              <SettingRow key={duration.id} id={duration.id} label={duration.label}>
                <div className="flex items-center gap-2">
                  <Input
                    id={duration.id}
                    type="number"
                    value={form[duration.id]}
                    min={1}
                    step={1}
                    inputMode="numeric"
                    onChange={(event) => handleValueChange(duration.id, event.target.value)}
                    onBlur={(event) => handleValueUpdate(duration.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        event.currentTarget.blur()
                      }
                    }}
                    className="w-14 text-center"
                  />
                  {duration.unit}
                </div>
              </SettingRow>
            ))}
          </FieldSet>
          <FieldSet className="gap-4">
            <FieldLegend variant="label" className="mb-4 uppercase text-muted-foreground">
              Alerts
            </FieldLegend>
            <SettingRow id="soundEnabled" label="Sound on session end">
              <Switch
                id="soundEnabled"
                checked={form.soundEnabled}
                onCheckedChange={(checked) => handleValueUpdate("soundEnabled", checked)}
              />
            </SettingRow>
            <SettingRow id="notificationsEnabled" label="Browser notification" subtitle="granted">
              <Switch
                id="notificationsEnabled"
                checked={form.notificationsEnabled}
                onCheckedChange={(checked) => handleValueUpdate("notificationsEnabled", checked)}
              />
            </SettingRow>
          </FieldSet>
        </FieldGroup>
        <div className="w-full flex justify-between text-sm text-muted-foreground">
          <span>All data stays on this device</span>
          <span>v0.1</span>
        </div>
      </div>
    </div>
  )
}
