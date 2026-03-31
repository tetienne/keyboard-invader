/** Tween state attached to a letter entity for animation. */
export interface LetterTween {
  elapsed: number
  duration: number
  type: 'hit' | 'miss' | 'bottom'
}

/** Minimal interface for tween target to avoid circular deps. */
interface TweenTarget {
  text: {
    scale: { set(x: number, y?: number): void }
    tint: number
    alpha: number
    x: number
    chars?: Array<{ tint: number }>
  }
  baseX: number
  tween: LetterTween | null
}

/** Factory: creates a hit tween (D-07: scale up + green + fade). */
export function createHitTween(): LetterTween {
  return { elapsed: 0, duration: 300, type: 'hit' }
}

/** Factory: creates a miss tween (D-08: red + shake). */
export function createMissTween(): LetterTween {
  return { elapsed: 0, duration: 200, type: 'miss' }
}

/** Factory: creates a bottom tween (D-09: fade out). */
export function createBottomTween(): LetterTween {
  return { elapsed: 0, duration: 400, type: 'bottom' }
}

/**
 * Advances tween animation by dt milliseconds.
 * Returns true if tween completed, false if still running or no tween.
 */
export function updateTween(target: TweenTarget, dt: number): boolean {
  if (!target.tween) return false
  target.tween.elapsed += dt
  const t = Math.min(target.tween.elapsed / target.tween.duration, 1)

  switch (target.tween.type) {
    case 'hit':
      // D-07: scale up 1.0 -> 1.3, tint green, alpha 1.0 -> 0.0
      target.text.scale.set(1 + 0.3 * t)
      target.text.tint = 0x4ade80
      target.text.alpha = 1 - t
      break
    case 'miss':
      // D-08: red tint + dampened horizontal shake, restore x after
      target.text.tint = 0xef4444
      target.text.x = target.baseX + Math.sin(t * Math.PI * 6) * 3 * (1 - t)
      break
    case 'bottom':
      // D-09: simple fade out
      target.text.alpha = 1 - t
      break
  }
  return t >= 1
}
