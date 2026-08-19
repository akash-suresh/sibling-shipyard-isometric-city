import { describe, expect, it } from "vitest"
import { sampleRoute } from "./sampleRoute"

const route = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 8 },
]

describe("sampleRoute", () => {
  it("returns the exact endpoints", () => {
    expect(sampleRoute(route, 0)).toEqual({ x: 0, y: 0 })
    expect(sampleRoute(route, 1)).toEqual({ x: 4, y: 8 })
  })

  it("interpolates within each segment using equal segment time", () => {
    expect(sampleRoute(route, 0.25)).toEqual({ x: 2, y: 0 })
    expect(sampleRoute(route, 0.5)).toEqual({ x: 4, y: 0 })
    expect(sampleRoute(route, 0.75)).toEqual({ x: 4, y: 4 })
  })

  it("clamps progress so actors cannot leave their route", () => {
    expect(sampleRoute(route, -0.5)).toEqual({ x: 0, y: 0 })
    expect(sampleRoute(route, 1.5)).toEqual({ x: 4, y: 8 })
  })

  it("uses the route start for non-finite progress", () => {
    expect(sampleRoute(route, Number.NaN)).toEqual({ x: 0, y: 0 })
    expect(sampleRoute(route, Number.POSITIVE_INFINITY)).toEqual({ x: 0, y: 0 })
  })

  it("rejects routes that cannot form a segment", () => {
    expect(() => sampleRoute([], 0)).toThrow("at least two points")
    expect(() => sampleRoute([{ x: 0, y: 0 }], 0)).toThrow("at least two points")
  })
})
