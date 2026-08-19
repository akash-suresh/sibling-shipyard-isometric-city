import type { Point } from "../projection/isometric"
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
  width: 10,
  height: 9,
  roads: [
    ...Array.from({ length: 8 }, (_, index) => point(index + 1, 4)),
    ...Array.from({ length: 4 }, (_, index) => point(5, index + 5)),
    point(7, 2), point(7, 3),
  ],
  plazas: [point(2, 5), point(3, 6), point(6, 6), point(7, 5), point(5, 2), point(6, 2)],
  // Sidewalks only where a pedestrian actually needs one: Orion's frontage walk off the main
  // road, and the two walker-route cells that would otherwise be grass between paved surfaces.
  paths: [point(1, 5), point(1, 6), point(3, 5), point(6, 5)],
  water: Array.from({ length: 9 }, (_, y) => point(4, y)).filter(({ y }) => y !== 4),
  bridges: [{ grid: point(4, 4), axis: "x" }],
  decor: [
    { kind: "tree", grid: point(0, 4), offset: point(7, -3) }, { kind: "tree", grid: point(1, 2), offset: point(-10, 0) },
    { kind: "tree", grid: point(3, 1), offset: point(8, -2) }, { kind: "tree", grid: point(7, 1), offset: point(5, -2) },
    { kind: "tree", grid: point(8, 3), offset: point(-7, 1) }, { kind: "tree", grid: point(8, 7), offset: point(3, 0) },
    { kind: "tree", grid: point(3, 8), offset: point(-7, 0) }, { kind: "tree", grid: point(1, 7), offset: point(5, 0) },
    { kind: "lamp", grid: point(3, 5), offset: point(22, -6) }, { kind: "lamp", grid: point(5, 4), offset: point(22, -6) }, { kind: "lamp", grid: point(6, 5), offset: point(22, -6) },
    { kind: "shrub", grid: point(3, 3), offset: point(-16, 4) }, { kind: "shrub", grid: point(6, 3), offset: point(18, 3) },
    { kind: "shrub", grid: point(6, 7), offset: point(17, 4) }, { kind: "shrub", grid: point(3, 7), offset: point(-15, 3) },
    { kind: "bench", grid: point(3, 4), offset: point(-8, -10) }, { kind: "bench", grid: point(7, 4), offset: point(12, 9) },
    { kind: "flowers", grid: point(3, 2), offset: point(-12, 7), accent: "spark" }, { kind: "flowers", grid: point(5, 7), offset: point(15, 8), accent: "orion" },
    { kind: "sign", grid: point(3, 6), offset: point(20, -9), accent: "orion" }, { kind: "sign", grid: point(6, 6), offset: point(-20, 7), accent: "spark" },
    { kind: "sign", grid: point(6, 2), offset: point(16, 5), accent: "nexus" },
  ],
  routes: [
    { id: "town-walker", actor: "person", waypoints: [point(3, 5), point(3, 4), point(5, 4), point(5, 5), point(6, 5), point(5, 5), point(5, 4), point(3, 4), point(3, 5)], durationMs: 6200, reducedProgress: 0.35, offset: point(0, -7) },
    { id: "service-loop", actor: "service-vehicle", waypoints: [point(1, 4), point(8, 4), point(7, 4), point(7, 2), point(7, 4), point(5, 4), point(5, 8), point(5, 4), point(1, 4)], durationMs: 10500, reducedProgress: 0.62, offset: point(0, -5), accent: "orion" },
  ],
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
