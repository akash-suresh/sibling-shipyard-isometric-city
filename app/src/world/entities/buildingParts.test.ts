import { Container } from "pixi.js"
import { describe, expect, it } from "vitest"
import type { ProjectDefinition } from "../../data/types"
import { createTownBuilding } from "./createTownBuilding"

function labels(root: Container) {
  const found: string[] = []
  const visit = (node: Container) => { if (node.label) found.push(node.label); node.children.forEach((child) => { if (child instanceof Container) visit(child) }) }
  visit(root)
  return found
}

const tower = (modules: ProjectDefinition["building"]["modules"], roof?: ProjectDefinition["building"]["roof"]): ProjectDefinition => ({
  id: "data-tower", name: "Data tower", summary: "Fixture", stage: "growing", status: "growing", grid: { x: 0, y: 0 },
  building: { archetype: "tower", modules, roof, accent: "#6c7bd9" },
})

describe("data-driven building parts", () => {
  it("repeats ordered tower floors and includes the requested wing and roof", () => {
    const building = createTownBuilding(tower(["tower-floor", "tower-floor", "sky-wing"], "antenna"), () => undefined).container
    const parts = labels(building)
    expect(parts.filter((part) => part === "module-tower-floor")).toHaveLength(2)
    expect(parts).toContain("module-sky-wing")
    expect(parts).toContain("roof-antenna")
  })

  it("removing a module or roof removes that production geometry", () => {
    const building = createTownBuilding(tower(["tower-floor"], undefined), () => undefined).container
    const parts = labels(building)
    expect(parts.filter((part) => part === "module-tower-floor")).toHaveLength(1)
    expect(parts).not.toContain("module-sky-wing")
    expect(parts).not.toContain("roof-antenna")
  })
})
