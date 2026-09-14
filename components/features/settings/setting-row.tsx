import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export const SettingRow = ({
  id,
  label,
  subtitle,
  children
}: {
  id?: string
  label: string
  subtitle?: string
  children: React.ReactNode
}) => {
  return (
    <Card>
      <CardContent className="flex justify-between items-center">
        <div>
          <Label className="text-base" htmlFor={id ? id : undefined}>
            {label}
          </Label>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
