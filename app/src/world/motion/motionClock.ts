export type MotionMode = "play" | "paused" | "reduced"

/** Advances logical animation time only while playing, with tab-resume jumps capped. */
export function advanceMotionTime(elapsedMs: number, deltaMs: number, mode: MotionMode) {
  if (mode !== "play") return elapsedMs
  const safeDelta = Number.isFinite(deltaMs) ? Math.max(0, Math.min(50, deltaMs)) : 0
  return elapsedMs + safeDelta
}
