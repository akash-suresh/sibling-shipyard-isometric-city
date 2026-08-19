import { describe, expect, it } from "vitest"
import { validateProjects } from "./loadProjects"
import { buildingArchetypes, buildingModuleKinds, projectStages, projectStatuses, roofFeatureKinds } from "./types"

const validProject = {
  id: "test",
  name: "Test",
  summary: "A test project",
  stage: "idea",
  status: "building",
  grid: { x: 1, y: 2 },
  building: { archetype: "workshop", modules: [], accent: "#ffffff" },
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

  it("rejects malformed building modules and accents", () => {
    expect(() => validateProjects([{ ...validProject, building: { ...validProject.building, modules: [42] } }])).toThrow("Project test has invalid building modules")
    expect(() => validateProjects([{ ...validProject, building: { ...validProject.building, accent: "purple" } }])).toThrow("Project test has an invalid building accent")
  })

  it.each(buildingModuleKinds)("recognises the %s module key", (module) => {
    const buildingByModule = {
      "lab-floor": { archetype: "workshop", roof: "crane" }, "beta-floor": { archetype: "workshop", roof: "crane" },
      "office-floor": { archetype: "studio", roof: "beacon" }, "tower-floor": { archetype: "tower", roof: "antenna" }, "sky-wing": { archetype: "tower", roof: "antenna" },
    } as const
    const choice = buildingByModule[module]
    expect(validateProjects([{ ...validProject, building: { ...choice, modules: [module], accent: "#ffffff" } }])[0].building.modules).toEqual([module])
  })

  it.each(roofFeatureKinds)("recognises the %s roof key", (roof) => {
    const buildingByRoof = { crane: { archetype: "workshop", modules: ["lab-floor"] }, beacon: { archetype: "studio", modules: ["office-floor"] }, antenna: { archetype: "tower", modules: ["tower-floor"] } } as const
    const choice = buildingByRoof[roof]
    expect(validateProjects([{ ...validProject, building: { ...choice, roof, accent: "#ffffff" } }])[0].building.roof).toBe(roof)
  })

  it("rejects unknown and archetype-incompatible building parts", () => {
    expect(() => validateProjects([{ ...validProject, building: { ...validProject.building, modules: ["castle-floor"] } }])).toThrow("invalid building modules")
    expect(() => validateProjects([{ ...validProject, building: { archetype: "studio", modules: ["lab-floor"], roof: "beacon", accent: "#ffffff" } }])).toThrow("incompatible with studio")
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
