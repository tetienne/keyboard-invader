import { describe, it, expect } from 'vitest'
import { AVATARS, migrateLegacyAvatarId } from '../../src/avatars/definitions.js'

describe('AVATARS definitions', () => {
  it('has exactly 6 entries', () => {
    expect(AVATARS).toHaveLength(6)
  })

  it('first 3 avatars are free (no unlockLevel)', () => {
    for (let i = 0; i < 3; i++) {
      expect(AVATARS[i]!.unlockLevel).toBeUndefined()
    }
  })

  it('has correct avatar IDs', () => {
    const ids = AVATARS.map((a) => a.id)
    expect(ids).toEqual([
      'avatar-kid-01',
      'avatar-kid-02',
      'avatar-alien-01',
      'avatar-kid-03',
      'avatar-alien-02',
      'avatar-alien-03',
    ])
  })

  it('has correct unlock levels', () => {
    const kidThree = AVATARS.find((a) => a.id === 'avatar-kid-03')
    expect(kidThree?.unlockLevel).toBe(3)

    const alienTwo = AVATARS.find((a) => a.id === 'avatar-alien-02')
    expect(alienTwo?.unlockLevel).toBe(5)

    const alienThree = AVATARS.find((a) => a.id === 'avatar-alien-03')
    expect(alienThree?.unlockLevel).toBe(8)
  })

  it('all avatars have svgPath starting with /assets/avatars/', () => {
    for (const avatar of AVATARS) {
      expect(avatar.svgPath).toMatch(/^\/assets\/avatars\//)
    }
  })

  it('has 3 kid and 3 alien types', () => {
    const kids = AVATARS.filter((a) => a.type === 'kid')
    const aliens = AVATARS.filter((a) => a.type === 'alien')
    expect(kids).toHaveLength(3)
    expect(aliens).toHaveLength(3)
  })
})

describe('migrateLegacyAvatarId', () => {
  it('maps legacy avatar-red to avatar-kid-01', () => {
    expect(migrateLegacyAvatarId('avatar-red')).toBe('avatar-kid-01')
  })

  it('passes through new IDs unchanged', () => {
    expect(migrateLegacyAvatarId('avatar-kid-01')).toBe('avatar-kid-01')
  })

  it('passes through unknown IDs unchanged', () => {
    expect(migrateLegacyAvatarId('some-unknown-id')).toBe('some-unknown-id')
  })
})
