import { Container } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"
import type { AmbientRoute } from "../layout/townLayout"
import { sampleRoute } from "../motion/sampleRoute"
import { depthKey, gridToScreen } from "../projection/isometric"
import { createTownPerson, createTownServiceVehicle } from "./townComponents"

const p = tokens.palette

export interface AmbientRouteActorController {
  container: Container
  updateMotion: (elapsedMs: number, reducedMotion: boolean) => void
}

export function createAmbientRouteActor(route: AmbientRoute): AmbientRouteActorController {
  const accent = route.accent ? p[route.accent] : undefined
  const actor = route.actor === "person" ? createTownPerson(accent) : createTownServiceVehicle(accent)
  actor.label = `route-actor-${route.id}`
  const updateMotion = (elapsedMs: number, reducedMotion: boolean) => {
    const progress = reducedMotion ? route.reducedProgress : (elapsedMs % route.durationMs) / route.durationMs
    const gridPoint = sampleRoute(route.waypoints, progress)
    const point = gridToScreen(gridPoint)
    actor.position.set(point.x + route.offset.x, point.y + route.offset.y)
    actor.zIndex = depthKey(gridPoint, 20)
  }
  updateMotion(0, true)
  return { container: actor, updateMotion }
}
