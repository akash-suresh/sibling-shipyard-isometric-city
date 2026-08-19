import { Container, Graphics } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"
import type { BuildingModuleKind, ProjectDefinition } from "../../data/types"
import { createCastShadow, createIsoDiamond, createIsoPrism } from "../rendering/isometricPrimitives"
import { orionUpgradeGeometry, orionUpgradeY } from "./orionGeometry"
import { createProjectStatusEffect } from "./createProjectStatusEffect"
import { createProjectStageTreatment } from "./createProjectStageTreatment"
import { hexColor } from "../../design/visualTokens"
import { createProjectInteractionChrome } from "./projectInteraction"
import { createBuildingModule, createRoofFeature } from "./buildingParts"

export interface OrionPlotController {
  container: Container
  playUpgrade: (resultingModules: BuildingModuleKind[], reducedMotion: boolean, onComplete: () => void) => () => void
  updateMotion: (elapsedMs: number, reducedMotion: boolean) => void
  setUpgradeProgress: (resultingModules: BuildingModuleKind[], progress: number, reducedMotion: boolean) => void
  setSelected: (selected: boolean) => void
}

const p = tokens.palette

function createCrate(x: number, y: number, scale = 1) {
  const crate = createIsoPrism(18 * scale, 10 * scale, 13 * scale, {
    top: 0xe7b66c,
    left: 0xc88b43,
    right: 0xa96e32,
    stroke: 0x8f632f,
  })
  crate.position.set(x, y)
  return crate
}

function createTree(x: number, y: number) {
  const tree = new Container()
  const trunk = new Graphics().rect(-3, -18, 6, 22).fill(0x8c6239)
  const crown = new Graphics()
    .poly([0, -54, 18, -24, 8, -25, 15, -8, 0, -17, -15, -8, -8, -25, -18, -24]).fill(0x6ca94c)
    .poly([0, -54, 0, -17, -15, -8, -8, -25, -18, -24]).fill(0x55923d)
  tree.addChild(trunk, crown)
  tree.position.set(x, y)
  return tree
}

function createWorker(x: number, y: number) {
  const worker = new Container()
  const shadow = new Graphics().ellipse(3, 2, 10, 4).fill({ color: p.castShadow, alpha: 0.18 })
  const body = new Graphics().circle(0, -16, 3).fill(0x9d6b4c).rect(-3, -13, 6, 10).fill(p.orion).rect(-4, -14, 8, 3).fill(p.crane)
  worker.addChild(shadow, body)
  worker.position.set(x, y)
  return worker
}

function createVehicle(x: number, y: number) {
  const vehicle = new Container()
  const shadow = new Graphics().ellipse(3, 4, 38, 10).fill({ color: p.castShadow, alpha: 0.16 })
  const body = createIsoPrism(44, 22, 16, { top: 0xf1a163, left: p.orion, right: 0xc86245 })
  body.position.y = -3
  const glass = new Graphics().poly([-8, -17, 4, -23, 13, -18, 1, -12]).fill(p.glass)
  vehicle.addChild(shadow, body, glass)
  vehicle.position.set(x, y)
  return vehicle
}

function createUpgradeFloor() {
  const floor = createBuildingModule("beta-floor", p.orion)
  floor.label = "upgrade-floor"
  const light = floor.getChildByLabel("upgrade-light")
  if (light) light.alpha = 0
  return floor
}

