export type MilestoneStatus = "ready" | "playing" | "complete"

export interface MilestoneState {
  status: MilestoneStatus
  playCount: number
}

export function startMilestone(state: MilestoneState): MilestoneState {
  if (state.status === "playing") return state
  return { status: "playing", playCount: state.playCount + 1 }
}

export function completeMilestone(state: MilestoneState): MilestoneState {
  if (state.status !== "playing") return state
  return { ...state, status: "complete" }
}
