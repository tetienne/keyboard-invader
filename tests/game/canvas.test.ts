import { describe, it, expect } from 'vitest'
import { computeScale } from '@/game/canvas'
import { BASE_WIDTH, BASE_HEIGHT } from '@/game/types'

describe('computeScale', () => {
  it('returns scale 1.0 with zero offsets for exact 16:9', () => {
    const result = computeScale(1280, 720)
    expect(result.scale).toBe(1)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(0)
    expect(result.screenWidth).toBe(1280)
    expect(result.screenHeight).toBe(720)
  })

  it('pillarboxes on wider-than-16:9 screen', () => {
    // 2560x1080 ultrawide: scale limited by height
    const result = computeScale(2560, 1080)
    expect(result.scale).toBe(1.5) // 1080/720
    expect(result.offsetX).toBe(320) // (2560 - 1280*1.5) / 2
    expect(result.offsetY).toBe(0)
  })

  it('letterboxes on taller screen', () => {
    const result = computeScale(720, 720)
    const expectedScale = 720 / BASE_WIDTH // 0.5625
    expect(result.scale).toBeCloseTo(expectedScale, 5)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBeGreaterThan(0)
  })

  it('scales down for very small screen', () => {
    const result = computeScale(640, 360)
    expect(result.scale).toBe(0.5)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(0)
  })

  it('uses BASE_WIDTH and BASE_HEIGHT constants', () => {
    expect(BASE_WIDTH).toBe(1280)
    expect(BASE_HEIGHT).toBe(720)
  })
})
