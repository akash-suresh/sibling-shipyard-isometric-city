import { describe, expect, it } from "vitest"
import { validateProjects } from "./loadProjects"
import { buildingArchetypes, projectStages, projectStatuses } from "./types"

const validProject = {
  id: "test",
  name: "Test",
  summary: "A test project",
  stage: "idea",
  status: "building",
  grid: { x: 1, y: 2 },
  building: { archetype: "workshop", accent: "#ffffff" },
}

describe("validateProjects", () => {
  it("accepts valid project content", () => {
    expect(validateProjects([validProject])).toHaveLength(1)
  })

  it.each(projectStages)("accepts the %s lifecycle stage", (stage) => {
    expect(validateProjects([{ ...validProject, stage }])[0].stage).toBe(stage)
  })

  it.each(projectStatuses)("accepts the %s operational status", (status) => {
    expect(validateProjects([{ ...validProject, status }])[0].status).toBe(status)
  })

  it.each(buildingArchetypes)("accepts the %s building archetype", (archetype) => {
    expect(validateProjects([{ ...validProject, building: { ...validProject.building, archetype } }])[0].building.archetype).toBe(archetype)
  })

  it("rejects unknown building archetypes", () => {
    expect(() => validateProjects([{ ...validProject, building: { ...validProject.building, archetype: "castle" } }])).toThrow("Project test has an unknown building archetype")
  })

  it("rejects malformed building accents", () => {
    expect(() => validateProjects([{ ...validProject, building: { ...validProject.building, accent: "purple" } }])).toThrow("Project test has an invalid building accent")
  })

  it("rejects lifecycle stages outside the canonical vocabulary", () => {
    expect(() => validateProjects([{ ...validProject, stage: "launching" }])).toThrow("Project test has an invalid stage")
  })

  it("rejects operational statuses outside the canonical vocabulary", () => {
    expect(() => validateProjects([{ ...validProject, status: "unknown" }])).toThrow("Project test has an invalid status")
  })

  it("rejects duplicate ids", () => {
    expect(() => validateProjects([validProject, { ...validProject, grid: { x: 2, y: 2 } }])).toThrow("Duplicate project id")
  })

  it("rejects occupied grid positions", () => {
    expect(() => validateProjects([validProject, { ...validProject, id: "other" }])).toThrow("Occupied grid position")
  })
})
