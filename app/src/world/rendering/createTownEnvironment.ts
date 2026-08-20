import { Container, Graphics } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createTownBench, createTownBridge, createTownCurb, createTownEdge, createTownFlowerPatch, createTownLamp, createTownShrub, createTownSign, createTownTile, createTownTree, type PavedSurface, type RoadDirection } from "../entities/townComponents"
import { shipyardZeroLayout, validateTownLayout, type DecorPlacement, type TownLayout } from "../layout/townLayout"
import { gridToScreen } from "../projection/isometric"

const p = tokens.palette
const cellKey = (x: number, y: number) => `${x},${y}`

function roadConnections(x: number, y: number, roads: Set<string>): RoadDirection[] {
  const neighbors: Array<[RoadDirection, number, number]> = [["east", x + 1, y], ["south", x, y + 1], ["west", x - 1, y], ["north", x, y - 1]]
  return neighbors.filter(([, nextX, nextY]) => roads.has(cellKey(nextX, nextY))).map(([direction]) => direction)
}

/** Asphalt sits lowest; pedestrian surfaces sit on the raised lip above it. */
const curbLevel: Record<PavedSurface, number> = { road: 0, plaza: 1, path: 1 }

/**
 * Inverse of the road scan. Exactly one cell owns each boundary: the raised surface owns a
 * level change, any paved surface owns its edge against open ground, and water boundaries
 * are left to the bank treatment.
 */
function curbEdges(x: number, y: number, paved: Map<string, PavedSurface>, water: Set<string>): RoadDirection[] {
  const surface = paved.get(cellKey(x, y))
  if (!surface) return []
  const neighbors: Array<[RoadDirection, number, number]> = [["north", x, y - 1], ["east", x + 1, y], ["south", x, y + 1], ["west", x - 1, y]]
  return neighbors
    .filter(([, nextX, nextY]) => {
      const neighborKey = cellKey(nextX, nextY)
      if (water.has(neighborKey)) return false
      const neighbor = paved.get(neighborKey)
      return neighbor ? curbLevel[surface] > curbLevel[neighbor] : true
    })
    .map(([direction]) => direction)
}

function decorFactory(placement: DecorPlacement) {
  const accent = placement.accent ? p[placement.accent] : undefined
  if (placement.kind === "tree") return createTownTree()
  if (placement.kind === "lamp") return createTownLamp()
  if (placement.kind === "shrub") return createTownShrub()
  if (placement.kind === "bench") return createTownBench()
  if (placement.kind === "flowers") return createTownFlowerPatch(accent)
  return createTownSign(accent)
}

function createIslandCliff(layout: TownLayout) {
  const cliff = new Graphics()
  const rightCenter = gridToScreen({ x: layout.width - 1, y: 0 })
  const bottomCenter = gridToScreen({ x: layout.width - 1, y: layout.height - 1 })
  const leftCenter = gridToScreen({ x: 0, y: layout.height - 1 })
  const right = { x: rightCenter.x + 48, y: rightCenter.y }
  const bottom = { x: bottomCenter.x, y: bottomCenter.y + 24 }
  const left = { x: leftCenter.x - 48, y: leftCenter.y }
  cliff.poly([left.x, left.y, bottom.x, bottom.y, bottom.x, bottom.y + 38, left.x, left.y + 38]).fill(0xb09d7f)
  cliff.poly([right.x, right.y, bottom.x, bottom.y, bottom.x, bottom.y + 38, right.x, right.y + 38]).fill(0x8e806c)
  cliff.poly([left.x, left.y + 25, bottom.x, bottom.y + 25, bottom.x, bottom.y + 38, left.x, left.y + 38]).fill(0x718069)
  cliff.label = `island-${layout.id}`
  return cliff
}

export function createTownEnvironment(layout: TownLayout = shipyardZeroLayout) {
  validateTownLayout(layout)
  const environment = new Container()
  environment.label = `town-layout-${layout.id}`
  environment.sortableChildren = true
  environment.addChild(createIslandCliff(layout))

  const roadCells = new Set(layout.roads.map(({ x, y }) => cellKey(x, y)))
  const plazaCells = new Set(layout.plazas.map(({ x, y }) => cellKey(x, y)))
  const pathCells = new Set(layout.paths.map(({ x, y }) => cellKey(x, y)))
  const waterCells = new Set(layout.water.map(({ x, y }) => cellKey(x, y)))
  const pavedCells = new Map<string, PavedSurface>()
  layout.plazas.forEach(({ x, y }) => pavedCells.set(cellKey(x, y), "plaza"))
  layout.paths.forEach(({ x, y }) => pavedCells.set(cellKey(x, y), "path"))
  layout.roads.forEach(({ x, y }) => pavedCells.set(cellKey(x, y), "road"))
  const terrain = new Container(); terrain.label = "layout-terrain"; terrain.zIndex = 0
  for (let x = 0; x < layout.width; x += 1) {
    for (let y = 0; y < layout.height; y += 1) {
      const point = gridToScreen({ x, y }); const key = cellKey(x, y)
      const kind = waterCells.has(key) ? "water" : roadCells.has(key) ? "road" : plazaCells.has(key) ? "plaza" : pathCells.has(key) ? "path" : (x * 3 + y * 5) % 11 === 0 ? "grass-accent" : "grass"
      const tile = createTownTile(kind, kind === "road" ? roadConnections(x, y, roadCells) : [])
      tile.position.copyFrom(point); terrain.addChild(tile)
      const surface = pavedCells.get(key)
      if (surface) {
        const edges = curbEdges(x, y, pavedCells, waterCells)
        if (edges.length > 0) { const curb = createTownCurb({ edges, surface }); curb.position.copyFrom(point); terrain.addChild(curb) }
      }
      if (kind === "water") {
        const edges: RoadDirection[] = ["east", "west"]
        if (y === 0) edges.push("north"); if (y === layout.height - 1) edges.push("south")
        edges.forEach((direction) => { const edge = createTownEdge(direction); edge.position.copyFrom(point); terrain.addChild(edge) })
      }
    }
  }
  environment.addChild(terrain)

  const sortedBridges = [...layout.bridges].sort((a, b) => a.grid.x + a.grid.y - b.grid.x - b.grid.y || a.axis.localeCompare(b.axis))
  sortedBridges.forEach(({ grid, axis }) => {
    const bridge = createTownBridge(axis); bridge.position.copyFrom(gridToScreen(grid)); bridge.zIndex = 1; environment.addChild(bridge)
  })

  const decor = new Container(); decor.label = "layout-decor"; decor.sortableChildren = true; decor.zIndex = 5
  const sortedDecor = [...layout.decor].sort((a, b) => a.grid.x + a.grid.y - b.grid.x - b.grid.y || a.grid.x - b.grid.x || a.grid.y - b.grid.y || a.kind.localeCompare(b.kind))
  sortedDecor.forEach((placement) => {
    const item = decorFactory(placement); const screen = gridToScreen(placement.grid); const offset = placement.offset ?? { x: 0, y: 0 }
    item.position.set(screen.x + offset.x, screen.y + offset.y); item.zIndex = placement.grid.x + placement.grid.y + 0.2; decor.addChild(item)
  })
  environment.addChild(decor)
  return environment
}
