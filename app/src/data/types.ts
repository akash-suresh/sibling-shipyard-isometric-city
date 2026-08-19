export const projectStages = ["idea", "experiment", "prototype", "shipped", "growing", "landmark"] as const
export const projectStatuses = ["building", "shipping", "live", "growing", "paused", "archived", "incident"] as const
export const buildingArchetypes = ["workshop", "studio", "tower"] as const
export const buildingModuleKinds = ["lab-floor", "beta-floor", "office-floor", "tower-floor", "sky-wing"] as const
export const roofFeatureKinds = ["crane", "beacon", "antenna"] as const

export type ProjectStage = (typeof projectStages)[number]
export type ProjectStatus = (typeof projectStatuses)[number]
export type BuildingArchetype = (typeof buildingArchetypes)[number]
export type BuildingModuleKind = (typeof buildingModuleKinds)[number]
export type RoofFeatureKind = (typeof roofFeatureKinds)[number]

export const buildingPartCompatibility: Record<BuildingArchetype, { modules: readonly BuildingModuleKind[]; roofs: readonly RoofFeatureKind[] }> = {
  workshop: { modules: ["lab-floor", "beta-floor"], roofs: ["crane"] },
  studio: { modules: ["office-floor"], roofs: ["beacon"] },
  tower: { modules: ["tower-floor", "sky-wing"], roofs: ["antenna"] },
}

export interface ProjectDefinition {
  id: string
  name: string
  summary: string
  stage: ProjectStage
  status: ProjectStatus
  grid: { x: number; y: number }
  building: {
    archetype: BuildingArchetype
    modules: BuildingModuleKind[]
    roof?: RoofFeatureKind
    accent: string
  }
  latestMilestone?: string
  nextMilestone?: string
}

export interface MilestoneDefinition {
  id: string
  projectId: string
  title: string
  date: string
  event: "construction-upgrade"
  resultingModules: BuildingModuleKind[]
}
