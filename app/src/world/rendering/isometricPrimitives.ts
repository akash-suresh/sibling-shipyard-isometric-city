import { Container, Graphics, type PointData } from "pixi.js"
import { visualTokens as tokens } from "../../design/visualTokens"

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

export interface ContactShadowOptions {
  offset?: PointData
  alpha?: number
  contactAlpha?: number
}

/** Lower-right along the tile's east axis, so the displacement itself keeps the 2:1 projection. */
const contactShadowOffset: PointData = { x: 12, y: 6 }
/** The soft cast spreads past the footprint; the darker core stays at footprint size and barely leaves the mass. */
const castSpread = 1.14
const contactCoreOffset = 0.45

/**
 * The ground shadow for one isometric mass: a soft cast diamond displaced toward the
 * lower-right plus a darker core that hugs the footprint, so the mass grips the ground.
 */
export function createContactShadow(width: number, depth: number, options: ContactShadowOptions = {}): Container {
  const { offset = contactShadowOffset, alpha = tokens.shadow.castAlpha, contactAlpha = tokens.shadow.contactAlpha } = options
  const shadow = new Container()
  shadow.label = "contact-shadow"

  const cast = createIsoDiamond(width * castSpread, depth * castSpread, tokens.palette.castShadow)
  cast.position.set(offset.x, offset.y)
  cast.alpha = alpha

  const core = createIsoDiamond(width, depth, tokens.palette.castShadow)
  core.position.set(offset.x * contactCoreOffset, offset.y * contactCoreOffset)
  core.alpha = contactAlpha

  shadow.addChild(cast, core)
  return shadow
}
