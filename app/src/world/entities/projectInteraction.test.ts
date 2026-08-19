import { Container } from "pixi.js"
import { describe, expect, it, vi } from "vitest"
import { createProjectInteractionChrome } from "./projectInteraction"

describe("project interaction chrome", () => {
  it("resolves default, hover, and selected states without moving its anchor", () => {
    const chrome = createProjectInteractionChrome("Test", 120, 60, 52)
    const diamond = chrome.ground.getChildByLabel("interaction-diamond")
    const brackets = chrome.ground.getChildByLabel("interaction-brackets")

    expect(diamond?.alpha).toBe(0)
    expect(chrome.label.alpha).toBe(0)

    chrome.setState("hover")
    expect(diamond?.alpha).toBe(0.1)
    expect(brackets?.alpha).toBe(0.45)
    expect(chrome.label.alpha).toBe(1)
    expect(chrome.ground.position.x).toBe(0)
    expect(chrome.ground.position.y).toBe(0)

    chrome.setState("selected")
    expect(diamond?.alpha).toBe(0.16)
    expect(brackets?.alpha).toBe(1)
    expect(chrome.label.alpha).toBe(1)
  })

  it("keeps selected chrome after pointer hover ends", () => {
    const chrome = createProjectInteractionChrome("Test", 120, 60, 52)
    const target = new Container()
    chrome.bind(target, "test", vi.fn())
    chrome.setSelected(true)
    target.emit("pointerover", undefined as never)
    target.emit("pointerout", undefined as never)

    expect(chrome.ground.getChildByLabel("interaction-diamond")?.alpha).toBe(0.16)
    expect(chrome.ground.getChildByLabel("interaction-brackets")?.alpha).toBe(1)
    expect(chrome.label.alpha).toBe(1)
    expect(target.scale.x).toBe(1)
  })

  it("forwards taps through the shared binding", () => {
    const onSelect = vi.fn()
    const chrome = createProjectInteractionChrome("Test", 120, 60, 52)
    const target = new Container()
    chrome.bind(target, "orion", onSelect)
    target.emit("pointertap", undefined as never)
    expect(onSelect).toHaveBeenCalledWith("orion")
  })
})
