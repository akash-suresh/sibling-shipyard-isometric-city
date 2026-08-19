import { Container, Graphics } from "pixi.js"
import type { ProjectStatus } from "../../data/types"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createIsoPrism } from "../rendering/isometricPrimitives"

const p = tokens.palette

function buildingEffect() {
  const effect = new Container()
  const rail = new Graphics()
    .rect(-18, -19, 4, 20).fill(p.craneShadow)
    .rect(14, -19, 4, 20).fill(p.craneShadow)
    .poly([-19, -18, 17, -18, 17, -10, -19, -10]).fill(p.crane)
    .moveTo(-14, -18).lineTo(-4, -10).moveTo(0, -18).lineTo(10, -10)
    .stroke({ color: 0xfff4cf, width: 3 })
  effect.addChild(rail)
  return effect
}

function liveEffect() {
  const effect = new Container()
  const glow = new Graphics().circle(0, -16, 16).fill({ color: p.activeLight, alpha: 0.14 })
  const lamp = new Graphics()
    .rect(-2, -16, 4, 17).fill(p.metal)
    .circle(0, -19, 5).fill(p.activeLight)
  const visitors = new Graphics()
    .circle(-11, -8, 3).fill(0x855c45).rect(-14, -5, 6, 8).fill(0x43a879)
    .circle(11, -8, 3).fill(0x9c694c).rect(8, -5, 6, 8).fill(0x4a80b5)
  effect.addChild(glow, lamp, visitors)
  return effect
}

function growingEffect() {
  const effect = new Container()
  const modules = new Container()
  const lower = createIsoPrism(28, 15, 9, { top: 0xf3efe7, left: 0xd5d1ca, right: 0xb6b5b1 })
  const upper = createIsoPrism(20, 11, 8, { top: 0xf3efe7, left: 0xd5d1ca, right: 0xb6b5b1 })
  upper.position.y = -13
  modules.addChild(lower, upper)
  const arrow = new Graphics()
    .moveTo(22, -2).lineTo(22, -28).stroke({ color: p.nexus, width: 3 })
    .poly([15, -22, 22, -32, 29, -22]).fill(p.nexus)
  effect.addChild(modules, arrow)
  return effect
}

function pausedEffect() {
  const effect = new Container()
  const post = new Graphics().rect(-2, -30, 4, 31).fill(p.metal)
  const loweredFlag = new Graphics().poly([2, -26, 24, -21, 2, -13]).fill(0x8792a0)
  const quiet = new Graphics()
    .moveTo(-17, -23).lineTo(-9, -23).lineTo(-17, -15).lineTo(-9, -15)
    .moveTo(-10, -34).lineTo(-3, -34).lineTo(-10, -27).lineTo(-3, -27)
    .stroke({ color: p.mutedInk, width: 2 })
  effect.addChild(post, loweredFlag, quiet)
  return effect
}

function incidentEffect() {
  const effect = new Container()
  const cone = new Graphics()
    .poly([-9, 0, 0, -25, 9, 0]).fill(0xe7684f)
    .poly([-5, -4, 0, -18, 5, -4]).fill(0xffe5b0)
  const smoke = new Graphics()
    .circle(-4, -31, 7).fill({ color: 0x798591, alpha: 0.82 })
    .circle(5, -38, 9).fill({ color: 0xa2abb3, alpha: 0.76 })
    .circle(-2, -48, 8).fill({ color: 0xc2c8cc, alpha: 0.7 })
  effect.addChild(cone, smoke)
  return effect
}

function shippingEffect() {
  const effect = new Container()
  const crate = createIsoPrism(24, 13, 16, { top: 0xe7b66c, left: 0xc88b43, right: 0xa96e32 })
  const arrow = new Graphics().moveTo(14, -8).lineTo(29, -8).stroke({ color: p.ink, width: 3 }).poly([25, -14, 34, -8, 25, -2]).fill(p.ink)
  effect.addChild(crate, arrow)
  return effect
}

function archivedEffect() {
  const effect = new Container()
  const vault = createIsoPrism(30, 16, 18, { top: 0xcbd0ca, left: 0xaeb5ad, right: 0x858f88 })
  const lock = new Graphics().roundRect(-5, -12, 10, 9, 2).fill(0x66727b).arc(0, -12, 4, Math.PI, 0).stroke({ color: 0x66727b, width: 2 })
  const leaves = new Graphics().ellipse(-12, -19, 10, 5).fill(0x619c53).ellipse(9, -4, 11, 5).fill(0x78ae5c)
  effect.addChild(vault, lock, leaves)
  return effect
}

/** A compact, non-colour-only status cue shared by the World and component catalog. */
export function createProjectStatusEffect(status: ProjectStatus) {
  const factories: Record<ProjectStatus, () => Container> = {
    building: buildingEffect,
    shipping: shippingEffect,
    live: liveEffect,
    growing: growingEffect,
    paused: pausedEffect,
    archived: archivedEffect,
    incident: incidentEffect,
  }
  const effect = factories[status]()
  effect.label = `status-${status}`
  return effect
}
