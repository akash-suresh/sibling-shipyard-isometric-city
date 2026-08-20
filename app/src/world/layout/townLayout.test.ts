import { describe, expect, it } from "vitest"
import { projects } from "../../data/loadProjects"
import { cellsAlongSegment, shipyardZeroLayout, validateProjectPlacements, validateTownLayout, type TownLayout } from "./townLayout"
import { createTownEnvironment } from "../rendering/createTownEnvironment"

const clone = (): TownLayout => structuredClone(shipyardZeroLayout)

describe("town layout contract", () => {
  it("validates the production layout and project plots", () => {
    expect(validateTownLayout(clone()).id).toBe("shipyard-zero")
    expect(validateProjectPlacements(shipyardZeroLayout, projects)).toHaveLength(3)
    expect(shipyardZeroLayout.roads).toHaveLength(14)
    expect(shipyardZeroLayout.water).toHaveLength(8)
    expect(shipyardZeroLayout.decor).toHaveLength(22)
    expect(shipyardZeroLayout.paths.length).toBeGreaterThan(0)
  })

  it("expands only orthogonal route segments", () => {
    expect(cellsAlongSegment({ x: 1, y: 4 }, { x: 4, y: 4 })).toEqual([{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }])
    expect(() => cellsAlongSegment({ x: 1, y: 1 }, { x: 2, y: 2 })).toThrow("must be orthogonal")
  })

  it("rejects overlapping, out-of-bounds, and unknown layout records", () => {
    const overlap = clone(); overlap.water.push({ ...overlap.roads[0] })
    expect(() => validateTownLayout(overlap)).toThrow("overlapping surfaces")
    const outside = clone(); outside.decor[0].grid = { x: 99, y: 0 }
    expect(() => validateTownLayout(outside)).toThrow("outside the map")
    const unknown = clone(); unknown.decor[0].kind = "statue" as never
    expect(() => validateTownLayout(unknown)).toThrow("Unknown town decor")
  })

  it("holds sidewalk paths to the same bounds and overlap rules as roads and water", () => {
    const outside = clone(); outside.paths.push({ x: 0, y: 42 })
    expect(() => validateTownLayout(outside)).toThrow("outside the map")
    const onRoad = clone(); onRoad.paths.push({ ...onRoad.roads[0] })
    expect(() => validateTownLayout(onRoad)).toThrow("overlapping surfaces")
    const onPlaza = clone(); onPlaza.paths.push({ ...onPlaza.plazas[0] })
    expect(() => validateTownLayout(onPlaza)).toThrow("overlapping surfaces")
    const onWater = clone(); onWater.paths.push({ ...onWater.water[0] })
    expect(() => validateTownLayout(onWater)).toThrow("overlapping surfaces")
  })

  it("rejects invalid bridges and actor routes", () => {
    const bridge = clone(); bridge.bridges[0].grid = { x: 2, y: 4 }
    expect(() => validateTownLayout(bridge)).toThrow("must cross water")
    const vehicle = clone(); vehicle.routes.find(({ actor }) => actor === "service-vehicle")!.waypoints = [{ x: 1, y: 4 }, { x: 1, y: 3 }]
    expect(() => validateTownLayout(vehicle)).toThrow("must stay on roads")
    const walker = clone(); walker.routes.find(({ actor }) => actor === "person")!.waypoints = [{ x: 3, y: 3 }, { x: 4, y: 3 }]
    expect(() => validateTownLayout(walker)).toThrow("cannot cross water")
  })

  it("rejects project plots on infrastructure", () => {
    const project = { ...projects[0], grid: { ...shipyardZeroLayout.roads[0] } }
    expect(() => validateProjectPlacements(shipyardZeroLayout, [project])).toThrow("non-buildable terrain")
  })

  it("renders decor deterministically when manifest records are reordered", () => {
    const reversed = clone(); reversed.decor.reverse()
    const sequence = (layout: TownLayout) => createTownEnvironment(layout).getChildByLabel("layout-decor")!.children.map((child) => `${child.label}:${child.x},${child.y},${child.zIndex}`)
    expect(sequence(reversed)).toEqual(sequence(shipyardZeroLayout))
  })
})
