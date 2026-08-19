import { Container, Graphics } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createIsoDiamond, createIsoPrism } from "../rendering/isometricPrimitives"

const p = tokens.palette

export type TownTileKind = "grass" | "grass-accent" | "road" | "plaza" | "path" | "water"
export type RoadDirection = "north" | "east" | "south" | "west"

/** Surfaces overdraw by half a pixel so neighbouring diamonds never reveal an antialiased hairline seam. */
const tileFill: Record<TownTileKind, number> = {
  grass: p.grassLight,
  "grass-accent": p.grassLight,
  road: p.road,
  plaza: p.plaza,
  path: p.sidewalk,
  water: p.water,
}

export function createTownTile(kind: TownTileKind, roadConnections: RoadDirection[] = []) {
  const tile = new Container()
  tile.label = `tile-${kind}`
  tile.addChild(createIsoDiamond(97, 49, tileFill[kind]))
  if (kind === "grass-accent") {
    const patch = new Graphics()
      .poly([-2, -13, 25, 0, -2, 13, -29, 0]).fill(p.grassDark)
      .poly([26, -6, 40, 1, 26, 8, 12, 1]).fill(p.grassDark)
    patch.alpha = 0.75
    tile.addChild(patch)
  }
  if (kind === "road") {
    const endpoints: Record<RoadDirection, [number, number]> = {
      north: [48, -24], east: [48, 24], south: [-48, 24], west: [-48, -24],
    }
    const markings = new Graphics()
    roadConnections.forEach((direction) => {
      const [x, y] = endpoints[direction]
      markings.moveTo(x * 0.2, y * 0.2).lineTo(x * 0.72, y * 0.72)
    })
    markings.stroke({ color: p.roadMarking, width: 2, alpha: 0.7 })
    tile.addChild(markings)
  }
  if (kind === "water") {
    const ripples = new Graphics()
      .moveTo(-28, -3).lineTo(-13, 4)
      .moveTo(8, -7).lineTo(24, 1)
      .stroke({ color: 0xc5eef0, width: 2, alpha: 0.72 })
    tile.addChild(ripples)
  }
  return tile
}

export function createTownEdge(direction: RoadDirection, kind: "bank" | "curb" = "bank") {
  const corners: Record<RoadDirection, [number, number, number, number]> = {
    north: [0, -24, 48, 0], east: [48, 0, 0, 24], south: [0, 24, -48, 0], west: [-48, 0, 0, -24],
  }
  const [x1, y1, x2, y2] = corners[direction]
  const edge = new Container()
  edge.label = `${kind}-edge-${direction}`
  edge.addChild(new Graphics().moveTo(x1, y1).lineTo(x2, y2).stroke({ color: kind === "bank" ? 0xd8cfaa : 0xd9d6cd, width: kind === "bank" ? 5 : 4 }))
  return edge
}

export type PavedSurface = "road" | "plaza" | "path"

export interface TownCurbOptions {
  edges: RoadDirection[]
  surface?: PavedSurface
  height?: number
}

/** Band depth as a fraction of one tile: traffic kerbs read heavier than a garden path lip. */
const curbDepth: Record<PavedSurface, number> = { road: 0.16, plaza: 0.13, path: 0.1 }
const curbContact: Record<PavedSurface, number> = { road: p.roadSeam, plaza: p.plazaSeam, path: p.sidewalkSeam }
const curbOrder: RoadDirection[] = ["north", "east", "south", "west"]
const halfTileWidth = tokens.projection.tileWidth / 2
const halfTileDepth = tokens.projection.tileHeight / 2
/** Each run walks its tile edge clockwise; `inward` is the signed grid step toward the tile centre. */
const curbRuns: Record<RoadDirection, { from: [number, number]; to: [number, number]; inward: [number, number] }> = {
  north: { from: [0, -halfTileDepth], to: [halfTileWidth, 0], inward: [-1, 1] },
  east: { from: [halfTileWidth, 0], to: [0, halfTileDepth], inward: [-1, -1] },
  south: { from: [0, halfTileDepth], to: [-halfTileWidth, 0], inward: [1, -1] },
  west: { from: [-halfTileWidth, 0], to: [0, -halfTileDepth], inward: [1, 1] },
}

export function createTownCurb({ edges, surface = "road", height = tokens.projection.curbHeight }: TownCurbOptions) {
  const curb = new Container()
  curb.label = `curb-${surface}`
  const depth = curbDepth[surface]
  const faces = new Graphics()
  const tops = new Graphics()
  const contact = new Graphics()
  curbOrder.filter((direction) => edges.includes(direction)).forEach((direction) => {
    const { from, to, inward } = curbRuns[direction]
    // Overrun the corners by half a pixel so a run across neighbouring tiles never shows a hairline.
    const overrunX = Math.sign(to[0] - from[0]) * 0.5
    const overrunY = Math.sign(to[1] - from[1]) * 0.25
    const insetX = inward[0] * halfTileWidth * depth
    const insetY = inward[1] * halfTileDepth * depth
    const outer: [number, number][] = [[from[0] - overrunX, from[1] - overrunY], [to[0] + overrunX, to[1] + overrunY]]
    const inner = outer.map(([x, y]): [number, number] => [x + insetX, y + insetY])
    // Only one wall of the lip faces the camera: the one rising from the lower of the two run lines.
    const [footA, footB] = insetY > 0 ? inner : outer
    faces.poly([footA[0], footA[1], footB[0], footB[1], footB[0], footB[1] - height, footA[0], footA[1] - height]).fill(p.curbFace)
    tops.poly([outer[0][0], outer[0][1] - height, outer[1][0], outer[1][1] - height, inner[1][0], inner[1][1] - height, inner[0][0], inner[0][1] - height]).fill(p.curb)
    contact.moveTo(footA[0], footA[1]).lineTo(footB[0], footB[1])
  })
  contact.stroke({ color: curbContact[surface], width: 1, alpha: 0.8 })
  curb.addChild(faces, tops, contact)
  return curb
}

