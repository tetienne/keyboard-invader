import { describe, expect, it } from 'vitest'
import {
  SPACE_PALETTE,
  LETTER_COLORS,
  getLevelTitle,
  ALIEN_TEXTURES_PATHS,
  WORD_ALIEN_TEXTURE_PATHS,
  AVATAR_SVG_PATHS,
  UI_CONSTANTS,
} from '../../src/game/theme.js'

describe('SPACE_PALETTE', () => {
  it('has all 7 color keys', () => {
    const keys = Object.keys(SPACE_PALETTE)
    expect(keys).toHaveLength(7)
    expect(keys).toEqual(
      expect.arrayContaining([
        'background',
        'backgroundLight',
        'secondary',
        'accent',
        'glow',
        'starDim',
        'starBright',
      ]),
    )
  })
})

describe('LETTER_COLORS', () => {
  it('has exactly 8 entries', () => {
    expect(LETTER_COLORS).toHaveLength(8)
  })
})

describe('getLevelTitle', () => {
  it('returns Cadet for level 1 in French', () => {
    expect(getLevelTitle(1, 'fr')).toBe('Cadet')
  })

  it('returns Captain for level 5 in English', () => {
    expect(getLevelTitle(5, 'en')).toBe('Captain')
  })

  it('returns Amiral for level 10 in French', () => {
    expect(getLevelTitle(10, 'fr')).toBe('Amiral')
  })

  it('returns Pilote for level 4 in French (highest threshold <= 4 is 3)', () => {
    expect(getLevelTitle(4, 'fr')).toBe('Pilote')
  })
})

describe('asset path constants', () => {
  it('ALIEN_TEXTURES_PATHS has 6 entries', () => {
    expect(ALIEN_TEXTURES_PATHS).toHaveLength(6)
  })

  it('WORD_ALIEN_TEXTURE_PATHS has 2 entries', () => {
    expect(WORD_ALIEN_TEXTURE_PATHS).toHaveLength(2)
  })

  it('AVATAR_SVG_PATHS has 6 entries', () => {
    expect(Object.keys(AVATAR_SVG_PATHS)).toHaveLength(6)
  })
})

describe('UI_CONSTANTS', () => {
  it('has expected shape', () => {
    expect(UI_CONSTANTS.panelCornerRadius).toBe(12)
    expect(UI_CONSTANTS.touchTargetMin).toBe(44)
  })
})