export function createOrionPlot(project: ProjectDefinition, onSelect: (id: string) => void): OrionPlotController {
  const plot = new Container()
  plot.label = project.id

  const interaction = createProjectInteractionChrome(project.name, 176, 88, 68)
  interaction.ground.position.y = 4

  const slabShadow = createCastShadow(170, 54, p.castShadow, tokens.shadow.castAlpha)
  slabShadow.position.set(16, 14)
  const plotSlab = createIsoPrism(174, 86, 9, { top: 0xc9d8b7, left: 0xa7b897, right: 0x8fa17f, stroke: 0x829373 })
  plotSlab.position.y = 2
  const workPad = createIsoDiamond(144, 68, 0xbec1bd, 0xa8aca8)
  workPad.position.y = -5

  const shadow = createCastShadow(124, 38, p.castShadow, 0.2)
  shadow.position.set(10, -2)
  const foundation = createIsoPrism(112, 60, 13, { top: 0xd2d0c9, left: 0xb8b5ae, right: 0x9d9b96, stroke: 0x8c8a86 })
  foundation.position.y = -8

  const structure = new Container()
  structure.label = "structure"
  const labFloor = createBuildingModule("lab-floor", hexColor(project.building.accent))
  labFloor.position.set(-6, -22)
  structure.addChild(labFloor)

  const skeleton = new Container()
  skeleton.label = "construction"
  const upperSlab = createIsoPrism(104, 55, 7, { top: 0xdad7d0, left: 0xbcb9b3, right: 0xa4a19c, stroke: 0x8c8a86 })
  upperSlab.position.y = -66
  skeleton.addChild(upperSlab)
  ;[-43, -14, 15, 44].forEach((x) => {
    const column = new Graphics().rect(x - 2, -84, 5, 58).fill(0x737473).rect(x - 1, -84, 2, 58).fill(0xa7a8a5)
    skeleton.addChild(column)
  })
  const scaffold = new Graphics()
    .moveTo(-56, -77).lineTo(-56, -20).moveTo(-47, -77).lineTo(-47, -20)
    .moveTo(-60, -70).lineTo(-43, -61).moveTo(-60, -52).lineTo(-43, -43).moveTo(-60, -34).lineTo(-43, -25)
    .stroke({ color: p.crane, width: 2 })
  skeleton.addChild(scaffold)

  const crane = createRoofFeature("crane", hexColor(project.building.accent))
  crane.label = "crane"
  const hook = crane.getChildByLabel("ambient-hook")!
  crane.position.set(64, -12)

  const props = new Container()
  props.label = "props"
  const workerA = createWorker(-42, 31)
  const workerB = createWorker(44, 22)
  const statusEffect = createProjectStatusEffect(project.status)
  statusEffect.position.set(86, 35)
  const stageTreatment = createProjectStageTreatment(project.stage, hexColor(project.building.accent))
  stageTreatment.position.set(102, 2)
  stageTreatment.scale.set(0.56)
  props.addChild(createCrate(-69, 12), createCrate(-53, 18, 0.8), workerA, workerB, createTree(-92, -4), createVehicle(-88, 39), statusEffect, stageTreatment)

  const upgrade = createUpgradeFloor()
  upgrade.visible = false
  upgrade.position.y = orionUpgradeGeometry.startY

  plot.addChild(interaction.ground, slabShadow, plotSlab, workPad, shadow, foundation, structure, skeleton, upgrade, crane, props, interaction.label)
  plot.hitArea = { contains: (x, y) => x >= -105 && x <= 142 && y >= -145 && y <= 58 }
  interaction.bind(plot, project.id, onSelect)

  const setUpgradeProgress = (resultingModules: BuildingModuleKind[], progress: number, reducedMotion: boolean) => {
    const addsBetaFloor = resultingModules.includes("beta-floor") && !project.building.modules.includes("beta-floor")
    if (!addsBetaFloor) { upgrade.visible = false; return }
    const safeProgress = Math.max(0, Math.min(1, progress))
    upgrade.visible = true
    upgrade.alpha = reducedMotion ? 1 : Math.min(1, safeProgress * 4)
    upgrade.y = reducedMotion ? orionUpgradeGeometry.finalY : orionUpgradeY(safeProgress)
    crane.skew.x = reducedMotion ? 0 : Math.sin(safeProgress * Math.PI) * 0.018
    const light = upgrade.getChildByLabel("upgrade-light")
    if (light) light.alpha = reducedMotion ? 1 : safeProgress > 0.76 ? (safeProgress - 0.76) / 0.24 : 0
  }

  let activeUpgrade: { startedAt: number | null; onComplete: () => void; resultingModules: BuildingModuleKind[] } | null = null

  const playUpgrade = (resultingModules: BuildingModuleKind[], reducedMotion: boolean, onComplete: () => void) => {
    activeUpgrade = null
    setUpgradeProgress(resultingModules, 0, reducedMotion)

    if (reducedMotion) {
      onComplete()
      return () => undefined
    }
    const run = { startedAt: null, onComplete, resultingModules }
    activeUpgrade = run
    return () => {
      if (activeUpgrade === run) activeUpgrade = null
    }
  }

  const updateMotion = (elapsedMs: number, reducedMotion: boolean) => {
    const phase = reducedMotion ? 0.35 : (elapsedMs % 8000) / 8000
    hook.position.set(reducedMotion ? 1 : Math.sin(phase * Math.PI * 2) * 2, reducedMotion ? 3 : (1 - Math.cos(phase * Math.PI * 2)) * 2.5)
    workerA.x = -42 + (reducedMotion ? 3 : Math.sin(phase * Math.PI * 2) * 3)
    workerB.y = 22 - (reducedMotion ? 0 : Math.abs(Math.sin(phase * Math.PI * 4)))
    if (activeUpgrade) {
      activeUpgrade.startedAt ??= elapsedMs
      const progress = Math.min(1, (elapsedMs - activeUpgrade.startedAt) / tokens.motion.constructionMs)
      setUpgradeProgress(activeUpgrade.resultingModules, progress, false)
      if (progress >= 1) {
        const completed = activeUpgrade
        activeUpgrade = null
        completed.onComplete()
      }
    }
  }

  return { container: plot, playUpgrade, updateMotion, setUpgradeProgress, setSelected: interaction.setSelected }
}
