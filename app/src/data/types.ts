export const projectStages = ["idea", "prototype", "shipped", "landmark"] as const
export const projectStatuses = ["building", "live", "incident", "archived"] as const
export const buildingArchetypes = ["workshop", "studio", "tower"] as const

export type ProjectStage = (typeof projectStages)[number]
export type ProjectStatus = (typeof projectStatuses)[number]
export type BuildingArchetype = (typeof buildingArchetypes)[number]

export interface ProjectDefinition {
  id: string
  name: string
  summary: string
  stage: ProjectStage
  status: ProjectStatus
  grid: { x: number; y: number }
  building: {
    archetype: BuildingArchetype
    accent: string
  }
  latestMilestone?: string
  nextMilestone?: string
  logo?: string
  overrides?: Record<string, { x: number, y: number, z: number }>
}

export interface MilestoneDefinition {
  id: string
  projectId: string
  title: string
  date: string
  event: "construction-upgrade"
  resultingStage: ProjectStage
}
