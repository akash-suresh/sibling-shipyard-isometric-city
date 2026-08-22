export interface Point {
  x: number;
  y: number;
}
import type { ProjectDefinition } from "../../data/types"

export type DecorKind = "tree" | "lamp" | "shrub" | "bench" | "flowers" | "sign"
export type AccentRole = "orion" | "spark" | "nexus"
export type AmbientActorKind = "person" | "service-vehicle"

export interface DecorPlacement {
  kind: DecorKind
  grid: Point
  offset?: Point
  accent?: AccentRole
}

export interface TownLayout {
  id: string
  width: number
  height: number
  roads: Point[]
  plazas: Point[]
  paths: Point[]
  water: Point[]
  bridges: Array<{ grid: Point; axis: "x" | "y" }>
  decor: DecorPlacement[]
  routes: AmbientRoute[]
}

export interface AmbientRoute {
  id: string
  actor: AmbientActorKind
  waypoints: Point[]
  durationMs: number
  reducedProgress: number
  offset: Point
  accent?: AccentRole
}

const point = (x: number, y: number): Point => ({ x, y })

export const shipyardZeroLayout: TownLayout = {
  id: "shipyard-zero",
  width: 32,
  height: 32,
  roads: [
    // Main horizontal artery across the whole map
    ...Array.from({ length: 32 }, (_, i) => point(i, 12)),
    // A vertical road stemming from the artery and going South
    ...Array.from({ length: 20 }, (_, i) => point(20, 12 + i)).filter(p => p.y !== 12),
    // A secondary horizontal road branching East
    ...Array.from({ length: 12 }, (_, i) => point(20 + i, 22)).filter(p => p.x !== 20)
  ],
  plazas: [],
  paths: [],
  water: Array.from({ length: 32 }, (_, y) => point(8, y)).filter(({ y }) => y !== 12),
  bridges: [
    { grid: point(8, 12), axis: "x" }
  ],
  decor: [
    { kind: "tree", grid: point(18, 14) }, { kind: "tree", grid: point(18, 16) }, { kind: "tree", grid: point(18, 18) },
    { kind: "tree", grid: point(22, 14) }, { kind: "tree", grid: point(24, 14) }, { kind: "tree", grid: point(26, 14) },
    // A nice park in bottom left
    { kind: "tree", grid: point(10, 20) }, { kind: "tree", grid: point(12, 21) }, { kind: "tree", grid: point(14, 20) },
    { kind: "tree", grid: point(11, 23) }, { kind: "tree", grid: point(13, 24) }, { kind: "tree", grid: point(15, 23) },
    // Riverbank trees
    { kind: "tree", grid: point(6, 6) }, { kind: "tree", grid: point(10, 6) },
    { kind: "tree", grid: point(6, 30) }, { kind: "tree", grid: point(10, 30) }
  ],
  routes: [
    {
      id: "car-1",
      actor: "service-vehicle",
      waypoints: [point(0, 12), point(31, 12)],
      durationMs: 14000,
      reducedProgress: 0.5,
      offset: point(0, 0.25),
      accent: "nexus",
    },
    {
      id: "car-2",
      actor: "service-vehicle",
      waypoints: [point(31, 12), point(20, 12), point(20, 31)],
      durationMs: 15000,
      reducedProgress: 0.8,
      offset: point(0, -0.25),
      accent: "orion",
    },
    {
      id: "car-3",
      actor: "service-vehicle",
      waypoints: [point(20, 31), point(20, 22), point(31, 22)],
      durationMs: 12000,
      reducedProgress: 0.2,
      offset: point(-0.25, 0),
      accent: "spark",
    },
    {
      id: "drone-1",
      actor: "person",
      waypoints: [point(10, 4), point(24, 4), point(24, 20), point(10, 20), point(10, 4)],
      durationMs: 25000,
      reducedProgress: 0,
      offset: point(0, 0),
    }
  ]
}

const key = ({ x, y }: Point) => `${x},${y}`
const decorKinds: DecorKind[] = ["tree", "lamp", "shrub", "bench", "flowers", "sign"]

