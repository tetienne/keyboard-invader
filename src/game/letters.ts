import type { BitmapText } from 'pixi.js'
import type { LetterTween } from './tween.js'

// Keyboard row constants (D-04)
export const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l'] as const
export const TOP_ROW = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'] as const
export const BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm'] as const

// Kid-friendly color palette (D-03)
export const LETTER_COLORS = [
  0xff6b6b, // coral red
  0x4ecdc4, // teal
  0xffe66d, // sunny yellow
  0xa78bfa, // soft purple
  0x67e8f9, // sky cyan
  0xfb923c, // warm orange
  0x86efac, // mint green
  0xf9a8d4, // bubblegum pink
] as const

/**
 * Returns available letters based on session progress.
 * Starts with home row, adds top row at 40%, all rows at 70%.
 */
export function getAvailableLetters(
  progress: number,
  total: number,
): readonly string[] {
  if (total === 0) return HOME_ROW
  const ratio = progress / total
  if (ratio < 0.4) return HOME_ROW
  if (ratio < 0.7) return [...HOME_ROW, ...TOP_ROW]
  return [...HOME_ROW, ...TOP_ROW, ...BOTTOM_ROW]
}

/** A falling letter entity managed by PlayingState. */
export interface LetterEntity {
  readonly text: BitmapText
  readonly poolIndex: number
  letter: string
  baseX: number
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
      if (!best || entity.text.y > best.text.y) {
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
      if (!best || entity.text.y > best.text.y) {
        best = entity
      }
    }
  }
  return best
}
