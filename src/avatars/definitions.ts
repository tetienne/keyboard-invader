export interface AvatarDefinition {
  id: string
  label: string
  color: number
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon'
}

export const AVATARS: readonly AvatarDefinition[] = [
  { id: 'avatar-red', label: 'Rouge', color: 0xff6b6b, shape: 'circle' },
  { id: 'avatar-blue', label: 'Bleu', color: 0x4dabf7, shape: 'square' },
  { id: 'avatar-green', label: 'Vert', color: 0x51cf66, shape: 'triangle' },
  { id: 'avatar-yellow', label: 'Jaune', color: 0xffd43b, shape: 'star' },
  { id: 'avatar-purple', label: 'Violet', color: 0xcc5de8, shape: 'diamond' },
  { id: 'avatar-orange', label: 'Orange', color: 0xff922b, shape: 'hexagon' },
] as const
