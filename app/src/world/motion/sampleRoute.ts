export type RoutePoint = Readonly<{ x: number; y: number }>

/** Samples a waypoint route with equal time assigned to each segment. */
export function sampleRoute(route: readonly RoutePoint[], progress: number): RoutePoint {
  if (route.length < 2) throw new Error("A motion route needs at least two points")

  const phase = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0))
  const scaled = phase * (route.length - 1)
  const segment = Math.min(route.length - 2, Math.floor(scaled))
  const local = scaled - segment
  const start = route[segment]
  const end = route[segment + 1]

  return {
    x: start.x + (end.x - start.x) * local,
    y: start.y + (end.y - start.y) * local,
  }
}
