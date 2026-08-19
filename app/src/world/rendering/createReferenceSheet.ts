import { Container, Graphics, Text } from "pixi.js"
import { projects } from "../../data/loadProjects"
import { buildingModuleKinds, projectStages, projectStatuses, roofFeatureKinds } from "../../data/types"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createProjectInteractionChrome, type ProjectInteractionState } from "../entities/projectInteraction"
import { createProjectBuilding } from "../entities/createProjectBuilding"
import { createBuildingModule, createRoofFeature } from "../entities/buildingParts"
import { createProjectStageTreatment } from "../entities/createProjectStageTreatment"
import { createProjectStatusEffect } from "../entities/createProjectStatusEffect"
import { createTownBench, createTownBridge, createTownCurb, createTownEdge, createTownFlowerPatch, createTownLamp, createTownPerson, createTownServiceVehicle, createTownShrub, createTownSign, createTownTile, createTownTree, type PavedSurface, type RoadDirection } from "../entities/townComponents"
import { createContactShadow, createIsoPrism } from "./isometricPrimitives"
import { createTownEnvironment } from "./createTownEnvironment"
import { shipyardZeroLayout } from "../layout/townLayout"
import { createLayoutDebugOverlay } from "../layout/createLayoutDebugOverlay"
import { createAmbientLife } from "./createAmbientLife"
import milestoneData from "../../data/milestones.json"
import type { MilestoneDefinition } from "../../data/types"

export const catalogSections = ["overview", "terrain", "layout", "buildings", "progression", "props", "states", "motion"] as const
export type CatalogSection = (typeof catalogSections)[number]
export type CatalogLayout = "wide" | "compact"
export const catalogArtboards = { wide: { width: 800, height: 620 }, compact: { width: 350, height: 720 } } as const

const p = tokens.palette
const catalogMilestone = milestoneData[0] as MilestoneDefinition
const curbSurfaces: PavedSurface[] = ["road", "plaza", "path"]
const curbRim: RoadDirection[] = ["north", "east", "south", "west"]

function label(text: string, x: number, y: number, size = 15, color: number = p.ink) {
  const node = new Text({ text, style: { fill: color, fontFamily: "Inter, sans-serif", fontSize: size, fontWeight: "600" } })
  node.position.set(x, y)
  return node
}

function heading(sheet: Container, title: string, subtitle: string) {
  sheet.addChild(label(`VISUAL SYSTEM · ${title.toUpperCase()}`, 0, 0, 12, p.mutedInk), label(subtitle, 0, 25, 24))
  const badge = new Container(); badge.position.set(690, 4)
  badge.addChild(new Graphics().roundRect(0, 0, 92, 22, 11).fill(0xe7efe2), label("PRODUCTION", 13, 5, 9, 0x4c7451))
  sheet.addChild(badge)
}

function sectionTitle(sheet: Container, text: string, x: number, y: number) { sheet.addChild(label(text, x, y, 11, p.mutedInk)) }

function card(item: Container, name: string, x: number, groundY: number, scale = 1) {
  const group = new Container(); group.position.set(x, groundY); item.scale.set(scale); item.eventMode = "none"
  group.addChild(new Graphics().roundRect(-58, 18, 116, 34, 10).fill({ color: 0xffffff, alpha: 0.66 }), item, label(name, -48, 29, 10))
  return group
}

function createBuildings() {
  const workshopProject = projects.find((project) => project.building.archetype === "workshop")!
  const studioProject = projects.find((project) => project.building.archetype === "studio")!
  const towerProject = projects.find((project) => project.building.archetype === "tower")!
  const workshop = createProjectBuilding(workshopProject, () => undefined)
  const studio = createProjectBuilding(studioProject, () => undefined)
  const tower = createProjectBuilding(towerProject, () => undefined)
  return {
    controllers: [workshop, studio, tower] as const,
    update(elapsedMs: number, reduced: boolean, previewUpgrade: boolean) {
      workshop.updateMotion(elapsedMs, reduced); studio.updateMotion(elapsedMs, reduced); tower.updateMotion(elapsedMs, reduced)
      if (previewUpgrade) {
        const cycle = tokens.motion.constructionMs + 1400
        workshop.setMilestonePreview(catalogMilestone.resultingModules, reduced ? 1 : Math.min(1, (elapsedMs % cycle) / tokens.motion.constructionMs), reduced)
      }
    },
  }
}

