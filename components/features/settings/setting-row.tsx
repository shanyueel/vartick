import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldError
} from "@/components/ui/field"

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
      <CardContent>
        <Field orientation="horizontal" className="items-center!">
          <FieldContent>
            <FieldLabel className="text-base" htmlFor={id}>
              {label}
              {subtitle && (
                <FieldDescription className="text-xs text-muted-foreground">
                  {subtitle}
                </FieldDescription>
              )}
            </FieldLabel>
            <FieldError className="text-xs" />
          </FieldContent>
          {children}
        </Field>
      </CardContent>
    </Card>
  )
}
