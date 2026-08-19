import { describe, expect, it } from "vitest"
import { calculateReferenceSheetFit } from "./referenceSheetFit"

describe("calculateReferenceSheetFit", () => {
  it("caps the catalog at its authored size on a large viewport", () => {
    expect(calculateReferenceSheetFit(1600, 1200)).toEqual({ scale: 1, x: 400, y: 165 })
  })

  it("uses the limiting axis while preserving desktop spacing", () => {
    const fit = calculateReferenceSheetFit(1000, 800)

    expect(fit.x).toBeCloseTo((1000 - 800 * (611 / 620)) / 2)
    expect(fit.y).toBe(165)
    expect(fit.scale).toBeCloseTo(611 / 620)
  })

  it("switches to compact spacing below 600 pixels", () => {
    const fit = calculateReferenceSheetFit(390, 844, { width: 350, height: 720 })

    expect(fit.x).toBeCloseTo((390 - 350 * (650 / 720)) / 2)
    expect(fit.y).toBe(170)
    expect(fit.scale).toBeCloseTo(650 / 720)
  })

  it("keeps a minimum legible scale in an extremely small viewport", () => {
    expect(calculateReferenceSheetFit(120, 180, { width: 350, height: 720 })).toEqual({ scale: 0.1, x: 42.5, y: 170 })
  })

  it("uses desktop spacing at the compact breakpoint", () => {
    const fit = calculateReferenceSheetFit(600, 900)

    expect(fit.x).toBeGreaterThanOrEqual(44)
    expect(fit.y).toBe(165)
  })
})
