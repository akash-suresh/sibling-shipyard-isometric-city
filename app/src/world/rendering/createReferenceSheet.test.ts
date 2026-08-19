import { Container } from "pixi.js"
import { describe, expect, it } from "vitest"
import { buildingModuleKinds, projectStages, projectStatuses, roofFeatureKinds } from "../../data/types"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createBuildingModule, createRoofFeature } from "../entities/buildingParts"
import { createProjectStageTreatment } from "../entities/createProjectStageTreatment"
import { createProjectStatusEffect } from "../entities/createProjectStatusEffect"
import {
  createTownBench,
  createTownBridge,
  createTownCurb,
  createTownEdge,
  createTownFlowerPatch,
  createTownLamp,
  createTownPerson,
  createTownServiceVehicle,
  createTownShrub,
  createTownSign,
  createTownTile,
  createTownTree,
} from "../entities/townComponents"
import { catalogSections, createReferenceSheet } from "./createReferenceSheet"
import { createTownEnvironment } from "./createTownEnvironment"
import { createLayoutDebugOverlay } from "../layout/createLayoutDebugOverlay"
import { shipyardZeroLayout, validateTownLayout, type TownLayout } from "../layout/townLayout"
import { gridToScreen } from "../projection/isometric"
import { projects } from "../../data/loadProjects"

type FactorySpec = {
  name: string
  create: () => Container
}

const productionFactories: FactorySpec[] = [
  { name: "terrain/grass", create: () => createTownTile("grass") },
  { name: "terrain/grass-accent", create: () => createTownTile("grass-accent") },
  { name: "terrain/road", create: () => createTownTile("road") },
  { name: "terrain/plaza", create: () => createTownTile("plaza") },
  { name: "terrain/path", create: () => createTownTile("path") },
  { name: "terrain/water", create: () => createTownTile("water") },
  { name: "terrain/bank-north", create: () => createTownEdge("north") },
  { name: "terrain/bank-east", create: () => createTownEdge("east") },
  { name: "terrain/curb-road", create: () => createTownCurb({ edges: ["north", "east", "south", "west"] }) },
  { name: "terrain/curb-plaza", create: () => createTownCurb({ edges: ["north", "west"], surface: "plaza" }) },
  { name: "terrain/curb-path", create: () => createTownCurb({ edges: ["south"], surface: "path" }) },
  { name: "terrain/bridge-x", create: () => createTownBridge("x") },
  { name: "terrain/bridge-y", create: () => createTownBridge("y") },
  { name: "prop/tree", create: createTownTree },
  { name: "prop/lamp", create: createTownLamp },
  { name: "prop/person", create: createTownPerson },
  { name: "prop/service-vehicle", create: createTownServiceVehicle },
  { name: "prop/shrub", create: createTownShrub },
  { name: "prop/bench", create: createTownBench },
  { name: "prop/project-sign", create: createTownSign },
  { name: "prop/flower-patch", create: createTownFlowerPatch },
  ...projectStages.map((stage) => ({
    name: `stage/${stage}`,
    create: () => createProjectStageTreatment(stage),
  })),
  ...projectStatuses.map((status) => ({
    name: `status/${status}`,
    create: () => createProjectStatusEffect(status),
  })),
  ...buildingModuleKinds.map((module) => ({ name: `module/${module}`, create: () => createBuildingModule(module, 0x6c7bd9) })),
  ...roofFeatureKinds.map((roof) => ({ name: `roof/${roof}`, create: () => createRoofFeature(roof, 0x6c7bd9) })),
  { name: "layout/environment", create: () => createTownEnvironment(shipyardZeroLayout) },
  { name: "layout/debug", create: () => createLayoutDebugOverlay(shipyardZeroLayout, projects) },
]

function boundsTuple(node: Container) {
  const bounds = node.getLocalBounds()
  return [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]
}

function descendantLabels(root: Container) {
  const labels: string[] = []
  const visit = (node: Container) => {
    if (node.label) labels.push(node.label)
    node.children.forEach((child) => {
      if (child instanceof Container) visit(child)
    })
  }
  visit(root)
  return labels
}