const shadowCaption = `contact-shadow · cast ${Math.round(tokens.shadow.castAlpha * 100)}% + core ${Math.round(tokens.shadow.contactAlpha * 100)}%`

/** One mass over its own production shadow, so the light rule is shown rather than only written. */
function shadowSpecimen(width: number, depth: number, height: number, x: number, groundY: number) {
  const group = new Container()
  group.position.set(x, groundY)
  const mass = createIsoPrism(width, depth, height, { top: p.structure, left: p.structureMid, right: p.structureShadow })
  group.addChild(createContactShadow(width, depth), mass)
  return group
}

function overviewSection(sheet: Container) {
  heading(sheet, "Overview", "The rules every World component shares.")
  sectionTitle(sheet, "PALETTE", 0, 96)
  const swatches = [p.grassLight, p.road, p.plaza, p.sidewalk, p.water, p.structure, p.structureMid, p.concrete, p.orion, p.spark, p.nexus, p.activeLight]
  swatches.forEach((color, index) => sheet.addChild(new Graphics().roundRect(index * 52, 122, 40, 40, 9).fill(color)))
  sectionTitle(sheet, "PROJECTION · 96 × 48", 0, 205)
  const tile = createTownTile("grass"); tile.position.set(70, 270)
  const block = createIsoPrism(88, 44, 48, { top: p.structure, left: p.structureMid, right: p.structureShadow }); block.position.set(210, 275)
  sheet.addChild(tile, block, label("1 tile", 46, 305, 11), label("2 floors", 178, 322, 11))
  sectionTitle(sheet, "CANONICAL SCALE", 340, 205)
  sheet.addChild(card(createTownPerson(), "person · 18 px", 390, 305), card(createTownTree(), "tree · 42 px", 530, 305), card(createTownServiceVehicle(), "vehicle · 54 px", 680, 305, 0.9))
  sectionTitle(sheet, "LOCKED RULES", 0, 400)
  sheet.addChild(label("Upper-left light", 0, 435, 13), label("Lower-right shadow · 16%", 0, 465, 13), label("Ground-contact center anchors", 270, 435, 13), label("Important detail ≥ 3 px", 270, 465, 13), label("Stage ≠ status ≠ milestone", 560, 435, 13), label("One Pixi motion clock", 560, 465, 13))
  sectionTitle(sheet, "SHADOW & LIGHT", 0, 500)
  sheet.addChild(shadowSpecimen(64, 32, 36, 96, 580), label(shadowCaption, 190, 545, 12), label("Nested isometric diamonds offset lower-right", 190, 573, 12))
}

function terrainSection(sheet: Container) {
  heading(sheet, "Terrain", "Connected tiles, water edges, and crossings.")
  sectionTitle(sheet, "SURFACES", 0, 84)
  const kinds = ["grass", "grass-accent", "road", "plaza", "path", "water"] as const
  kinds.forEach((kind, index) => {
    const tile = createTownTile(kind, kind === "road" ? ["north", "south"] : []); tile.position.set(64 + index * 130, 148)
    sheet.addChild(tile, label(kind, 30 + index * 130, 180, 10))
    if (kind === "water") { const edge = createTownEdge("east"); edge.position.copyFrom(tile.position); sheet.addChild(edge) }
  })
  sectionTitle(sheet, "ROAD CONNECTIONS", 0, 212)
  const variants = [{ name: "terminus", connections: ["north"] }, { name: "straight", connections: ["north", "south"] }, { name: "corner", connections: ["north", "east"] }, { name: "junction", connections: ["north", "east", "south"] }] as const
  variants.forEach((variant, index) => { const tile = createTownTile("road", [...variant.connections]); tile.position.set(80 + index * 180, 276); sheet.addChild(tile, label(variant.name, 48 + index * 180, 308, 10)) })
  sectionTitle(sheet, "CURBS", 0, 340)
  curbSurfaces.forEach((surface, index) => {
    const tile = createTownTile(surface, surface === "road" ? ["north", "south"] : [])
    const curb = createTownCurb({ edges: [...curbRim], surface })
    tile.position.set(130 + index * 270, 404); curb.position.copyFrom(tile.position)
    sheet.addChild(tile, curb, label(`curb-${surface}`, 98 + index * 270, 436, 10))
  })
  sectionTitle(sheet, "WATER & EDGES", 0, 468)
  const water = createTownTile("water"); water.position.set(70, 548)
  const northBank = createTownEdge("north"); northBank.position.copyFrom(water.position)
  const eastBank = createTownEdge("east"); eastBank.position.copyFrom(water.position)
  sheet.addChild(water, northBank, eastBank, card(createTownBridge("x"), "bridge · x", 260, 548, 0.86), card(createTownBridge("y"), "bridge · y", 460, 548, 0.86), card(createTownFlowerPatch(), "bank flowers", 650, 548))
}

