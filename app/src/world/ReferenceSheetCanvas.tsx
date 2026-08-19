import { Application } from "pixi.js"
import { useEffect, useRef, useState } from "react"
import { calculateReferenceSheetFit } from "./referenceSheetFit"
import { advanceMotionTime, type MotionMode } from "./motion/motionClock"
import { createReferenceSheet, type CatalogLayout, type CatalogSection } from "./rendering/createReferenceSheet"

export type CatalogMotionMode = MotionMode

export function ReferenceSheetCanvas({ motionMode, section }: { motionMode: CatalogMotionMode; section: CatalogSection }) {
  const host = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<CatalogLayout>(() => window.innerWidth < 600 ? "compact" : "wide")
  const motionModeRef = useRef(motionMode)
  motionModeRef.current = motionMode

  useEffect(() => {
    const updateLayout = () => setLayout(window.innerWidth < 600 ? "compact" : "wide")
    window.addEventListener("resize", updateLayout)
    return () => window.removeEventListener("resize", updateLayout)
  }, [])

  useEffect(() => {
    if (!host.current) return
    const mount = host.current
    const app = new Application()
    let initialized = false
    let cancelled = false
    let removeResize: () => void = () => undefined

    void app.init({ resizeTo: mount, backgroundAlpha: 0, antialias: true }).then(() => {
      initialized = true
      if (cancelled) {
        app.destroy(true, { children: true })
        return
      }
      mount.appendChild(app.canvas)
      const sheet = createReferenceSheet(section, layout)
      const fit = () => {
        const placement = calculateReferenceSheetFit(app.screen.width, app.screen.height, sheet.artboard)
        sheet.container.scale.set(placement.scale)
        sheet.container.position.set(placement.x, placement.y)
      }
      fit()
      window.addEventListener("resize", fit)
      removeResize = () => window.removeEventListener("resize", fit)
      let elapsedMs = 0
      let lastMotionMode: CatalogMotionMode | null = null
      app.ticker.add(() => {
        const mode = motionModeRef.current
        if (mode !== "play") {
          if (lastMotionMode !== mode) sheet.updateMotion(2940, mode === "reduced")
          lastMotionMode = mode
          return
        }
        lastMotionMode = mode
        elapsedMs = advanceMotionTime(elapsedMs, app.ticker.deltaMS, mode)
        sheet.updateMotion(elapsedMs, false)
      })
      sheet.updateMotion(2940, motionModeRef.current === "reduced")
      app.stage.addChild(sheet.container)
    }).catch((error: unknown) => {
      if (!cancelled) console.error("Unable to initialise the visual system", error)
    })

    return () => {
      cancelled = true
      removeResize()
      if (initialized) app.destroy(true, { children: true })
    }
  }, [layout, section])

  return <div className="canvas-host reference-canvas" ref={host} aria-hidden="true" />
}
