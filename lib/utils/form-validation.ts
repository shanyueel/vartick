import { z } from "zod"

export const positiveInteger = (field?: string) => {
  const errorMessage = field ? `${field} must be a positive integer` : "Must be a positive integer"

  return z
    .number({ error: errorMessage })
    .int({ error: errorMessage })
    .positive({ error: errorMessage })
}

export const boolean = (field?: string) => {
  const errorMessage = field ? `${field} must be a boolean` : "Must be a boolean"

  return z.boolean({ error: errorMessage })
}
