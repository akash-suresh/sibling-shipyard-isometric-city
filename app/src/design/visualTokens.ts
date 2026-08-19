import { defaultProjection } from "../world/projection/isometric"

export const visualTokens = {
  projection: {
    tileWidth: defaultProjection.tileWidth,
    tileHeight: defaultProjection.tileHeight,
    floorHeight: 24,
    curbHeight: 4,
  },
  palette: {
    ink: 0x26384d,
    mutedInk: 0x667589,
    canvas: 0xf2efe7,
    structure: 0xfffbf0,
    structureMid: 0xe8e4d9,
    structureShadow: 0xc9c8c2,
    grassLight: 0xb7d9a7,
    grassDark: 0xaed29e,
    grassSeam: 0x9ac08d,
    road: 0xb8bdc3,
    cliff: 0xd8cba9,
    water: 0x7fcad0,
    glass: 0x96c7d8,
    metal: 0x45536a,
    castShadow: 0x24364b,
    crane: 0xe5a84b,
    craneShadow: 0x9c7841,
    activeLight: 0xffdf68,
    selection: 0x6c7bd9,
    orion: 0xef8354,
    spark: 0xf4c95d,
    nexus: 0x6c7bd9,
  },
  scale: {
    personHeight: 18,
    treeHeight: 42,
    vehicleLength: 54,
    vehicleHeight: 24,
    craneHeight: 104,
    standardFootprintTiles: 2,
  },
  shadow: {
    castAlpha: 0.16,
    contactAlpha: 0.22,
    direction: "lower-right",
  },
  motion: {
    hoverMs: 140,
    cameraMs: 650,
    constructionMs: 1500,
  },
} as const

export function hexColor(value: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid color: ${value}`)
  return Number.parseInt(value.slice(1), 16)
}
