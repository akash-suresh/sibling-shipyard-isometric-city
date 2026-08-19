import { Container, Graphics } from "pixi.js"
import type { BuildingModuleKind, RoofFeatureKind } from "../../data/types"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createIsoPrism } from "../rendering/isometricPrimitives"

const p = tokens.palette

function windows(target: Container, y: number, accent: number, count: number) {
  const glass = new Graphics()
  for (let index = 0; index < count; index += 1) {
    const offset = (index - (count - 1) / 2) * 17
    glass.poly([offset - 6, y - 6, offset, y - 3, offset, y + 7, offset - 6, y + 4]).fill(0x36556c)
    glass.poly([offset + 6, y - 6, offset, y - 3, offset, y + 7, offset + 6, y + 4]).fill(0x263f56)
  }
  const band = new Graphics().poly([-34, y + 12, 0, y + 29, 34, y + 12, 34, y + 16, 0, y + 33, -34, y + 16]).fill(accent)
  band.alpha = 0.8
  target.addChild(glass, band)
}

export function createBuildingModule(kind: BuildingModuleKind, accent: number, occurrence = 0) {
  const module = new Container()
  module.label = `module-${kind}`
  if (kind === "lab-floor") {
    module.addChild(createIsoPrism(72, 40, 34, { top: 0xf4eee5, left: 0xdad4cc, right: 0xc4c0ba, stroke: 0xaaa79f }))
    module.addChild(new Graphics().poly([-36, -26, -7, -11, -7, 12, -36, -3]).fill(0x293a48).poly([36, -26, 7, -11, 7, 12, 36, -3]).fill(0x1f303e))
    module.addChild(new Graphics().poly([-38, -35, -9, -20, -9, -11, -38, -26]).fill(accent))
  } else if (kind === "beta-floor") {
    module.addChild(createIsoPrism(96, 48, 25, { top: p.structure, left: p.structureMid, right: p.structureShadow, stroke: 0xaaa79f }))
    module.addChild(new Graphics().poly([-46, -18, -6, 2, -6, 12, -46, -8]).fill(0x365065).poly([46, -18, 6, 2, 6, 12, 46, -8]).fill(0x263b50))
    module.addChild(new Graphics().poly([-48, -6, 0, 18, 48, -6, 48, -1, 0, 23, -48, -1]).fill(accent))
    const light = new Graphics().circle(0, -38, 6).fill({ color: p.activeLight, alpha: 0.24 }).circle(0, -38, 3).fill(p.activeLight)
    light.label = "upgrade-light"; module.addChild(light)
  } else if (kind === "office-floor") {
    module.addChild(createIsoPrism(92, 50, 42, { top: p.structure, left: p.structureMid, right: p.structureShadow, stroke: 0xaaa79f }))
    windows(module, -25, accent, 2)
    module.addChild(new Graphics().poly([-15, -12, 0, -5, 0, 19, -15, 12]).fill(p.metal))
  } else if (kind === "tower-floor") {
    const upper = occurrence > 0
    module.addChild(createIsoPrism(upper ? 66 : 90, upper ? 36 : 48, upper ? 39 : 48, { top: upper ? 0xf7f2e8 : p.structure, left: upper ? 0xd7d4cc : 0xdfdcd4, right: upper ? 0xb3b4b1 : 0xbdbdb8, stroke: 0xaaa79f }))
    windows(module, upper ? -20 : -26, accent, upper ? 2 : 3)
  } else {
    module.addChild(createIsoPrism(55, 30, 30, { top: 0xeeeae2, left: 0xd2d0ca, right: 0xaeb0ae }))
    module.addChild(new Graphics().poly([10, -22, 18, -18, 18, 3, 10, -1]).fill(accent))
  }
  return module
}

export function createRoofFeature(kind: RoofFeatureKind, accent: number) {
  const feature = new Container()
  feature.label = `roof-${kind}`
  if (kind === "crane") {
    feature.addChild(new Graphics().rect(-3, -119, 7, 123).fill(p.crane).rect(-2, -116, 4, 116).fill(p.craneShadow).poly([-5, -119, 5, -119, 70, -111, 70, -105, 4, -108, -5, -108]).fill(p.crane).moveTo(1, -117).lineTo(63, -108).moveTo(1, -108).lineTo(57, -116).stroke({ color: 0xf5c461, width: 2 }).rect(56, -108, 3, 50).fill(p.craneShadow))
    const hook = new Graphics().circle(57.5, -55, 5).stroke({ color: p.craneShadow, width: 2 }); hook.label = "ambient-hook"; feature.addChild(hook)
  } else if (kind === "beacon") {
    const halo = new Graphics().circle(0, 0, 16).fill({ color: p.activeLight, alpha: 0.14 }); halo.label = "ambient-beacon-halo"
    const bulb = new Graphics().circle(0, 0, 6).fill(p.activeLight); bulb.label = "ambient-beacon-bulb"
    feature.addChild(halo, bulb)
  } else {
    const mast = new Graphics().rect(-2, -35, 4, 35).fill(p.metal).circle(0, -40, 6).fill({ color: p.activeLight, alpha: 0.25 }).circle(0, -40, 3).fill(p.activeLight); mast.label = "ambient-antenna"
    const packet = new Graphics().circle(0, 0, 3).fill(accent); packet.label = "ambient-packet"; packet.position.y = -18
    feature.addChild(mast, packet)
  }
  return feature
}