describe("Visual system production contract", () => {
  it.each(productionFactories)("$name returns deterministic finite Pixi bounds", ({ create }) => {
    const first = create()
    const second = create()
    const firstBounds = boundsTuple(first)
    const secondBounds = boundsTuple(second)

    expect(first).toBeInstanceOf(Container)
    expect(firstBounds.every(Number.isFinite)).toBe(true)
    expect(firstBounds[2]).toBeGreaterThan(firstBounds[0])
    expect(firstBounds[3]).toBeGreaterThan(firstBounds[1])
    expect(secondBounds).toEqual(firstBounds)

    first.destroy({ children: true })
    second.destroy({ children: true })
  })

  it("composes the catalog from labelled production props, buildings, and statuses", () => {
    const catalogs = catalogSections.map((section) => createReferenceSheet(section))
    const labels = catalogs.flatMap((catalog) => descendantLabels(catalog.container))

    expect(labels).toEqual(expect.arrayContaining([
      "tree",
      "lamp",
      "person",
      "service-vehicle",
      "shrub",
      "bench",
      "project-sign",
      "bridge-x",
      "curb-road",
      "flower-patch",
      "orion",
      "spark",
      "nexus",
      ...projectStages.map((stage) => `stage-${stage}`),
      ...projectStatuses.map((status) => `status-${status}`),
      ...buildingModuleKinds.map((module) => `module-${module}`),
      ...roofFeatureKinds.map((roof) => `roof-${roof}`),
      "town-layout-shipyard-zero",
      "layout-debug-grid",
      "layout-prop-anchors",
      "layout-project-footprints",
      "layout-route",
    ]))

    catalogs.forEach((catalog) => catalog.container.destroy({ children: true }))
  })

  it.each(catalogSections)("renders %s in wide and compact layouts", (section) => {
    const wide = createReferenceSheet(section, "wide")
    const compact = createReferenceSheet(section, "compact")
    expect(wide.container.children.length).toBeGreaterThan(0)
    expect(compact.container.children.length).toBeGreaterThan(0)
    expect(wide.artboard).toEqual({ width: 800, height: 620 })
    expect(compact.artboard).toEqual({ width: 350, height: 720 })
    wide.container.destroy({ children: true })
    compact.container.destroy({ children: true })
  })
})

const curbProbeLayout: TownLayout = {
  id: "curb-probe",
  width: 5,
  height: 5,
  roads: [1, 2, 3].flatMap((x) => [1, 2, 3].map((y) => ({ x, y }))),
  plazas: [],
  water: [],
  bridges: [],
  decor: [],
  routes: [],
}

describe("Town curbs", () => {
  it("kerbs paved cells only where the surface class changes", () => {
    validateTownLayout(curbProbeLayout)
    const terrain = createTownEnvironment(curbProbeLayout).getChildByLabel("layout-terrain")!
    const curbs = terrain.children.filter((child) => child.label === "curb-road").map((child) => `${child.x},${child.y}`)
    const cell = (x: number, y: number) => { const screen = gridToScreen({ x, y }); return `${screen.x},${screen.y}` }

    expect(curbs).toHaveLength(8)
    expect(curbs).toContain(cell(1, 1))
    expect(curbs).not.toContain(cell(2, 2))
  })

  it("kerbs both paved surfaces of the production town", () => {
    const environment = createTownEnvironment(shipyardZeroLayout)

    expect(descendantLabels(environment)).toEqual(expect.arrayContaining(["curb-road", "curb-plaza"]))

    environment.destroy({ children: true })
  })

  it("gives a road and plaza boundary one curb, owned by the raised surface", () => {
    const terrain = createTownEnvironment(shipyardZeroLayout).getChildByLabel("layout-terrain")!
    const at = (x: number, y: number) => {
      const screen = gridToScreen({ x, y })
      return terrain.children.filter((child) => child.label?.startsWith("curb-") && child.x === screen.x && child.y === screen.y).map((child) => child.label)
    }

    // (7,5) plaza carries the lip down to the (7,4) asphalt, which stays flush on that edge.
    expect(at(7, 5)).toEqual(["curb-plaza"])
    // (7,4) road touches road on three sides and that plaza on the fourth, so it owns no boundary.
    expect(at(7, 4)).toEqual([])
    // A road cell that genuinely borders open ground still gets its own retaining lip.
    expect(at(1, 4)).toEqual(["curb-road"])
  })

  it("leaves water boundaries to the bank treatment instead of kerbing them", () => {
    const terrain = createTownEnvironment(shipyardZeroLayout).getChildByLabel("layout-terrain")!
    const bridge = gridToScreen({ x: 4, y: 4 })
    const curbs = terrain.children.filter((child) => child.label?.startsWith("curb-") && child.x === bridge.x && child.y === bridge.y)

    expect(curbs).toHaveLength(0)
  })

  it("raises the curb by the projection token rather than a literal height", () => {
    const standard = createTownCurb({ edges: ["north"] })
    const doubled = createTownCurb({ edges: ["north"], height: tokens.projection.curbHeight * 2 })

    expect(standard.getLocalBounds().minY).toBeCloseTo(-tokens.projection.tileHeight / 2 - 0.25 - tokens.projection.curbHeight)
    expect(doubled.getLocalBounds().minY).toBeCloseTo(standard.getLocalBounds().minY - tokens.projection.curbHeight)

    standard.destroy({ children: true })
    doubled.destroy({ children: true })
  })
})
