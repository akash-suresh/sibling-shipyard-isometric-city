import { describe, expect, it } from "vitest"
import { depthKey, gridToScreen } from "./isometric"

describe("isometric projection", () => {
  it("maps the origin to the screen origin", () => {
    expect(gridToScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it("maps neighbouring axes in opposite horizontal directions", () => {
    expect(gridToScreen({ x: 1, y: 0 })).toEqual({ x: 48, y: 24 })
    expect(gridToScreen({ x: 0, y: 1 })).toEqual({ x: -48, y: 24 })
  })

  it("orders objects farther down the grid above earlier objects", () => {
    expect(depthKey({ x: 5, y: 5 })).toBeGreaterThan(depthKey({ x: 2, y: 2 }))
  })
})