function buildingsSection(sheet: Container) {
  heading(sheet, "Buildings", "Identity assembled from reusable project data.")
  sectionTitle(sheet, "BUILDING ARCHETYPES · DATA-DRIVEN CONTROLLERS", 0, 92)
  const buildings = createBuildings()
  sheet.addChild(card(buildings.controllers[0].container, "workshop · Orion", 135, 260, 0.5), card(buildings.controllers[1].container, "studio · Spark", 395, 260, 0.7), card(buildings.controllers[2].container, "tower · Nexus", 665, 260, 0.54))
  sectionTitle(sheet, "STACKABLE MODULES · ORDERED FROM PROJECT DATA", 0, 340)
  buildingModuleKinds.forEach((kind, index) => sheet.addChild(card(createBuildingModule(kind, p.nexus, kind === "tower-floor" ? 0 : index), kind, 78 + index * 160, 430, kind === "sky-wing" ? 0.78 : 0.68)))
  sectionTitle(sheet, "ROOF FEATURES · OPTIONAL DATA SLOT", 0, 500)
  roofFeatureKinds.forEach((kind, index) => sheet.addChild(card(createRoofFeature(kind, p.nexus), kind, 155 + index * 245, 565, kind === "crane" ? 0.5 : 0.75)))
  return (elapsedMs: number, reduced: boolean) => buildings.update(elapsedMs, reduced, false)
}

function layoutSection(sheet: Container) {
  heading(sheet, "Layout", "Authored grid data resolved into one production town.")
  const preview = new Container(); preview.position.set(280, 245); preview.scale.set(0.52)
  preview.addChild(createTownEnvironment(shipyardZeroLayout), createLayoutDebugOverlay(shipyardZeroLayout, projects))
  sheet.addChild(preview)
  sectionTitle(sheet, "LAYOUT DEBUG", 585, 105)
  sheet.addChild(label("90 tiles", 585, 140, 12), label("14 road cells", 585, 170, 12), label("8 water cells", 585, 200, 12), label("22 prop anchors", 585, 230, 12), label("3 project plots", 585, 260, 12), label("2 actor routes", 585, 290, 12))
  sheet.addChild(label("◇ grid", 585, 350, 11), label("＋ prop anchor", 585, 380, 11), label("◆ project footprint", 585, 410, 11), label("— walker route", 585, 440, 11), label("0 conflicts", 585, 500, 12, 0x4c7451))
  sheet.addChild(label("Authored → validated → rendered", 0, 575, 11))
}

function propsSection(sheet: Container) {
  heading(sheet, "Props", "Canonical town scale and ground anchors.")
  const props = [[createTownTree(), "tree"], [createTownLamp(), "lamp"], [createTownPerson(), "person"], [createTownServiceVehicle(), "service vehicle"], [createTownShrub(), "shrub"], [createTownBench(), "bench"], [createTownSign(), "project sign"], [createTownFlowerPatch(), "flowers"], [createTownBridge("x"), "bridge"]] as const
  props.forEach(([item, name], index) => { const column = index % 3; const row = Math.floor(index / 3); sheet.addChild(card(item, name, 130 + column * 270, 190 + row * 185, name === "bridge" ? 0.72 : 1)) })
}

function interactionRow(sheet: Container) {
  const states: ProjectInteractionState[] = ["default", "hover", "selected"]
  states.forEach((state, index) => {
    const group = new Container(); group.position.set(130 + index * 270, 205)
    const chrome = createProjectInteractionChrome("Sample project", 130, 64, 58)
    const building = createIsoPrism(72, 39, 36, { top: p.structure, left: p.structureMid, right: p.structureShadow }); building.position.y = -6
    group.addChild(chrome.ground, building, chrome.label, label(state, -30, 82, 11)); chrome.setState(state); sheet.addChild(group)
  })
}

function statesSection(sheet: Container) {
  heading(sheet, "States", "Interaction and operating state stay independent.")
  sectionTitle(sheet, "INTERACTION CHROME", 0, 92); interactionRow(sheet)
  sectionTitle(sheet, "STATUS VOCABULARY · SHAPE + COLOUR", 0, 345)
  projectStatuses.forEach((status, index) => { const sample = createProjectStatusEffect(status); const column = index % 4; const row = Math.floor(index / 4); sample.position.set(90 + column * 190, 430 + row * 125); sheet.addChild(sample, label(status, 55 + column * 190, 456 + row * 125, 10)) })
}

