import { describe, it, expect } from 'vitest'
import {
  loadWordLists,
  getAvailableWords,
  findActiveWord,
  matchWordKey,
} from '@/game/words.js'
import type { WordEntity } from '@/game/words.js'

function createMockWordEntity(
  word: string,
  y: number,
  cursorIndex = 0,
  tween: WordEntity['tween'] = null,
  markedForRemoval = false,
): WordEntity {
  return {
    container: { y } as unknown as WordEntity['container'],
    wordText: { text: word, tint: 0xffffff } as unknown as WordEntity['wordText'],
    poolIndex: 0,
    word,
    cursorIndex,
    baseX: 100,
    originalTint: 0xffffff,
    tween,
    markedForRemoval,
  }
}

describe('loadWordLists', () => {
  it('returns French word lists with short and medium arrays', () => {
    const lists = loadWordLists('fr')
    expect(Array.isArray(lists.short)).toBe(true)
    expect(Array.isArray(lists.medium)).toBe(true)
    expect(lists.short.length).toBeGreaterThanOrEqual(20)
    expect(lists.medium.length).toBeGreaterThanOrEqual(15)
    for (const w of lists.short) {
      expect(typeof w).toBe('string')
    }
  })

  it('returns English word lists with short and medium arrays', () => {
    const lists = loadWordLists('en')
    expect(Array.isArray(lists.short)).toBe(true)
    expect(Array.isArray(lists.medium)).toBe(true)
    expect(lists.short.length).toBeGreaterThanOrEqual(20)
  })

  it('defaults to French for unknown locale', () => {
    const lists = loadWordLists('unknown')
    const frLists = loadWordLists('fr')
    expect(lists.short).toEqual(frLists.short)
    expect(lists.medium).toEqual(frLists.medium)
  })
})

describe('getAvailableWords', () => {
  const lists = loadWordLists('fr')

  it('returns only short words at complexity level 0', () => {
    const result = getAvailableWords(lists, 0)
    expect([...result]).toEqual([...lists.short])
  })

  it('returns short + medium at complexity level 1', () => {
    const result = getAvailableWords(lists, 1)
    expect([...result]).toEqual([...lists.short, ...lists.medium])
  })

  it('returns short + medium for level > 1 (clamped)', () => {
    const result = getAvailableWords(lists, 5)
    expect([...result]).toEqual([...lists.short, ...lists.medium])
  })
})

describe('findActiveWord', () => {
  it('returns null for empty array', () => {
    expect(findActiveWord([])).toBeNull()
  })

  it('returns entity with highest y value (lowest on screen)', () => {
    const entities = [
      createMockWordEntity('cat', 100),
      createMockWordEntity('dog', 300),
      createMockWordEntity('hat', 200),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('skips entities with active tweens', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, {
        elapsed: 0,
        duration: 300,
        type: 'hit',
      }),
      createMockWordEntity('dog', 100),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('skips entities marked for removal', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, null, true),
      createMockWordEntity('dog', 100),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('returns null when all entities have tweens', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, {
        elapsed: 0,
        duration: 300,
        type: 'hit',
      }),
    ]
    expect(findActiveWord(entities)).toBeNull()
  })
})

describe('WordEntity interface with SplitBitmapText', () => {
  it('accepts SplitBitmapText-shaped object with chars and pivot (no anchor)', () => {
    const splitTextMock = {
      text: 'CAT',
      chars: [{ tint: 0xffffff }, { tint: 0xffffff }, { tint: 0xffffff }],
      pivot: { set: () => {}, x: 0, y: 0 },
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      tint: 0xffffff,
      alpha: 1,
      visible: true,
      scale: { set: () => {} },
      split: () => {},
      destroy: () => {},
    }
    const entity: WordEntity = {
      container: { y: 100 } as unknown as WordEntity['container'],
      wordText: splitTextMock as unknown as WordEntity['wordText'],
      poolIndex: 0,
      word: 'cat',
      cursorIndex: 0,
      baseX: 100,
      originalTint: 0xffffff,
      tween: null,
      markedForRemoval: false,
    }
    expect(entity.wordText).toBeDefined()
    expect((entity.wordText as unknown as { chars: unknown[] }).chars).toHaveLength(3)
    expect((entity.wordText as unknown as { pivot: unknown }).pivot).toBeDefined()
    // SplitBitmapText should NOT have anchor
    expect((entity.wordText as unknown as Record<string, unknown>).anchor).toBeUndefined()
  })
})

describe('matchWordKey', () => {
  it('returns correct for matching non-final character', () => {
    const entity = createMockWordEntity('cat', 100, 0)
    expect(matchWordKey(entity, 'c')).toBe('correct')
  })

  it('returns complete for matching final character', () => {
    const entity = createMockWordEntity('cat', 100, 2)
    expect(matchWordKey(entity, 't')).toBe('complete')
  })

  it('returns wrong for non-matching character', () => {
    const entity = createMockWordEntity('cat', 100, 0)
    expect(matchWordKey(entity, 'x')).toBe('wrong')
  })

  it('returns correct for middle character', () => {
    const entity = createMockWordEntity('dog', 100, 1)
    expect(matchWordKey(entity, 'o')).toBe('correct')
  })

  it('returns wrong when key does not match current cursor position', () => {
    const entity = createMockWordEntity('cat', 100, 1)
    expect(matchWordKey(entity, 'c')).toBe('wrong')
  })
})
