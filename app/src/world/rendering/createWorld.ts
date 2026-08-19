import { Container } from "pixi.js"
import type { BuildingModuleKind, ProjectDefinition } from "../../data/types"
import { depthKey, gridToScreen } from "../projection/isometric"
import { createProjectBuilding } from "../entities/createProjectBuilding"
import { createAmbientLife } from "./createAmbientLife"
import { createTownEnvironment } from "./createTownEnvironment"
import { shipyardZeroLayout, validateProjectPlacements } from "../layout/townLayout"

export interface WorldController {
  container: Container
  getProjectPosition: (id: string) => { x: number; y: number } | undefined
  setSelectedProject: (id: string | null) => void
  playConstructionUpgrade: (id: string, resultingModules: BuildingModuleKind[], reducedMotion: boolean, onComplete: () => void) => () => void
  updateMotion: (elapsedMs: number, reducedMotion: boolean) => void
  destroy: () => void
}

interface BuildingController {
  container: Container
  playUpgrade: (resultingModules: BuildingModuleKind[], reducedMotion: boolean, onComplete: () => void) => () => void
  updateMotion?: (elapsedMs: number, reducedMotion: boolean) => void
  setSelected: (selected: boolean) => void
}

export function createWorld(projects: ProjectDefinition[], onSelect: (id: string) => void): WorldController {
  validateProjectPlacements(shipyardZeroLayout, projects)
  const world = new Container()
  world.sortableChildren = true
  const buildings = new Map<string, BuildingController>()
  world.addChild(createTownEnvironment(shipyardZeroLayout))

  projects.forEach((project) => {
    const building = createProjectBuilding(project, onSelect)
    const position = gridToScreen(project.grid)
    building.container.position.set(position.x, position.y)
    building.container.zIndex = depthKey(project.grid, 10)
    buildings.set(project.id, building)
    world.addChild(building.container)
  })

  const ambient = createAmbientLife(shipyardZeroLayout)
  world.addChild(...ambient.entities)

  return {
    container: world,
    getProjectPosition: (id) => {
      const target = buildings.get(id)?.container
      return target ? { x: target.x, y: target.y } : undefined
    },
    setSelectedProject: (id) => buildings.forEach((building, projectId) => building.setSelected(projectId === id)),
    playConstructionUpgrade: (id, resultingModules, reducedMotion, onComplete) =>
      buildings.get(id)?.playUpgrade(resultingModules, reducedMotion, onComplete) ?? (() => undefined),
    updateMotion: (elapsedMs, reducedMotion) => {
      ambient.updateMotion(elapsedMs, reducedMotion)
      buildings.forEach((building) => building.updateMotion?.(elapsedMs, reducedMotion))
    },
    destroy: () => undefined,
  }
}
