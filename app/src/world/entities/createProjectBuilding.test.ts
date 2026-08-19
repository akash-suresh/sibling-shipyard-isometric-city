import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuildingArchetype, ProjectDefinition } from "../../data/types"

const factories = vi.hoisted(() => ({
  createOrionPlot: vi.fn(),
  createTownBuilding: vi.fn(),
}))

vi.mock("./createOrionPlot", () => ({ createOrionPlot: factories.createOrionPlot }))
vi.mock("./createTownBuilding", () => ({ createTownBuilding: factories.createTownBuilding }))

import { createProjectBuilding } from "./createProjectBuilding"

const projectFor = (archetype: BuildingArchetype): ProjectDefinition => ({
  id: `project-${archetype}`,
  name: `Project ${archetype}`,
  summary: "Factory routing fixture",
  stage: "prototype",
  status: "building",
  grid: { x: 1, y: 1 },
  building: { archetype, modules: [], accent: "#ffffff" },
})

const controller = () => ({
  container: {} as never,
  playUpgrade: vi.fn(() => vi.fn()),
  updateMotion: vi.fn(),
  setSelected: vi.fn(),
})

describe("createProjectBuilding", () => {
  beforeEach(() => {
    factories.createOrionPlot.mockReset()
    factories.createTownBuilding.mockReset()
  })

  it("routes the workshop archetype to the construction renderer", () => {
    const construction = { ...controller(), setUpgradeProgress: vi.fn() }
    factories.createOrionPlot.mockReturnValue(construction)
    const project = projectFor("workshop")

    const result = createProjectBuilding(project, vi.fn())
    result.setMilestonePreview(["lab-floor", "beta-floor"], 0.65, true)

    expect(factories.createOrionPlot).toHaveBeenCalledWith(project, expect.any(Function))
    expect(factories.createTownBuilding).not.toHaveBeenCalled()
    expect(construction.setUpgradeProgress).toHaveBeenCalledWith(["lab-floor", "beta-floor"], 0.65, true)
  })

  it.each(["studio", "tower"] as const)("routes the %s archetype to the finished-building renderer", (archetype) => {
    const finished = controller()
    factories.createTownBuilding.mockReturnValue(finished)
    const project = projectFor(archetype)

    const result = createProjectBuilding(project, vi.fn())
    result.setMilestonePreview([], 0.65, false)

    expect(factories.createTownBuilding).toHaveBeenCalledWith(project, expect.any(Function))
    expect(factories.createOrionPlot).not.toHaveBeenCalled()
  })
})
