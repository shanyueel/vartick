// @vitest-environment happy-dom

import { describe, expect, test, vi, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useMediaQuery } from "./useMediaQuery"

describe("useMediaQuery Tests", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
  })

  test.for([
    {
      name: "mobile",
      width: 500,
      expected: { isSm: false, isMd: false, isLg: false, isXl: false, is2xl: false }
    },
    {
      name: "sm",
      width: 640,
      expected: { isSm: true, isMd: false, isLg: false, isXl: false, is2xl: false }
    },
    {
      name: "md",
      width: 768,
      expected: { isSm: true, isMd: true, isLg: false, isXl: false, is2xl: false }
    },
    {
      name: "lg",
      width: 1024,
      expected: { isSm: true, isMd: true, isLg: true, isXl: false, is2xl: false }
    },
    {
      name: "xl",
      width: 1280,
      expected: { isSm: true, isMd: true, isLg: true, isXl: true, is2xl: false }
    },
    {
      name: "2xl",
      width: 1536,
      expected: { isSm: true, isMd: true, isLg: true, isXl: true, is2xl: true }
    }
  ])("should return correct breakpoints at $name width", ({ width, expected }) => {
    vi.stubGlobal("innerWidth", width)

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current).toEqual(expected)
  })

  test("should update on window resize", () => {
    vi.stubGlobal("innerWidth", 500)

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current.isMd).toBe(false)

    // resize to md
    act(() => {
      vi.stubGlobal("innerWidth", 768)
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current.isMd).toBe(true)
  })

  test("should handle multiple resizes", () => {
    vi.stubGlobal("innerWidth", 500)

    const { result } = renderHook(() => useMediaQuery())

    // Resize to lg
    act(() => {
      vi.stubGlobal("innerWidth", 1024)
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current.isLg).toBe(true)

    // Resize to sm
    act(() => {
      vi.stubGlobal("innerWidth", 640)
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current.isLg).toBe(false)
    expect(result.current.isSm).toBe(true)
  })

  test("should clean up event listener on unmount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener")
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = renderHook(() => useMediaQuery())

    const handler = addEventListenerSpy.mock.calls.find(([event]) => event === "resize")?.[1]

    expect(handler).toBeDefined()

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", handler)

    unmount()

    // the same reference must be detached, or the listener leaks
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", handler)
  })
})
