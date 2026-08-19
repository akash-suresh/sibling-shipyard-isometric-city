import { Container, Graphics } from "pixi.js"

export interface IsoFaceColors {
  top: number
  left: number
  right: number
  stroke?: number
}

export function createIsoPrism(width: number, depth: number, height: number, colors: IsoFaceColors) {
  const prism = new Container()
  const faces = new Graphics()
  const halfWidth = width / 2
  const halfDepth = depth / 2

  faces.poly([0, -height - halfDepth, halfWidth, -height, 0, -height + halfDepth, -halfWidth, -height]).fill(colors.top)
  faces.poly([-halfWidth, -height, 0, -height + halfDepth, 0, halfDepth, -halfWidth, 0]).fill(colors.left)
  faces.poly([halfWidth, -height, 0, -height + halfDepth, 0, halfDepth, halfWidth, 0]).fill(colors.right)
  if (colors.stroke !== undefined) {
    faces
      .moveTo(0, -height - halfDepth).lineTo(halfWidth, -height).lineTo(halfWidth, 0)
      .lineTo(0, halfDepth).lineTo(-halfWidth, 0).lineTo(-halfWidth, -height)
      .closePath().stroke({ color: colors.stroke, width: 1 })
  }
  prism.addChild(faces)
  return prism
}

export function createIsoDiamond(width: number, depth: number, fill: number, stroke?: number) {
  const shape = new Graphics().poly([0, -depth / 2, width / 2, 0, 0, depth / 2, -width / 2, 0]).fill(fill)
  if (stroke !== undefined) shape.stroke({ color: stroke, width: 1 })
  return shape
}

export function createCastShadow(width: number, height: number, color: number, alpha: number) {
  const shadow = new Graphics().ellipse(14, 8, width, height).fill({ color, alpha })
  shadow.rotation = -0.12
  return shadow
}
