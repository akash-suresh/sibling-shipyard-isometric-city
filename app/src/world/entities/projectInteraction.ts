import { Container, Graphics, Text } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"
import { createIsoDiamond } from "../rendering/isometricPrimitives"

const p = tokens.palette

export type ProjectInteractionState = "default" | "hover" | "selected"

export interface ProjectInteractionChrome {
  ground: Container
  label: Text
  setHovered: (hovered: boolean) => void
  setSelected: (selected: boolean) => void
  setState: (state: ProjectInteractionState) => void
  bind: (target: Container, projectId: string, onSelect: (id: string) => void) => void
}

/** Shared hover/selection treatment. Ground remains anchor-stable; selection adds corner brackets as a non-colour cue. */
export function createProjectInteractionChrome(name: string, width: number, depth: number, labelY: number): ProjectInteractionChrome {
  const ground = new Container()
  ground.label = "interaction-ground"
  const diamond = createIsoDiamond(width, depth, p.selection, p.selection)
  diamond.label = "interaction-diamond"
  diamond.alpha = 0
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const brackets = new Graphics()
    .moveTo(-halfWidth, 0).lineTo(-halfWidth + 13, -halfDepth * 0.27)
    .moveTo(halfWidth, 0).lineTo(halfWidth - 13, halfDepth * 0.27)
    .moveTo(0, -halfDepth).lineTo(13, -halfDepth + 7)
    .moveTo(0, halfDepth).lineTo(-13, halfDepth - 7)
    .stroke({ color: p.selection, width: 3 })
  brackets.alpha = 0
  brackets.label = "interaction-brackets"
  ground.addChild(diamond, brackets)

  const label = new Text({ text: name, style: { fill: p.ink, fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: "700" } })
  label.label = "interaction-label"
  label.anchor.set(0.5)
  label.position.set(0, labelY)
  label.alpha = 0

  let hovered = false
  let selected = false
  let boundTarget: Container | null = null

  const render = () => {
    diamond.alpha = selected ? 0.16 : hovered ? 0.1 : 0
    brackets.alpha = selected ? 1 : hovered ? 0.45 : 0
    label.alpha = selected || hovered ? 1 : 0
    boundTarget?.scale.set(hovered && !selected ? 1.02 : 1)
  }

  const setHovered = (value: boolean) => { hovered = value; render() }
  const setSelected = (value: boolean) => { selected = value; render() }
  const setState = (state: ProjectInteractionState) => {
    hovered = state === "hover"
    selected = state === "selected"
    render()
  }
  const bind = (target: Container, projectId: string, onSelect: (id: string) => void) => {
    boundTarget = target
    target.eventMode = "static"
    target.cursor = "pointer"
    target.on("pointerover", () => setHovered(true))
    target.on("pointerout", () => setHovered(false))
    target.on("pointertap", () => onSelect(projectId))
    render()
  }

  return { ground, label, setHovered, setSelected, setState, bind }
}
