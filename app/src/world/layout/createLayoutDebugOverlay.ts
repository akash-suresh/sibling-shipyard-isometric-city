import { Container, Graphics } from "pixi.js"
import type { ProjectDefinition } from "../../data/types"
import { createIsoDiamond } from "../rendering/isometricPrimitives"
import { gridToScreen } from "../projection/isometric"
import type { TownLayout } from "./townLayout"

export function createLayoutDebugOverlay(layout: TownLayout, projects: ProjectDefinition[]) {
  const overlay = new Container()
  overlay.label = "layout-debug-grid"
  for (let x = 0; x < layout.width; x += 1) for (let y = 0; y < layout.height; y += 1) {
    const cell = createIsoDiamond(92, 44, 0xffffff, 0x425b78); cell.alpha = 0.08; cell.position.copyFrom(gridToScreen({ x, y })); overlay.addChild(cell)
  }
  const anchors = new Container(); anchors.label = "layout-prop-anchors"
  layout.decor.forEach(({ grid, offset }) => { const screen = gridToScreen(grid); const dx = offset?.x ?? 0; const dy = offset?.y ?? 0; anchors.addChild(new Graphics().moveTo(screen.x + dx - 3, screen.y + dy).lineTo(screen.x + dx + 3, screen.y + dy).moveTo(screen.x + dx, screen.y + dy - 3).lineTo(screen.x + dx, screen.y + dy + 3).stroke({ color: 0xf5f0e5, width: 1.5 })) })
  const footprints = new Container(); footprints.label = "layout-project-footprints"
  projects.forEach(({ grid }) => { const marker = createIsoDiamond(116, 58, 0x6c7bd9, 0xffffff); marker.alpha = 0.22; marker.position.copyFrom(gridToScreen(grid)); footprints.addChild(marker) })
  const routes = new Container(); routes.label = "layout-route"
  layout.routes.forEach((definition) => {
    const route = new Graphics(); route.label = `layout-route-${definition.id}`
    definition.waypoints.forEach((waypoint, index) => { const screen = gridToScreen(waypoint); if (index === 0) route.moveTo(screen.x, screen.y); else route.lineTo(screen.x, screen.y) })
    route.stroke({ color: definition.actor === "person" ? 0xffffff : 0xffdf68, width: 3, alpha: 0.82 }); routes.addChild(route)
  })
  overlay.addChild(footprints, anchors, routes)
  return overlay
}