export function createTownBridge(axis: "x" | "y" = "x") {
  const bridge = new Container()
  bridge.label = `bridge-${axis}`
  const points = axis === "x"
    ? [-48, -30, -55, -17, 48, 34, 55, 19]
    : [48, -30, 55, -17, -48, 34, -55, 19]
  const deck = new Graphics().poly(points).fill(0xb98250).stroke({ color: 0x8e613b, width: 2 })
  const rails = new Graphics()
  if (axis === "x") {
    rails.moveTo(-49, -29).lineTo(48, 20).moveTo(-54, -18).lineTo(48, 33)
  } else {
    rails.moveTo(49, -29).lineTo(-48, 20).moveTo(54, -18).lineTo(-48, 33)
  }
  rails.stroke({ color: 0x754b2d, width: 3 })
  bridge.addChild(deck, rails)
  return bridge
}

export function createTownFlowerPatch(accent: number = p.spark) {
  const patch = new Container()
  patch.label = "flower-patch"
  const leaves = new Graphics().ellipse(-7, -2, 9, 4).fill(0x579247).ellipse(5, -3, 10, 4).fill(0x6ca356)
  const flowers = new Graphics().circle(-7, -8, 3).fill(accent).circle(2, -11, 3).fill(0xffffff).circle(9, -7, 3).fill(accent)
  patch.addChild(leaves, flowers)
  return patch
}

export function createTownTree() {
  const tree = new Container()
  tree.label = "tree"
  const shadow = new Graphics().ellipse(8, 4, 26, 8).fill({ color: p.castShadow, alpha: 0.14 })
  const trunk = new Graphics().rect(-3, -18, 6, 22).fill(0x8c6239)
  const crown = new Graphics().poly([0, -52, 18, -20, 8, -22, 15, -7, 0, -14, -15, -7, -8, -22, -18, -20]).fill(0x6ca94c)
    .poly([0, -52, 0, -14, -15, -7, -8, -22, -18, -20]).fill(0x4f8e3d)
  tree.addChild(shadow, trunk, crown)
  return tree
}

export function createTownLamp() {
  const lamp = new Container()
  lamp.label = "lamp"
  const glow = new Graphics().circle(0, -31, 10).fill({ color: p.activeLight, alpha: 0.12 })
  const post = new Graphics().rect(-2, -30, 4, 33).fill(p.metal).circle(0, -31, 4).fill(p.activeLight)
  lamp.addChild(glow, post)
  return lamp
}

export function createTownPerson(color: number = 0x4d72b8) {
  const person = new Container()
  person.label = "person"
  const shadow = new Graphics().ellipse(3, 2, 10, 4).fill({ color: p.castShadow, alpha: 0.14 })
  const body = new Graphics().circle(0, -15, 3).fill(0x9d6b4c).rect(-3, -12, 6, 9).fill(color).rect(-3, -3, 2, 7).fill(p.metal).rect(1, -3, 2, 7).fill(p.metal)
  person.addChild(shadow, body)
  return person
}

export function createTownServiceVehicle(accent: number = p.orion) {
  const vehicle = new Container()
  vehicle.label = "service-vehicle"
  const shadow = new Graphics().ellipse(6, 5, 44, 12).fill({ color: p.castShadow, alpha: 0.14 })
  const body = createIsoPrism(42, 21, 14, { top: 0xf8f4e9, left: 0xdad9d4, right: 0xb9bdc0 })
  const stripe = new Graphics().poly([-21, -9, 0, 2, 21, -9, 21, -5, 0, 6, -21, -5]).fill(accent)
  const glass = new Graphics().poly([-7, -18, 3, -23, 12, -18, 2, -13]).fill(p.glass)
  vehicle.addChild(shadow, body, stripe, glass)
  return vehicle
}

export function createTownShrub() {
  const shrub = new Container()
  shrub.label = "shrub"
  const shadow = new Graphics().ellipse(5, 2, 22, 7).fill({ color: p.castShadow, alpha: 0.12 })
  const leaves = new Graphics().circle(-6, -8, 8).fill(0x5b9a46).circle(4, -11, 10).fill(0x70ae52).circle(12, -7, 7).fill(0x4f8b3e)
  shrub.addChild(shadow, leaves)
  return shrub
}

export function createTownBench() {
  const bench = new Container()
  bench.label = "bench"
  const shadow = new Graphics().ellipse(5, 4, 30, 8).fill({ color: p.castShadow, alpha: 0.12 })
  const seat = createIsoPrism(32, 12, 6, { top: 0xb87a45, left: 0x946039, right: 0x754a2d })
  const legs = new Graphics().rect(-11, 3, 3, 9).fill(p.metal).rect(8, 3, 3, 9).fill(p.metal)
  bench.addChild(shadow, seat, legs)
  return bench
}

export function createTownSign(accent: number = p.nexus) {
  const sign = new Container()
  sign.label = "project-sign"
  const shadow = new Graphics().ellipse(5, 2, 18, 6).fill({ color: p.castShadow, alpha: 0.12 })
  const post = new Graphics().rect(-2, -22, 4, 25).fill(p.metal)
  const panel = createIsoPrism(26, 10, 15, { top: p.structure, left: accent, right: 0x4b597b })
  panel.position.y = -21
  sign.addChild(shadow, post, panel)
  return sign
}
