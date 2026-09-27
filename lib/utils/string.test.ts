import { describe, expect, test } from "vitest"
import { capitalizeFirstLetter, formatCamelCase } from "./string"

describe("capitalizeFirstLetter", () => {
  test("returns empty string if the input is empty", () => {
    expect(capitalizeFirstLetter("")).toEqual("")
  })

  test("capitalizes the first letter of a string", () => {
    expect(capitalizeFirstLetter("hello")).toEqual("Hello")
    expect(capitalizeFirstLetter("test string")).toEqual("Test string")
    expect(capitalizeFirstLetter("123 string")).toEqual("123 string")
  })

  test("returns the same string if the first letter is already capitalized", () => {
    expect(capitalizeFirstLetter("Hello")).toEqual("Hello")
    expect(capitalizeFirstLetter("Test string")).toEqual("Test string")
    expect(capitalizeFirstLetter("123 string")).toEqual("123 string")
  })
})

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