export function cellsAlongSegment(from: Point, to: Point): Point[] {
  if (from.x !== to.x && from.y !== to.y) throw new Error(`Route segment ${key(from)} to ${key(to)} must be orthogonal`)
  const length = Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
  const dx = Math.sign(to.x - from.x); const dy = Math.sign(to.y - from.y)
  return Array.from({ length: length + 1 }, (_, index) => ({ x: from.x + dx * index, y: from.y + dy * index }))
}

export function validateTownLayout(layout: TownLayout): TownLayout {
  if (!layout.id || !Number.isInteger(layout.width) || !Number.isInteger(layout.height) || layout.width < 1 || layout.height < 1) throw new Error("Town layout needs a valid id and size")
  const inside = (cell: Point) => Number.isInteger(cell.x) && Number.isInteger(cell.y) && cell.x >= 0 && cell.y >= 0 && cell.x < layout.width && cell.y < layout.height
  const groups = [layout.roads, layout.plazas, layout.paths, layout.water, layout.bridges.map(({ grid }) => grid)]
  groups.flat().forEach((cell) => { if (!inside(cell)) throw new Error(`Town layout cell ${key(cell)} is outside the map`) })
  const surfaces = [layout.roads, layout.plazas, layout.paths, layout.water]
  const occupied = new Set<string>()
  surfaces.forEach((cells) => cells.forEach((cell) => { const cellKey = key(cell); if (occupied.has(cellKey)) throw new Error(`Town layout has overlapping surfaces at ${cellKey}`); occupied.add(cellKey) }))
  const roadKeys = new Set(layout.roads.map(key)); const waterKeys = new Set(layout.water.map(key)); const bridgeKeys = new Set(layout.bridges.map(({ grid }) => key(grid)))
  layout.bridges.forEach(({ grid, axis }) => {
    if ((axis !== "x" && axis !== "y") || !roadKeys.has(key(grid))) throw new Error(`Bridge ${key(grid)} must occupy a road cell`)
    const banks = axis === "x" ? [{ x: grid.x, y: grid.y - 1 }, { x: grid.x, y: grid.y + 1 }] : [{ x: grid.x - 1, y: grid.y }, { x: grid.x + 1, y: grid.y }]
    if (!banks.every((cell) => waterKeys.has(key(cell)))) throw new Error(`Bridge ${key(grid)} must cross water`)
  })
  layout.decor.forEach(({ kind, grid }) => { if (!decorKinds.includes(kind)) throw new Error(`Unknown town decor kind: ${kind}`); if (!inside(grid)) throw new Error(`Town decor ${key(grid)} is outside the map`); if (waterKeys.has(key(grid))) throw new Error(`Town decor cannot occupy water at ${key(grid)}`) })
  const routeIds = new Set<string>()
  layout.routes.forEach((route) => {
    if (!route.id || routeIds.has(route.id)) throw new Error(`Town route id is missing or duplicated: ${route.id}`); routeIds.add(route.id)
    if (!(["person", "service-vehicle"] as AmbientActorKind[]).includes(route.actor) || route.waypoints.length < 2 || route.waypoints.some((cell) => !inside(cell)) || !Number.isFinite(route.durationMs) || route.durationMs <= 0 || route.reducedProgress < 0 || route.reducedProgress > 1) throw new Error(`Town ${route.id} route is invalid`)
    const cells = route.waypoints.slice(1).flatMap((to, index) => cellsAlongSegment(route.waypoints[index], to).slice(1))
    if (route.actor === "service-vehicle" && cells.some((cell) => !roadKeys.has(key(cell)) && !bridgeKeys.has(key(cell)))) throw new Error("Town vehicle route must stay on roads")
    if (route.actor === "person" && cells.some((cell) => waterKeys.has(key(cell)) && !bridgeKeys.has(key(cell)))) throw new Error("Town walker route cannot cross water")
  })
  return layout
}

export function validateProjectPlacements(layout: TownLayout, projects: ProjectDefinition[]) {
  const blocked = new Set([...layout.roads, ...layout.water].map(key))
  projects.forEach((project) => {
    if (project.grid.x < 0 || project.grid.y < 0 || project.grid.x >= layout.width || project.grid.y >= layout.height) throw new Error(`Project ${project.id} is outside the town`)
    if (blocked.has(key(project.grid))) throw new Error(`Project ${project.id} occupies non-buildable terrain`)
  })
  return projects
}

validateTownLayout(shipyardZeroLayout)
