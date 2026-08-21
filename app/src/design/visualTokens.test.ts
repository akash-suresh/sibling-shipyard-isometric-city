import { describe, expect, it } from "vitest"
import { hexColor, visualTokens } from "./visualTokens"

describe("visual tokens", () => {
  it("defines positive canonical scales", () => {
    expect(Object.values(visualTokens.scale).every((value) => value > 0)).toBe(true)
  })

  it("converts validated hex project accents", () => {
    expect(hexColor("#EF8354")).toBe(visualTokens.palette.orion)
    expect(() => hexColor("coral")).toThrow("Invalid color")
  })
})
