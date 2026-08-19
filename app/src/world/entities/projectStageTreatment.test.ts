import { Container } from "pixi.js"
import { describe, expect, it } from "vitest"
import { projectStages, type ProjectDefinition, type ProjectStage } from "../../data/types"
import { createOrionPlot } from "./createOrionPlot"
import { createTownBuilding } from "./createTownBuilding"

function projectFor(stage: ProjectStage, id = "test"): ProjectDefinition {
  return {
    id,
    name: "Stage fixture",
    summary: "Exercises the shared lifecycle treatment.",
    stage,
    status: "live",
    grid: { x: 0, y: 0 },
    building: { archetype: "studio", modules: [], accent: "#6c7bd9" },
  }
}

function hasDescendantLabel(root: Container, expected: string): boolean {
  if (root.label === expected) return true
  return root.children.some((child) => child instanceof Container && hasDescendantLabel(child, expected))
}

describe("project stage treatment integration", () => {
  it.each(projectStages)("generic production buildings reuse the %s treatment", (stage) => {
    const building = createTownBuilding(projectFor(stage), () => undefined).container

    expect(hasDescendantLabel(building, `stage-${stage}`)).toBe(true)

    building.destroy({ children: true })
  })

  it.each(projectStages)("Orion production plots reuse the %s treatment", (stage) => {
    const plot = createOrionPlot(projectFor(stage, "orion"), () => undefined).container

    expect(hasDescendantLabel(plot, `stage-${stage}`)).toBe(true)

    plot.destroy({ children: true })
  })
})
