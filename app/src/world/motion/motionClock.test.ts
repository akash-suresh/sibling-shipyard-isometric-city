import { describe, expect, it } from "vitest"
import { advanceMotionTime } from "./motionClock"

describe("advanceMotionTime", () => {
  it("advances only in play mode", () => {
    expect(advanceMotionTime(100, 16, "play")).toBe(116)
    expect(advanceMotionTime(100, 16, "paused")).toBe(100)
    expect(advanceMotionTime(100, 16, "reduced")).toBe(100)
  })

  it("caps long frame jumps and rejects unsafe deltas", () => {
    expect(advanceMotionTime(100, 500, "play")).toBe(150)
    expect(advanceMotionTime(100, -20, "play")).toBe(100)
    expect(advanceMotionTime(100, Number.NaN, "play")).toBe(100)
  })
})
