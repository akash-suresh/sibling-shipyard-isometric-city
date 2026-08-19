import { Container } from "pixi.js"
import { describe, expect, it } from "vitest"
import { buildingModuleKinds, projectStages, projectStatuses, roofFeatureKinds } from "../../data/types"
import { createBuildingModule, createRoofFeature } from "../entities/buildingParts"
import { createProjectStageTreatment } from "../entities/createProjectStageTreatment"
import { createProjectStatusEffect } from "../entities/createProjectStatusEffect"
import {
  createTownBench,
  createTownBridge,
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
import { shipyardZeroLayout } from "../layout/townLayout"
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
