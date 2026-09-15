export const isPositiveInteger = (value: unknown): boolean => {
  return Number.isInteger(value) && (value as number) > 0
}
