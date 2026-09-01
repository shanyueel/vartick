import { describe, expect, test } from "vitest"
import { formatCamelCase } from "./string"

describe("formatCamelCase", () => {
  test("splits camel case strings into words", () => {
    expect(formatCamelCase("camelCaseString")).toEqual("camel case string")
    expect(formatCamelCase("anotherExample")).toEqual("another example")
    expect(formatCamelCase("yetAnotherTest")).toEqual("yet another test")
  })

  test("returns the all lowercase string if no format is specified", () => {
    expect(formatCamelCase("camelCaseString")).toEqual("camel case string")
  })

  test("capitalizes the first letter of each word if requested", () => {
    expect(formatCamelCase("camelCaseString", "title")).toEqual("Camel Case String")
  })

  test("capitalizes all the Letters of each word if requested", () => {
    expect(formatCamelCase("camelCaseString", "upper")).toEqual("CAMEL CASE STRING")
  })
})