function progressionSection(sheet: Container) {
  heading(sheet, "Progression", "Permanent architecture earned from idea to landmark.")
  sectionTitle(sheet, "PROJECT STAGES · SHARED PLOT TREATMENTS", 0, 92)
  projectStages.forEach((stage, index) => {
    const sample = createProjectStageTreatment(stage, p.nexus)
    const column = index % 3; const row = Math.floor(index / 3)
    sample.position.set(125 + column * 270, 225 + row * 245); sample.scale.set(stage === "landmark" ? 0.9 : 1)
    sheet.addChild(sample, label(stage, 88 + column * 270, 275 + row * 245, 11))
  })
  sheet.addChild(label("Permanent mass and plot detail", 0, 575, 11), label("Independent from status and interaction", 290, 575, 11))
}

function motionSection(sheet: Container) {
  heading(sheet, "Motion", "One clock drives actors, buildings, and milestones.")
  sectionTitle(sheet, "PROJECT AMBIENCE + ORION MILESTONE", 0, 90)
  const buildings = createBuildings()
  sheet.addChild(card(buildings.controllers[0].container, "construction", 135, 285, 0.62), card(buildings.controllers[1].container, "live beacon", 395, 285, 0.82), card(buildings.controllers[2].container, "growth signal", 665, 285, 0.66))
  sectionTitle(sheet, "PRODUCTION AMBIENT ROUTES", 0, 405)
  const routeScene = new Container(); routeScene.position.set(245, 435); routeScene.scale.set(0.3)
  const ambient = createAmbientLife(shipyardZeroLayout); routeScene.addChild(createTownEnvironment(shipyardZeroLayout), ambient.container); sheet.addChild(routeScene)
  sheet.addChild(label("walker · 6.2 s", 570, 445, 11), label("vehicle · 10.5 s", 570, 475, 11), label("milestone · 1.5 s", 570, 505, 11), label("Play · clock", 0, 575, 10), label("Paused · exact frame", 150, 575, 10), label("Reduced · composed pose", 350, 575, 10))
  return (elapsedMs: number, reduced: boolean) => { buildings.update(elapsedMs, reduced, true); ambient.updateMotion(elapsedMs, reduced) }
}

function compactHeading(sheet: Container, title: string, subtitle: string) {
  sheet.addChild(label(title.toUpperCase(), 0, 0, 11, p.mutedInk), label(subtitle, 0, 24, 18))
}

function compactOverview(sheet: Container) {
  compactHeading(sheet, "Overview", "One visual grammar for the World.")
  sectionTitle(sheet, "PALETTE", 0, 82)
  const colors = [p.grassLight, p.road, p.plaza, p.sidewalk, p.water, p.structure, p.structureMid, p.concrete, p.orion, p.spark, p.nexus, p.activeLight]
  colors.forEach((color, index) => sheet.addChild(new Graphics().roundRect((index % 6) * 52, 108 + Math.floor(index / 6) * 50, 40, 40, 8).fill(color)))
  sectionTitle(sheet, "PROJECTION & SCALE", 0, 230)
  const tile = createTownTile("grass"); tile.position.set(62, 300)
  const block = createIsoPrism(72, 36, 42, { top: p.structure, left: p.structureMid, right: p.structureShadow }); block.position.set(170, 304)
  sheet.addChild(tile, block, card(createTownPerson(), "person", 285, 305))
  sectionTitle(sheet, "LOCKED RULES", 0, 400)
  sheet.addChild(label("Upper-left light · lower-right shadow", 0, 435, 12), label("96 × 48 grid · ground-center anchors", 0, 468, 12), label("Stage ≠ status ≠ milestone", 0, 501, 12), label("One ticker · reduced-motion pose", 0, 534, 12), label("Important detail ≥ 3 px", 0, 567, 12))
  sectionTitle(sheet, "SHADOW & LIGHT", 0, 606)
  sheet.addChild(shadowSpecimen(56, 28, 30, 52, 690), label(shadowCaption, 110, 668, 11), label("Nested iso diamonds, no rotation", 110, 692, 11))
}

