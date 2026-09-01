type Format = "lower" | "upper" | "title"

export const formatCamelCase = (str: string, format: Format = "lower") => {
  const result = str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()

  if (format === "upper") {
    return result.toUpperCase()
  }

  if (format === "title") {
    return result
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return result
}
