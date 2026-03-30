import type { Application, Container } from 'pixi.js'
import type { ScaleResult } from './types.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'

export { BASE_WIDTH, BASE_HEIGHT }

/**
 * Pure function: compute letterbox scaling for a given screen size.
 * Fits BASE_WIDTH x BASE_HEIGHT into screenWidth x screenHeight,
 * adding pillarbox (side bars) or letterbox (top/bottom bars) as needed.
 */
export function computeScale(
  screenWidth: number,
  screenHeight: number,
): ScaleResult {
  const scale = Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT)
  const offsetX = (screenWidth - BASE_WIDTH * scale) / 2
  const offsetY = (screenHeight - BASE_HEIGHT * scale) / 2
  return { scale, offsetX, offsetY, screenWidth, screenHeight }
}

/**
 * Apply a ScaleResult to a PixiJS Container and renderer.
 */
export function applyScale(
  gameRoot: Container,
  app: Application,
  result: ScaleResult,
): void {
  gameRoot.scale.set(result.scale)
  gameRoot.x = result.offsetX
  gameRoot.y = result.offsetY
  app.renderer.resize(result.screenWidth, result.screenHeight)
}

/**
 * Set up responsive canvas scaling. Attaches a window resize listener
 * that recomputes scale and applies it. Returns a cleanup function.
 */
export function setupCanvas(
  app: Application,
  gameRoot: Container,
): () => void {
  const onResize = () => {
    const result = computeScale(window.innerWidth, window.innerHeight)
    applyScale(gameRoot, app, result)
  }

  // Apply initial scale
  onResize()

  window.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
  }
}
