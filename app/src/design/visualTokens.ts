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
    road: 0x626a72,
    roadSeam: 0x555d65,
    roadMarking: 0xeee6d1,
    plaza: 0xd8cfbd,
    plazaSeam: 0xbfb5a5,
    sidewalk: 0xc8b996,
    sidewalkSeam: 0xaea17f,
    curb: 0xdedbd2,
    curbFace: 0xbdbab1,
    concrete: 0xc2c4bf,
    concreteMid: 0xa6a9a3,
    concreteShadow: 0x8a8d87,
    hedge: 0x5b9a46,
    hedgeShadow: 0x477a36,
    cliff: 0xd8cba9,
    soil: 0x7d6a4f,
    rock: 0x5f5647,
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
    craneHeight: 150,
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
