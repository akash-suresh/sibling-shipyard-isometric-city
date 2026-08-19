import { Application, Container, FederatedPointerEvent } from "pixi.js"
import { useEffect, useRef } from "react"
import { visualTokens as tokens } from "../design/visualTokens"
import type { BuildingModuleKind, ProjectDefinition } from "../data/types"
import { createWorld, type WorldController } from "./rendering/createWorld"
import { advanceMotionTime } from "./motion/motionClock"

interface Props {
  projects: ProjectDefinition[]
  selectedProjectId: string | null
  milestoneProjectId: string
  milestoneResultingModules: BuildingModuleKind[]
  milestonePlayCount: number
  onSelect: (id: string) => void
  onMilestoneComplete: () => void
}

export function ShipyardCanvas({ projects, selectedProjectId, milestoneProjectId, milestoneResultingModules, milestonePlayCount, onSelect, onMilestoneComplete }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const controllerRef = useRef<WorldController | null>(null)
  const cameraTweenRef = useRef<{
    from: { x: number; y: number; scale: number }
    to: { x: number; y: number; scale: number }
    elapsedMs: number
    durationMs: number
  } | null>(null)
  const eventCleanupRef = useRef<(() => void) | null>(null)
  const selectedProjectIdRef = useRef(selectedProjectId)
  selectedProjectIdRef.current = selectedProjectId

  useEffect(() => {
    if (!host.current) return
    const mount = host.current
    const app = new Application()
    let cancelled = false
    let initialized = false
    let dragging = false
    let previous = { x: 0, y: 0 }
    let world: Container | undefined

    void app.init({ resizeTo: mount, backgroundAlpha: 0, antialias: true }).then(() => {
      initialized = true
      if (cancelled) {
        app.destroy(true, { children: true })
        return
      }
      mount.appendChild(app.canvas)
      const controller = createWorld(projects, onSelect)
      world = controller.container
      world.position.set(app.screen.width / 2, Math.max(145, app.screen.height * 0.26))
      world.scale.set(Math.min(1, app.screen.width / 760))
      app.stage.addChild(world)
      app.stage.eventMode = "static"
      app.stage.hitArea = app.screen
      appRef.current = app
      controllerRef.current = controller
      controller.setSelectedProject(selectedProjectIdRef.current)
      const initialSelected = selectedProjectIdRef.current
      const initialTarget = initialSelected ? controller.getProjectPosition(initialSelected) : undefined
      if (initialTarget) {
        const nextScale = Math.max(1, Math.min(1.18, app.screen.width / 700))
        cameraTweenRef.current = {
          from: { x: world.x, y: world.y, scale: world.scale.x },
          to: {
            x: app.screen.width * (app.screen.width < 720 ? 0.5 : 0.4) - initialTarget.x * nextScale,
            y: app.screen.height * 0.5 - initialTarget.y * nextScale,
            scale: nextScale,
          },
          elapsedMs: 0,
          durationMs: matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : tokens.motion.cameraMs,
        }
      }
      const reducedWorldMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
      let worldElapsedMs = 0
      app.ticker.add(() => {
        worldElapsedMs = advanceMotionTime(worldElapsedMs, app.ticker.deltaMS, reducedWorldMotion ? "reduced" : "play")
        controller.updateMotion(worldElapsedMs, reducedWorldMotion)
        const tween = cameraTweenRef.current
        if (tween) {
          tween.elapsedMs += app.ticker.deltaMS
          const progress = Math.min(1, tween.elapsedMs / tween.durationMs)
          const eased = 1 - Math.pow(1 - progress, 3)
          world?.position.set(tween.from.x + (tween.to.x - tween.from.x) * eased, tween.from.y + (tween.to.y - tween.from.y) * eased)
          world?.scale.set(tween.from.scale + (tween.to.scale - tween.from.scale) * eased)
          if (progress >= 1) cameraTweenRef.current = null
        }
      })

      app.stage.on("pointerdown", (event: FederatedPointerEvent) => {
        dragging = true
        previous = { x: event.global.x, y: event.global.y }
      })
      app.stage.on("pointermove", (event: FederatedPointerEvent) => {
        if (!dragging || !world) return
        world.x += event.global.x - previous.x
        world.y += event.global.y - previous.y
        previous = { x: event.global.x, y: event.global.y }
      })
      app.stage.on("pointerup", () => { dragging = false })
      app.stage.on("pointerupoutside", () => { dragging = false })

      const onWheel = (event: WheelEvent) => {
        event.preventDefault()
        if (!world) return
        const next = Math.min(1.35, Math.max(0.55, world.scale.x * (event.deltaY > 0 ? 0.92 : 1.08)))
        world.scale.set(next)
      }
      app.canvas.addEventListener("wheel", onWheel, { passive: false })
    }).catch((error: unknown) => {
      if (!cancelled) console.error("Unable to initialise the Shipyard renderer", error)
    })

    return () => {
      cancelled = true
      cameraTweenRef.current = null
      eventCleanupRef.current?.()
      controllerRef.current?.destroy()
      controllerRef.current = null
      appRef.current = null
      if (initialized) app.destroy(true, { children: true })
    }
  }, [projects, onSelect])

  useEffect(() => {
    const app = appRef.current
    const controller = controllerRef.current
    if (!app || !controller) return
    controller.setSelectedProject(selectedProjectId)
    if (!selectedProjectId) {
      cameraTweenRef.current = null
      return
    }
    const target = controller.getProjectPosition(selectedProjectId)
    if (!target) return

    const world = controller.container
    const from = { x: world.x, y: world.y, scale: world.scale.x }
    const nextScale = Math.max(1, Math.min(1.18, app.screen.width / 700))
    const to = {
      x: app.screen.width * (app.screen.width < 720 ? 0.5 : 0.4) - target.x * nextScale,
      y: app.screen.height * 0.5 - target.y * nextScale,
      scale: nextScale,
    }
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reducedMotion ? 1 : tokens.motion.cameraMs
    cameraTweenRef.current = { from, to, elapsedMs: 0, durationMs: duration }
  }, [selectedProjectId, milestonePlayCount])

  useEffect(() => {
    if (milestonePlayCount < 1) return
    const controller = controllerRef.current
    if (!controller) return
    eventCleanupRef.current?.()
    eventCleanupRef.current = controller.playConstructionUpgrade(
      milestoneProjectId,
      milestoneResultingModules,
      matchMedia("(prefers-reduced-motion: reduce)").matches,
      onMilestoneComplete,
    )
  }, [milestoneProjectId, milestoneResultingModules, milestonePlayCount, onMilestoneComplete])

  return <div className="canvas-host" ref={host} aria-hidden="true" />
}
