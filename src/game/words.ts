import type { LetterTween } from './tween.js'
import frWords from '../shared/i18n/fr.words.json'
import enWords from '../shared/i18n/en.words.json'

export interface WordLists {
  readonly short: readonly string[]
  readonly medium: readonly string[]
}

/** Loads word lists for the given locale. Defaults to French if unknown. */
export function loadWordLists(locale: string): WordLists {
  return locale === 'en' ? enWords : frWords
}

/**
 * Returns available words based on complexity level.
 * Level 0: short words only, level 1+: short + medium words.
 */
export function getAvailableWords(
  wordLists: WordLists,
  complexityLevel: number,
): readonly string[] {
  if (complexityLevel <= 0) return wordLists.short
  return [...wordLists.short, ...wordLists.medium]
}

/** A falling word entity managed by PlayingState in word mode. */
export interface WordEntity {
  readonly text: {
    y: number
    readonly scale: { set(x: number, y?: number): void }
    tint: number
    alpha: number
    x: number
    chars: Array<{ tint: number }>
  }
  readonly poolIndex: number
  word: string
  cursorIndex: number
  baseX: number
  originalTint: number
  tween: LetterTween | null
  markedForRemoval: boolean
}

/**
 * Finds the active word entity closest to the bottom (highest y).
 * Skips entities with active tweens or marked for removal.
 */
export function findActiveWord(
  active: readonly WordEntity[],
): WordEntity | null {
  let best: WordEntity | null = null
  for (const entity of active) {
    if (entity.tween === null && !entity.markedForRemoval) {
      if (!best || entity.text.y > best.text.y) {
        best = entity
      }
    }
  }
  return best
}

export type WordMatchResult = 'correct' | 'complete' | 'wrong'

/**
 * Checks if a key matches the current cursor position in a word.
 * Returns 'correct' for partial match, 'complete' for final character, 'wrong' otherwise.
 * Does not mutate the entity.
 */
export function matchWordKey(entity: WordEntity, key: string): WordMatchResult {
  const expected = entity.word[entity.cursorIndex]
  if (key !== expected) return 'wrong'
  if (entity.cursorIndex >= entity.word.length - 1) return 'complete'
  return 'correct'
}
