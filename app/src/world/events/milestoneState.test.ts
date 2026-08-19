import { describe, expect, it } from "vitest"
import { completeMilestone, startMilestone, type MilestoneState } from "./milestoneState"

describe("milestone state", () => {
  const ready: MilestoneState = { status: "ready", playCount: 0 }

  it("starts an event exactly once while it is playing", () => {
    const playing = startMilestone(ready)
    expect(startMilestone(playing)).toEqual(playing)
  })

  it("supports deterministic replay after completion", () => {
    const complete = completeMilestone(startMilestone(ready))
    expect(startMilestone(complete)).toEqual({ status: "playing", playCount: 2 })
  })
})
