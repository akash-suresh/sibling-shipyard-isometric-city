import { Container } from "pixi.js"
import { createAmbientRouteActor } from "../entities/createAmbientRouteActor"
import { shipyardZeroLayout, type TownLayout } from "../layout/townLayout"

export function createAmbientLife(layout: TownLayout = shipyardZeroLayout) {
  const layer = new Container()
  layer.label = `ambient-${layout.id}`
  layer.sortableChildren = true
  layer.zIndex = 20
  const actors = layout.routes.map(createAmbientRouteActor)
  layer.addChild(...actors.map(({ container }) => container))

  const updateMotion = (elapsedMs: number, reducedMotion: boolean) => actors.forEach((actor) => actor.updateMotion(elapsedMs, reducedMotion))
  updateMotion(0, true)
  return { container: layer, entities: actors.map(({ container }) => container), updateMotion }
}