function compactTerrain(sheet: Container) {
  compactHeading(sheet, "Terrain", "Surfaces, roads, water, and bridges.")
  sectionTitle(sheet, "SURFACES", 0, 70)
  const kinds = ["grass", "grass-accent", "road", "plaza", "path", "water"] as const
  kinds.forEach((kind, index) => { const tile = createTownTile(kind, kind === "road" ? ["north", "south"] : []); const x = 58 + (index % 3) * 116; const y = 128 + Math.floor(index / 3) * 92; tile.position.set(x, y); sheet.addChild(tile, label(kind, x - 35, y + 32, 9)); if (kind === "water") { const edge = createTownEdge("east"); edge.position.copyFrom(tile.position); sheet.addChild(edge) } })
  sectionTitle(sheet, "ROAD GRAMMAR", 0, 276)
  const roads = [["terminus", ["north"]], ["straight", ["north", "south"]], ["corner", ["north", "east"]], ["junction", ["north", "east", "south"]]] as const
  roads.forEach(([name, connections], index) => { const tile = createTownTile("road", [...connections]); const x = 85 + (index % 2) * 180; const y = 334 + Math.floor(index / 2) * 92; tile.position.set(x, y); sheet.addChild(tile, label(name, x - 32, y + 32, 9)) })
  sectionTitle(sheet, "CURBS", 0, 482)
  curbSurfaces.forEach((surface, index) => {
    const tile = createTownTile(surface, surface === "road" ? ["north", "south"] : [])
    const curb = createTownCurb({ edges: [...curbRim], surface })
    const x = 58 + index * 116; tile.position.set(x, 540); curb.position.copyFrom(tile.position)
    sheet.addChild(tile, curb, label(`curb-${surface}`, x - 35, 572, 9))
  })
  sectionTitle(sheet, "WATER KIT", 0, 596)
  const water = createTownTile("water"); water.position.set(60, 656); const bank = createTownEdge("north"); bank.position.copyFrom(water.position)
  sheet.addChild(water, bank, card(createTownBridge("x"), "bridge x", 180, 656, 0.7), card(createTownBridge("y"), "bridge y", 300, 656, 0.7))
}

function compactBuildings(sheet: Container) {
  compactHeading(sheet, "Buildings", "Identity assembled from reusable parts.")
  const buildings = createBuildings()
  sectionTitle(sheet, "BUILDING ARCHETYPES", 0, 78)
  sheet.addChild(card(buildings.controllers[0].container, "workshop", 58, 220, 0.38), card(buildings.controllers[1].container, "studio", 175, 220, 0.48), card(buildings.controllers[2].container, "tower", 292, 220, 0.36))
  sectionTitle(sheet, "MODULES", 0, 290)
  buildingModuleKinds.forEach((kind, index) => { const x = 62 + (index % 3) * 116; const y = 390 + Math.floor(index / 3) * 125; sheet.addChild(card(createBuildingModule(kind, p.nexus, 0), kind, x, y, 0.58)) })
  sectionTitle(sheet, "ROOFS", 0, 570)
  roofFeatureKinds.forEach((kind, index) => sheet.addChild(card(createRoofFeature(kind, p.nexus), kind, 58 + index * 117, 655, kind === "crane" ? 0.42 : 0.66)))
  return (elapsedMs: number, reduced: boolean) => buildings.update(elapsedMs, reduced, false)
}

function compactLayout(sheet: Container) {
  compactHeading(sheet, "Layout", "One validated map drives the World.")
  const preview = new Container(); preview.position.set(175, 185); preview.scale.set(0.34)
  preview.addChild(createTownEnvironment(shipyardZeroLayout), createLayoutDebugOverlay(shipyardZeroLayout, projects)); sheet.addChild(preview)
  sectionTitle(sheet, "PRODUCTION MANIFEST", 0, 380)
  sheet.addChild(label("90 tiles · 14 roads · 8 water", 0, 415, 12), label("22 prop anchors · 3 project plots", 0, 450, 12), label("2 validated actor routes", 0, 485, 12), label("◇ grid    ＋ anchor", 0, 545, 11), label("◆ footprint    — route", 0, 580, 11), label("0 conflicts", 0, 640, 12, 0x4c7451))
}

function compactProps(sheet: Container) {
  compactHeading(sheet, "Props", "Canonical scale and ground anchors.")
  const props = [[createTownTree(), "tree"], [createTownLamp(), "lamp"], [createTownPerson(), "person"], [createTownServiceVehicle(), "vehicle"], [createTownShrub(), "shrub"], [createTownBench(), "bench"], [createTownSign(), "sign"], [createTownFlowerPatch(), "flowers"], [createTownBridge("x"), "bridge"]] as const
  props.forEach(([item, name], index) => { const x = 88 + (index % 2) * 176; const y = 150 + Math.floor(index / 2) * 130; sheet.addChild(card(item, name, x, y, name === "bridge" ? 0.65 : 0.9)) })
}

