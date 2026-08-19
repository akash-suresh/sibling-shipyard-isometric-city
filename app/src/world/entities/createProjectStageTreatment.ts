import { Container, Graphics } from "pixi.js"
import type { ProjectStage } from "../../data/types"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createIsoDiamond, createIsoPrism } from "../rendering/isometricPrimitives"

const p = tokens.palette

function idea(accent: number) {
  const group = new Container()
  const plot = createIsoDiamond(48, 24, 0xd9e5d2, 0x94aa90)
  plot.alpha = 0.72
  const markers = new Graphics()
    .rect(-23, -4, 2, 13).rect(21, -4, 2, 13).rect(-1, -16, 2, 13)
    .fill(accent)
    .moveTo(-20, 3).lineTo(0, 13).lineTo(20, 3).lineTo(0, -7).lineTo(-20, 3)
    .stroke({ color: accent, width: 1, alpha: 0.8 })
  const hologram = createIsoPrism(22, 12, 18, { top: p.structure, left: accent, right: p.nexus })
  hologram.position.y = -7
  hologram.alpha = 0.28
  group.addChild(plot, markers, hologram)
  return group
}

function experiment(accent: number) {
  const group = new Container()
  const workshop = createIsoPrism(38, 21, 20, { top: p.structure, left: p.structureMid, right: p.structureShadow })
  const antenna = new Graphics().rect(10, -38, 2, 24).fill(p.metal).circle(11, -40, 4).fill(accent)
  const bench = new Graphics().poly([-27, 2, -10, 10, 0, 5, -17, -3]).fill(0xa56e42)
  group.addChild(workshop, antenna, bench)
  return group
}

function prototype(accent: number) {
  const group = new Container()
  const pad = createIsoDiamond(48, 24, 0xc8c5bd, 0xa9a69f)
  const crateA = createIsoPrism(15, 9, 11, { top: 0xe7b66c, left: 0xc88b43, right: 0xa96e32 })
  crateA.position.set(-12, 2)
  const crateB = createIsoPrism(12, 7, 9, { top: 0xe7b66c, left: 0xc88b43, right: 0xa96e32 })
  crateB.position.set(7, 8)
  const testFrame = new Graphics()
    .rect(14, -27, 2, 28).rect(28, -20, 2, 28).fill(0x737b7c)
    .moveTo(15, -25).lineTo(29, -18).stroke({ color: accent, width: 3 })
  group.addChild(pad, crateA, crateB, testFrame)
  return group
}

function shipped(accent: number) {
  const group = new Container()
  const entry = createIsoDiamond(52, 26, 0xd8cfbd, 0xbfb5a5)
  const flag = new Graphics().rect(18, -32, 2, 34).fill(p.metal).poly([20, -31, 36, -25, 20, -18]).fill(accent)
  const landscaping = new Graphics()
    .circle(-18, -7, 7).fill(0x5b9a46).circle(-10, -10, 6).fill(0x70ae52)
    .circle(13, 2, 6).fill(0x5b9a46).circle(20, 0, 5).fill(0x70ae52)
  const visitor = new Graphics().circle(0, -15, 3).fill(0x9d6b4c).rect(-3, -12, 6, 10).fill(0x4d72b8)
  group.addChild(entry, landscaping, flag, visitor)
  return group
}

function growing(accent: number) {
  const group = new Container()
  const base = createIsoPrism(44, 24, 22, { top: p.structure, left: p.structureMid, right: p.structureShadow })
  const upper = createIsoPrism(30, 17, 19, { top: p.structure, left: p.structureMid, right: p.structureShadow })
  upper.position.y = -27
  const annex = createIsoPrism(22, 13, 12, { top: p.structure, left: p.structureMid, right: p.structureShadow })
  annex.position.set(26, 2)
  const arrow = new Graphics().moveTo(-29, -4).lineTo(-29, -35).stroke({ color: accent, width: 3 }).poly([-35, -29, -29, -40, -23, -29]).fill(accent)
  group.addChild(base, upper, annex, arrow)
  return group
}

function landmark(accent: number) {
  const group = new Container()
  const plaza = createIsoDiamond(58, 30, 0xd8cfbd, 0xbfb5a5)
  const pedestal = createIsoPrism(34, 19, 13, { top: 0xf4efe2, left: 0xd8d1c2, right: 0xbab6ae })
  const monument = new Graphics().poly([-8, -16, 0, -49, 8, -16, 0, -5]).fill(accent).circle(0, -51, 4).fill(p.activeLight)
  const banners = new Graphics().rect(-27, -31, 2, 32).fill(p.metal).poly([-25, -30, -12, -25, -25, -18]).fill(accent)
  group.addChild(plaza, pedestal, monument, banners)
  return group
}

const factories: Record<ProjectStage, (accent: number) => Container> = {
  idea,
  experiment,
  prototype,
  shipped,
  growing,
  landmark,
}

/** A compact architectural cue for a project's maturity, independent of status. */
export function createProjectStageTreatment(stage: ProjectStage, accent: number = p.nexus) {
  const treatment = factories[stage](accent)
  treatment.label = `stage-${stage}`
  return treatment
}
