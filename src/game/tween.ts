/** Tween state attached to a letter entity for animation. */
export interface LetterTween {
  elapsed: number
  duration: number
  type: 'hit' | 'miss' | 'bottom' | 'dodge' | 'escape'
}

/** Minimal interface for tween target to avoid circular deps. */
interface TweenTarget {
  container: {
    scale: { set(x: number, y?: number): void }
    alpha: number
    x: number
    y: number
  }
  baseX: number
  tween: LetterTween | null
  originalTint?: number
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

/** Factory: creates a dodge tween (alien dodging/taunting on miss). */
export function createDodgeTween(): LetterTween {
  return { elapsed: 0, duration: 400, type: 'dodge' }
}

/** Factory: creates an escape tween (alien zipping off the bottom). */
export function createEscapeTween(): LetterTween {
  return { elapsed: 0, duration: 600, type: 'escape' }
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
      // D-07: scale up 1.0 -> 1.3, alpha 1.0 -> 0.0
      target.container.scale.set(1 + 0.3 * t)
      target.container.alpha = 1 - t
      break
    case 'miss':
      // D-08: dampened horizontal shake, restore x after
      target.container.x = target.baseX + Math.sin(t * Math.PI * 6) * 3 * (1 - t)
      break
    case 'bottom':
      // D-09: simple fade out
      target.container.alpha = 1 - t
      break
    case 'dodge':
      // Quick horizontal dodge motion (alien taunting, not hurt)
      target.container.x = target.baseX + Math.sin(t * Math.PI * 4) * 20 * (1 - t)
      break
    case 'escape':
      // Accelerate downward, fade out, shrink
      target.container.alpha = 1 - t
      target.container.scale.set(1 - t * 0.5)
      break
  }
  return t >= 1
}
