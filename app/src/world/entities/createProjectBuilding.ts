import type { Container } from "pixi.js"
import type { BuildingModuleKind, ProjectDefinition } from "../../data/types"
import { createOrionPlot } from "./createOrionPlot"
import { createTownBuilding } from "./createTownBuilding"

export interface ProjectBuildingController {
  container: Container
  playUpgrade: (resultingModules: BuildingModuleKind[], reducedMotion: boolean, onComplete: () => void) => () => void
  updateMotion: (elapsedMs: number, reducedMotion: boolean) => void
  setSelected: (selected: boolean) => void
  setMilestonePreview: (resultingModules: BuildingModuleKind[], progress: number, reducedMotion: boolean) => void
}

/** Selects a production renderer from data, never from a project name or id. */
export function createProjectBuilding(project: ProjectDefinition, onSelect: (id: string) => void): ProjectBuildingController {
  if (project.building.archetype === "workshop") {
    const controller = createOrionPlot(project, onSelect)
    return {
      ...controller,
      playUpgrade: controller.playUpgrade,
      setMilestonePreview: controller.setUpgradeProgress,
    }
  }
  const controller = createTownBuilding(project, onSelect)
  return { ...controller, playUpgrade: (_resultingModules, reducedMotion, onComplete) => controller.playUpgrade(reducedMotion, onComplete), setMilestonePreview: () => undefined }
}
