import type { AlienContainer } from './alien-container.js'
import type { LetterTween } from './tween.js'

// Keyboard row constants (D-04)
export const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l'] as const
export const TOP_ROW = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'] as const
export const BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm'] as const

/**
 * Returns available letters based on complexity level.
 * Level 0: home row only, level 1: +top row, level 2+: all rows.
 */
export function getAvailableLetters(
  complexityLevel: number,
): readonly string[] {
  if (complexityLevel <= 0) return HOME_ROW
  if (complexityLevel === 1) return [...HOME_ROW, ...TOP_ROW]
  return [...HOME_ROW, ...TOP_ROW, ...BOTTOM_ROW]
}

/** A falling letter entity managed by PlayingState. */
export interface LetterEntity {
  readonly container: AlienContainer
  readonly poolIndex: number
  letter: string
  baseX: number
  originalTint: number
  tween: LetterTween | null
  markedForRemoval: boolean
}

/**
 * Finds the matching letter entity closest to the bottom of the screen.
 * Skips entities with active tweens or marked for removal.
 */
export function findLowestMatch(
  active: readonly LetterEntity[],
  key: string,
): LetterEntity | null {
  let best: LetterEntity | null = null
  for (const entity of active) {
    if (
      entity.letter === key &&
      entity.tween === null &&
      !entity.markedForRemoval
    ) {
      if (!best || entity.container.y > best.container.y) {
        best = entity
      }
    }
  }
  return best
}

/**
 * Finds the entity closest to the bottom regardless of letter (D-08: miss visual).
 * Skips entities with active tweens or marked for removal.
 */
export function findLowestEntity(
  active: readonly LetterEntity[],
): LetterEntity | null {
  let best: LetterEntity | null = null
  for (const entity of active) {
    if (entity.tween === null && !entity.markedForRemoval) {
      if (!best || entity.container.y > best.container.y) {
        best = entity
      }
    }
  }
  return best
}
