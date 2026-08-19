import { describe, expect, it } from "vitest"
import { orionUpgradeGeometry, orionUpgradeY } from "./orionGeometry"

describe("Orion upgrade geometry", () => {
  it("starts below the final floor position and ends deterministically", () => {
    expect(orionUpgradeY(0)).toBe(orionUpgradeGeometry.startY)
    expect(orionUpgradeY(1)).toBe(orionUpgradeGeometry.finalY)
  })

  it("clamps progress outside the animation range", () => {
    expect(orionUpgradeY(-1)).toBe(orionUpgradeGeometry.startY)
    expect(orionUpgradeY(2)).toBe(orionUpgradeGeometry.finalY)
  })
})
