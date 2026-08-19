export const REFERENCE_SHEET_SIZE = { width: 800, height: 620 } as const

export interface ReferenceSheetFit {
  scale: number
  x: number
  y: number
}

/**
 * Fits the catalog artboard into the Pixi viewport while preserving the
 * current compact spacing and minimum legibility scale.
 */
export function calculateReferenceSheetFit(viewportWidth: number, viewportHeight: number, artboard: { width: number; height: number } = REFERENCE_SHEET_SIZE): ReferenceSheetFit {
  const compact = viewportWidth < 600
  const side = compact ? 20 : 44
  const top = compact ? 170 : 165
  const availableWidth = viewportWidth - side * 2
  const availableHeight = viewportHeight - top - 24
  const scale = Math.min(
    availableWidth / artboard.width,
    availableHeight / artboard.height,
    1,
  )

  return {
    scale: Math.max(0.1, scale),
    x: Math.max(side, (viewportWidth - artboard.width * Math.max(0.1, scale)) / 2),
    y: top,
  }
}
