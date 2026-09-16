"use client"

import { SettingRow } from "@/components/features/settings/setting-row"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

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

export default function SettingsPage() {
  const durations = [
    { id: "focus", label: "Focus", defaultValue: 25 },
    { id: "short-break", label: "Short break", defaultValue: 5 },
    { id: "long-break", label: "Long break", defaultValue: 15 },
    { id: "long-break-after", label: "Long break after", defaultValue: 4 }
  ]

  return (
    <div>
      <h1 className="text-xl font-bold">Settings</h1>
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
                    defaultValue={duration.defaultValue}
                    min={1}
                    step={1}
                    inputMode="numeric"
                    className="w-12 text-center"
                  />
                  {duration.id === "long-break-after" ? <SessionLabel /> : <MinutesLabel />}
                </div>
              </SettingRow>
            ))}
          </FieldSet>
          <FieldSet className="gap-4">
            <FieldLegend variant="label" className="mb-4 uppercase text-muted-foreground">
              Alerts
            </FieldLegend>
            <SettingRow id="sound-on-session-end" label="Sound on session end">
              <Switch id="sound-on-session-end" />
            </SettingRow>
            <SettingRow id="browser-notification" label="Browser notification" subtitle="granted">
              <Switch id="browser-notification" />
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
