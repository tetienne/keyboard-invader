export const SPACE_PALETTE = {
  background: 0x1a1a3e,
  backgroundLight: 0x2a2a5e,
  secondary: 0x2d1b4e,
  accent: 0xe94560,
  glow: 0x6b8bf5,
  starDim: 0x555577,
  starBright: 0xffffff,
} as const

export const LETTER_COLORS = [
  0xff7b7b, // coral red
  0x5eedd4, // bright teal
  0xfff07d, // vivid yellow
  0xb89bff, // lavender
  0x77f8ff, // electric cyan
  0xffa24c, // warm orange
  0x96ffbc, // bright mint
  0xffb8e4, // rose pink
] as const

export const LEVEL_TITLES: Record<number, { fr: string; en: string }> = {
  1: { fr: 'Cadet', en: 'Cadet' },
  2: { fr: 'Apprenti', en: 'Apprentice' },
  3: { fr: 'Pilote', en: 'Pilot' },
  5: { fr: 'Capitaine', en: 'Captain' },
  8: { fr: 'Commandant', en: 'Commander' },
  10: { fr: 'Amiral', en: 'Admiral' },
}

export function getLevelTitle(level: number, locale: string): string {
  const thresholds = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a)
  for (const threshold of thresholds) {
    if (level >= threshold) {
      const titles = LEVEL_TITLES[threshold]!
      return locale === 'en' ? titles.en : titles.fr
    }
  }
  return 'Cadet'
}

export const UI_CONSTANTS = {
  panelCornerRadius: 12,
  panelBorderWidth: 2,
  panelBorderAlpha: 0.6,
  panelBgAlpha: 0.9,
  touchTargetMin: 44,
} as const

export const ALIEN_TEXTURES_PATHS = [
  '/assets/aliens/alien-01.svg',
  '/assets/aliens/alien-02.svg',
  '/assets/aliens/alien-03.svg',
  '/assets/aliens/alien-04.svg',
  '/assets/aliens/alien-05.svg',
  '/assets/aliens/alien-06.svg',
] as const

export const WORD_ALIEN_TEXTURE_PATHS = [
  '/assets/aliens/word-alien-01.svg',
  '/assets/aliens/word-alien-02.svg',
] as const

export const AVATAR_SVG_PATHS: Record<string, string> = {
  'avatar-kid-01': '/assets/avatars/kid-01.svg',
  'avatar-kid-02': '/assets/avatars/kid-02.svg',
  'avatar-kid-03': '/assets/avatars/kid-03.svg',
  'avatar-alien-01': '/assets/avatars/alien-avatar-01.svg',
  'avatar-alien-02': '/assets/avatars/alien-avatar-02.svg',
  'avatar-alien-03': '/assets/avatars/alien-avatar-03.svg',
}

export const SPACESHIP_PATH = '/assets/spaceship.svg'
export const STAR_PARTICLE_PATH = '/assets/star.svg'
