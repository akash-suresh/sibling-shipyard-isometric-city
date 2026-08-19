import { Container, Graphics } from "pixi.js"
import { hexColor, visualTokens as tokens } from "../../design/visualTokens"
import type { ProjectDefinition } from "../../data/types"
import { createContactShadow, createIsoPrism } from "../rendering/isometricPrimitives"
import { createProjectStatusEffect } from "./createProjectStatusEffect"
import { createProjectStageTreatment } from "./createProjectStageTreatment"
import { createProjectInteractionChrome } from "./projectInteraction"
import { createBuildingModule, createRoofFeature } from "./buildingParts"

export interface TownBuildingController {
  container: Container
  playUpgrade: (reducedMotion: boolean, onComplete: () => void) => () => void
  updateMotion: (elapsedMs: number, reducedMotion: boolean) => void
  setSelected: (selected: boolean) => void
}

const p = tokens.palette

function addWindows(target: Container, y: number, accent: number, count = 3) {
  const windows = new Graphics()
  for (let index = 0; index < count; index += 1) {
    const offset = (index - (count - 1) / 2) * 17
    windows.poly([offset - 6, y - 6, offset, y - 3, offset, y + 7, offset - 6, y + 4]).fill(0x36556c)
    windows.poly([offset + 6, y - 6, offset, y - 3, offset, y + 7, offset + 6, y + 4]).fill(0x263f56)
  }
  const band = new Graphics().poly([-34, y + 12, 0, y + 29, 34, y + 12, 34, y + 16, 0, y + 33, -34, y + 16]).fill(accent)
  band.alpha = 0.8
  target.addChild(windows, band)
}

export function createTownBuilding(project: ProjectDefinition, onSelect: (id: string) => void): TownBuildingController {
  const building = new Container()
  building.label = project.id
  const accent = hexColor(project.building.accent)
  const interaction = createProjectInteractionChrome(project.name, project.building.archetype === "tower" ? 150 : 126, project.building.archetype === "tower" ? 74 : 62, 48)
  interaction.ground.position.y = 8
  building.addChild(interaction.ground)
  let updateMotion = (_elapsedMs: number, _reducedMotion: boolean) => undefined

  if (project.building.archetype === "studio") {
    const shadow = createContactShadow(92, 50)
    const modules = project.building.modules.map((kind, index) => createBuildingModule(kind, accent, index))
    const roof = createIsoPrism(72, 40, 13, { top: 0xfff7de, left: 0xe9dfbd, right: 0xd1c49a })
    roof.position.y = -42
    const awning = new Graphics().poly([-20, -18, 0, -8, 18, -17, 0, -27]).fill(accent)
    const beacon = project.building.roof ? createRoofFeature(project.building.roof, accent) : new Container()
    beacon.position.set(0, -75)
    const halo = beacon.getChildByLabel("ambient-beacon-halo")
    const bulb = beacon.getChildByLabel("ambient-beacon-bulb")
    building.addChildAt(shadow, 1)
    building.addChild(...modules, roof, awning, beacon)
    building.label = project.id
    updateMotion = (elapsedMs, reducedMotion) => {
      const pulse = reducedMotion ? 0.5 : (Math.sin(elapsedMs / 280) + 1) / 2
      if (halo) { halo.alpha = 0.08 + pulse * 0.18; halo.scale.set(reducedMotion ? 1 : 0.9 + pulse * 0.18) }
      if (bulb) bulb.alpha = 0.72 + pulse * 0.28
    }
  } else {
    // The tower is the tallest mass in the town, so its shadow throws further along the same light axis.
    const shadow = createContactShadow(112, 60, { offset: { x: 18, y: 9 } })
    const base = createIsoPrism(112, 60, 48, { top: p.structure, left: p.structureMid, right: p.structureShadow, stroke: 0xaaa79f })
    let towerFloorIndex = 0
    const modules = project.building.modules.map((kind) => {
      const occurrence = kind === "tower-floor" ? towerFloorIndex++ : 0
      const module = createBuildingModule(kind, accent, occurrence)
      if (kind === "tower-floor") module.position.y = occurrence === 0 ? -47 : -94
      if (kind === "sky-wing") module.position.set(58, -13)
      return module
    })
    // Each sky-wing cantilevers clear of the tower core, so it needs its own ground contact.
    const wingShadows = project.building.modules
      .filter((kind) => kind === "sky-wing")
      .map(() => {
        const wingShadow = createContactShadow(55, 30)
        wingShadow.position.x = 58
        return wingShadow
      })
    const antenna = project.building.roof ? createRoofFeature(project.building.roof, accent) : new Container()
    antenna.position.y = -124
    const packet = antenna.getChildByLabel("ambient-packet")
    const verticalAccent = new Graphics().poly([24, -117, 34, -112, 34, -61, 24, -66]).fill(accent)
    building.addChild(shadow, ...wingShadows, base, ...modules, antenna, verticalAccent)
    addWindows(building, -28, accent, 3)
    addWindows(building, -75, accent, 2)
    updateMotion = (elapsedMs, reducedMotion) => {
      const progress = reducedMotion ? 0.55 : (elapsedMs % 1800) / 1800
      if (packet) { packet.y = -14 - progress * 34; packet.alpha = reducedMotion ? 0.78 : Math.sin(progress * Math.PI) }
      antenna.alpha = reducedMotion ? 1 : 0.82 + Math.sin(elapsedMs / 310) * 0.18
    }
  }

  const statusEffect = createProjectStatusEffect(project.status)
  statusEffect.position.set(project.building.archetype === "tower" ? 78 : 60, 22)
  const stageTreatment = createProjectStageTreatment(project.stage, accent)
  stageTreatment.position.set(project.building.archetype === "tower" ? -76 : -62, 24)
  stageTreatment.scale.set(0.62)
  building.addChild(statusEffect, stageTreatment)

  building.addChild(interaction.label)
  building.hitArea = { contains: (x, y) => x >= -80 && x <= 95 && y >= (project.building.archetype === "tower" ? -180 : -95) && y <= 50 }
  interaction.bind(building, project.id, onSelect)
  return { container: building, playUpgrade: () => () => undefined, updateMotion, setSelected: interaction.setSelected }
}
