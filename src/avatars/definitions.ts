export interface AvatarDefinition {
  id: string
  label: string
  color: number
  svgPath: string
  type: 'kid' | 'alien'
  unlockLevel?: number
}

export const AVATARS: readonly AvatarDefinition[] = [
  { id: 'avatar-kid-01', label: 'Luna', color: 0xff7b7b, svgPath: '/assets/avatars/kid-01.svg', type: 'kid' },
  { id: 'avatar-kid-02', label: 'Nova', color: 0x5eedd4, svgPath: '/assets/avatars/kid-02.svg', type: 'kid' },
  { id: 'avatar-alien-01', label: 'Blob', color: 0xb89bff, svgPath: '/assets/avatars/alien-avatar-01.svg', type: 'alien' },
  { id: 'avatar-kid-03', label: 'Star', color: 0xfff07d, svgPath: '/assets/avatars/kid-03.svg', type: 'kid', unlockLevel: 3 },
  { id: 'avatar-alien-02', label: 'Zyx', color: 0x77f8ff, svgPath: '/assets/avatars/alien-avatar-02.svg', type: 'alien', unlockLevel: 5 },
  { id: 'avatar-alien-03', label: 'Orion', color: 0xffa24c, svgPath: '/assets/avatars/alien-avatar-03.svg', type: 'alien', unlockLevel: 8 },
] as const

const LEGACY_ID_MAP: Record<string, string> = {
  'avatar-red': 'avatar-kid-01',
  'avatar-blue': 'avatar-kid-02',
  'avatar-green': 'avatar-alien-01',
  'avatar-yellow': 'avatar-kid-03',
  'avatar-purple': 'avatar-alien-02',
  'avatar-orange': 'avatar-alien-03',
}

export function migrateLegacyAvatarId(id: string): string {
  return LEGACY_ID_MAP[id] ?? id
}
