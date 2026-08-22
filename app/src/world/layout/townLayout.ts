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
    ...Array.from({ length: 32 }, (_, index) => point(index, 12)), // Horizontal road
    ...Array.from({ length: 32 }, (_, index) => point(12, index)).filter(p => p.y !== 12), // Vertical road
  ],
  plazas: [
    // Nexus Plaza
    point(14, 4), point(15, 4), point(16, 4),
    point(14, 6), point(15, 6), point(16, 6),
    point(15, 5), point(16, 5),
  ],
  paths: [
    // Path to 1% (Orion)
    point(4, 13), point(4, 14), point(4, 15), point(4, 16), point(4, 17), point(4, 18), point(4, 19), point(5, 19), point(6, 19),
    // Path to 3 of Spades
    point(13, 19), point(14, 19), point(15, 19), point(16, 19), point(17, 19), point(18, 19), point(19, 19), point(20, 19),
    // Path connecting Nexus to road
    point(14, 7), point(14, 8), point(14, 9), point(14, 10), point(14, 11),
    point(13, 11) // connect to x=12 road
  ],
  water: Array.from({ length: 32 }, (_, y) => point(8, y)).filter(({ y }) => y !== 12),
  bridges: [{ grid: point(8, 12), axis: "x" }],
  decor: [
    // Trees along the river
    { kind: "tree", grid: point(7, 4) },
    { kind: "tree", grid: point(7, 16) }, { kind: "tree", grid: point(7, 20) },
    { kind: "tree", grid: point(9, 4) },
    { kind: "tree", grid: point(9, 16) }, { kind: "tree", grid: point(9, 20) },
    // Trees in Nexus plaza
    { kind: "tree", grid: point(14, 4) }, { kind: "tree", grid: point(14, 6) },
    // Street lamps
    { kind: "lamp", grid: point(11, 11) }, { kind: "lamp", grid: point(13, 11) },
    { kind: "lamp", grid: point(11, 13) }, { kind: "lamp", grid: point(13, 13) },
    { kind: "lamp", grid: point(8, 11) }, { kind: "lamp", grid: point(16, 11) },
  ],
  routes: [
    {
      id: "walker-1",
      actor: "person",
      waypoints: [point(16, 14), point(16, 12), point(12, 12), point(12, 6), point(13, 6)],
      durationMs: 25000,
      reducedProgress: 0.1,
      offset: point(0, 0),
    },
    {
      id: "walker-2",
      actor: "person",
      waypoints: [point(20, 15), point(20, 12), point(14, 12), point(14, 14)],
      durationMs: 22000,
      reducedProgress: 0.3,
      offset: point(-0.2, 0.2),
    },
    {
      id: "walker-3",
      actor: "person",
      waypoints: [point(14, 14), point(14, 16), point(16, 16), point(16, 14)],
      durationMs: 18000,
      reducedProgress: 0.8,
      offset: point(0.2, -0.2),
    },
    {
      id: "car-1",
      actor: "service-vehicle",
      waypoints: [point(0, 12), point(23, 12)],
      durationMs: 12000,
      reducedProgress: 0.5,
      offset: point(0, 0.25), // drive on the right side of the road
      accent: "nexus",
    },
    {
      id: "car-2",
      actor: "service-vehicle",
      waypoints: [point(23, 12), point(12, 12), point(12, 0)],
      durationMs: 15000,
      reducedProgress: 0.8,
      offset: point(0, -0.25), // drive on the right side
      accent: "orion",
    },
    {
      id: "car-3",
      actor: "service-vehicle",
      waypoints: [point(12, 23), point(12, 12), point(0, 12)],
      durationMs: 16000,
      reducedProgress: 0.2,
      offset: point(0, -0.25), // drive on the right side
      accent: "spark",
    },
    {
      id: "car-4",
      actor: "service-vehicle",
      waypoints: [point(0, 12), point(12, 12), point(12, 23)],
      durationMs: 14000,
      reducedProgress: 0.6,
      offset: point(0, 0.25), 
      accent: "nexus",
    },
    {
      id: "person-2",
      actor: "person",
      waypoints: [point(14, 4), point(16, 4), point(16, 6), point(14, 6)],
      durationMs: 22000,
      reducedProgress: 0.1,
      offset: point(0.2, 0.2),
    },
    {
      id: "person-3",
      actor: "person",
      waypoints: [point(8, 8), point(12, 8), point(12, 10), point(8, 10)],
      durationMs: 25000,
      reducedProgress: 0.5,
      offset: point(-0.2, -0.2),
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
