import rawProjects from "./projects.json"
import { buildingArchetypes, buildingModuleKinds, buildingPartCompatibility, projectStages, projectStatuses, roofFeatureKinds, type ProjectDefinition } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export function validateProjects(value: unknown): ProjectDefinition[] {
  if (!Array.isArray(value)) throw new Error("Projects must be an array")

  const ids = new Set<string>()
  const positions = new Set<string>()

  return value.map((entry, index) => {
    if (!isRecord(entry)) throw new Error(`Project ${index} must be an object`)
    if (typeof entry.id !== "string" || !entry.id) throw new Error(`Project ${index} has no id`)
    if (ids.has(entry.id)) throw new Error(`Duplicate project id: ${entry.id}`)
    ids.add(entry.id)

    if (typeof entry.name !== "string" || typeof entry.summary !== "string") {
      throw new Error(`Project ${entry.id} needs a name and summary`)
    }
    if (!projectStages.includes(entry.stage as ProjectDefinition["stage"])) {
      throw new Error(`Project ${entry.id} has an invalid stage`)
    }
    if (!projectStatuses.includes(entry.status as ProjectDefinition["status"])) {
      throw new Error(`Project ${entry.id} has an invalid status`)
    }
    if (!isRecord(entry.grid) || typeof entry.grid.x !== "number" || typeof entry.grid.y !== "number") {
      throw new Error(`Project ${entry.id} has an invalid grid position`)
    }
    const position = `${entry.grid.x},${entry.grid.y}`
    if (positions.has(position)) throw new Error(`Occupied grid position: ${position}`)
    positions.add(position)

    if (!isRecord(entry.building) || typeof entry.building.archetype !== "string" || !Array.isArray(entry.building.modules) || typeof entry.building.accent !== "string") {
      throw new Error(`Project ${entry.id} has an invalid building`)
    }
    if (!buildingArchetypes.includes(entry.building.archetype as ProjectDefinition["building"]["archetype"])) {
      throw new Error(`Project ${entry.id} has an unknown building archetype`)
    }
    if (!entry.building.modules.every((module) => buildingModuleKinds.includes(module as ProjectDefinition["building"]["modules"][number])) || (entry.building.roof !== undefined && !roofFeatureKinds.includes(entry.building.roof as NonNullable<ProjectDefinition["building"]["roof"]>))) {
      throw new Error(`Project ${entry.id} has invalid building modules`)
    }
    const compatibility = buildingPartCompatibility[entry.building.archetype as ProjectDefinition["building"]["archetype"]]
    if (!entry.building.modules.every((module) => compatibility.modules.includes(module as ProjectDefinition["building"]["modules"][number])) || (entry.building.roof !== undefined && !compatibility.roofs.includes(entry.building.roof as NonNullable<ProjectDefinition["building"]["roof"]>))) {
      throw new Error(`Project ${entry.id} has building parts incompatible with ${entry.building.archetype}`)
    }
    if (!/^#[0-9a-f]{6}$/i.test(entry.building.accent)) {
      throw new Error(`Project ${entry.id} has an invalid building accent`)
    }

    return entry as unknown as ProjectDefinition
  })
}

export const projects = validateProjects(rawProjects)
