export interface Point {
  x: number
  y: number
}

export interface ProjectionOptions {
  tileWidth: number
  tileHeight: number
  origin: Point
}

export const defaultProjection: ProjectionOptions = {
  tileWidth: 96,
  tileHeight: 48,
  origin: { x: 0, y: 0 },
}

export function gridToScreen(grid: Point, options = defaultProjection, elevation = 0): Point {
  return {
    x: options.origin.x + (grid.x - grid.y) * (options.tileWidth / 2),
    y: options.origin.y + (grid.x + grid.y) * (options.tileHeight / 2) - elevation,
  }
}

export function depthKey(grid: Point, elevationBand = 0): number {
  return grid.x + grid.y + elevationBand / 1000
}