function compactStates(sheet: Container) {
  compactHeading(sheet, "States", "Interaction and operating state.")
  sectionTitle(sheet, "INTERACTION", 0, 78)
  const states: ProjectInteractionState[] = ["default", "hover", "selected"]
  states.forEach((state, index) => { const group = new Container(); group.position.set(58 + index * 117, 170); const chrome = createProjectInteractionChrome("Project", 105, 52, 48); const building = createIsoPrism(58, 31, 30, { top: p.structure, left: p.structureMid, right: p.structureShadow }); group.addChild(chrome.ground, building, chrome.label, label(state, -26, 68, 9)); chrome.setState(state); sheet.addChild(group) })
  sectionTitle(sheet, "STATUS VOCABULARY", 0, 300)
  projectStatuses.forEach((status, index) => { const item = createProjectStatusEffect(status); const x = 48 + (index % 4) * 85; const y = 390 + Math.floor(index / 4) * 135; item.position.set(x, y); sheet.addChild(item, label(status, x - 30, y + 30, 8)) })
}

function compactProgression(sheet: Container) {
  compactHeading(sheet, "Progression", "Six permanent stages of maturity.")
  sectionTitle(sheet, "PROJECT STAGES", 0, 78)
  projectStages.forEach((stage, index) => {
    const sample = createProjectStageTreatment(stage, p.nexus)
    const x = 88 + (index % 2) * 176; const y = 180 + Math.floor(index / 2) * 185
    sample.position.set(x, y); sample.scale.set(stage === "landmark" ? 0.84 : 0.92)
    sheet.addChild(sample, label(stage, x - 34, y + 48, 10))
  })
}

function compactMotion(sheet: Container) {
  compactHeading(sheet, "Motion", "Play, pause, and reduced poses.")
  const buildings = createBuildings()
  sectionTitle(sheet, "PROJECT LOOPS", 0, 78)
  sheet.addChild(card(buildings.controllers[0].container, "build", 58, 260, 0.48), card(buildings.controllers[1].container, "live", 175, 260, 0.58), card(buildings.controllers[2].container, "grow", 292, 260, 0.46))
  sectionTitle(sheet, "PRODUCTION ROUTES", 0, 350)
  const routeScene = new Container(); routeScene.position.set(175, 420); routeScene.scale.set(0.27)
  const ambient = createAmbientLife(shipyardZeroLayout); routeScene.addChild(createTownEnvironment(shipyardZeroLayout), ambient.container); sheet.addChild(routeScene)
  sheet.addChild(label("walker 6.2 s · vehicle 10.5 s", 0, 580, 11), label("milestone 1.5 s", 0, 612, 11), label("Controls below · one production clock", 0, 650, 10))
  return (elapsedMs: number, reduced: boolean) => { buildings.update(elapsedMs, reduced, true); ambient.updateMotion(elapsedMs, reduced) }
}

function createCompactSection(section: CatalogSection, container: Container): (elapsedMs: number, reduced: boolean) => void {
  if (section === "overview") compactOverview(container)
  else if (section === "terrain") compactTerrain(container)
  else if (section === "layout") compactLayout(container)
  else if (section === "buildings") return compactBuildings(container)
  else if (section === "progression") compactProgression(container)
  else if (section === "props") compactProps(container)
  else if (section === "states") compactStates(container)
  else return compactMotion(container)
  return (_elapsedMs: number, _reduced: boolean) => undefined
}

export function createReferenceSheet(section: CatalogSection, layout: CatalogLayout = "wide") {
  const container = new Container()
  if (layout === "compact") return { container, updateMotion: createCompactSection(section, container), artboard: catalogArtboards.compact }
  let update: (elapsedMs: number, reduced: boolean) => void = () => undefined
  if (section === "overview") overviewSection(container)
  else if (section === "terrain") terrainSection(container)
  else if (section === "layout") layoutSection(container)
  else if (section === "buildings") update = buildingsSection(container)
  else if (section === "progression") progressionSection(container)
  else if (section === "props") propsSection(container)
  else if (section === "states") statesSection(container)
  else update = motionSection(container)
  return { container, updateMotion: update, artboard: catalogArtboards.wide }
}
