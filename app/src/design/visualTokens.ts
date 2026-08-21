export const visualTokens = {
  palette: {
    ink: 0x26384d,
    mutedInk: 0x667589,
    canvas: 0xfdfbf7, // Warm, bright cream background
    structure: 0xffffff, // Stark white for buildings
    structureMid: 0xf0f2f5,
    structureShadow: 0xd9dee8, // Cool blueish shadows
    grassLight: 0x8BC34A, // Saturated synthetic green
    grassDark: 0x7CB342,
    grassSeam: 0x689F38,
    road: 0x4a5568, // Dark blue-grey asphalt
    roadSeam: 0x2d3748,
    roadMarking: 0xffffff,
    plaza: 0xe2e8f0, // Crisp light grey plaza
    plazaSeam: 0xcbd5e1,
    sidewalk: 0xf1f5f9,
    sidewalkSeam: 0xe2e8f0,
    curb: 0xcbd5e1,
    curbFace: 0x94a3b8,
    concrete: 0xf8fafc,
    concreteMid: 0xe2e8f0,
    concreteShadow: 0x94a3b8,
    hedge: 0x4CAF50, // Vivid green for trees/hedges
    hedgeShadow: 0x388E3C,
    cliff: 0xd9854c, // Vivid terracotta/orange dirt
    soil: 0xc87137, // Richer dirt
    rock: 0x8c6b5d,
    water: 0x00bcd4, // Glowing cyan water
    glass: 0x2196f3, // Vivid blue glass
    metal: 0x64748b,
    castShadow: 0x1e293b,
    crane: 0xffeb3b, // Bright primary yellow
    craneShadow: 0xfbc02d,
    activeLight: 0xffea00,
    selection: 0x6c7bd9,
    orion: 0xff5722, // Vivid orange
    spark: 0xffc107, // Vivid yellow
    nexus: 0x2962ff, // Vivid blue
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
