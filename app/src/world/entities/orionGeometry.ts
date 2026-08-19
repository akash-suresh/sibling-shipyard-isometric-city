export interface OrionUpgradeGeometry {
  startY: number
  finalY: number
  floorWidth: number
  floorDepth: number
  floorHeight: number
}

export const orionUpgradeGeometry: OrionUpgradeGeometry = {
  startY: -20,
  finalY: -82,
  floorWidth: 96,
  floorDepth: 52,
  floorHeight: 22,
}

export function orionUpgradeY(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress))
  const eased = 1 - Math.pow(1 - clamped, 3)
  return orionUpgradeGeometry.startY + (orionUpgradeGeometry.finalY - orionUpgradeGeometry.startY) * eased
}
