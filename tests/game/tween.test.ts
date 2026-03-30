import { describe, it, expect, vi } from 'vitest'
import {
  createHitTween,
  createMissTween,
  createBottomTween,
  updateTween,
} from '@/game/tween.js'
import type { LetterTween } from '@/game/tween.js'

function createMockTarget(tween: LetterTween | null = null) {
  return {
    text: { scale: { set: vi.fn() }, tint: 0xffffff, alpha: 1, x: 100 },
    baseX: 100,
    tween,
  }
}

describe('LetterTween interface', () => {
  it('createHitTween returns correct shape', () => {
    const t = createHitTween()
    expect(t.type).toBe('hit')
    expect(t.duration).toBe(300)
    expect(t.elapsed).toBe(0)
  })

  it('createMissTween returns correct shape', () => {
    const t = createMissTween()
    expect(t.type).toBe('miss')
    expect(t.duration).toBe(200)
    expect(t.elapsed).toBe(0)
  })

  it('createBottomTween returns correct shape', () => {
    const t = createBottomTween()
    expect(t.type).toBe('bottom')
    expect(t.duration).toBe(400)
    expect(t.elapsed).toBe(0)
  })
})

describe('updateTween', () => {
  it('returns false when tween is null', () => {
    const target = createMockTarget(null)
    expect(updateTween(target, 16)).toBe(false)
  })

  describe('hit tween', () => {
    it('at t=0 sets scale 1.0', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 0)
      expect(target.text.scale.set).toHaveBeenCalledWith(1)
    })

    it('at t=0.5 sets scale ~1.15', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 150) // 150/300 = 0.5
      expect(target.text.scale.set).toHaveBeenCalledWith(
        expect.closeTo(1.15, 1),
      )
    })

    it('at t=1.0 sets scale 1.3', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 300) // 300/300 = 1.0
      expect(target.text.scale.set).toHaveBeenCalledWith(
        expect.closeTo(1.3, 1),
      )
    })

    it('sets tint to green (0x4ade80)', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 150)
      expect(target.text.tint).toBe(0x4ade80)
    })

    it('alpha decreases from 1 to 0', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 150) // t=0.5
      expect(target.text.alpha).toBeCloseTo(0.5, 1)
      updateTween(target, 150) // t=1.0
      expect(target.text.alpha).toBeCloseTo(0, 1)
    })

    it('returns true when elapsed >= duration', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 300)).toBe(true)
    })

    it('returns false when still running', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 100)).toBe(false)
    })
  })

  describe('miss tween', () => {
    it('sets tint to red (0xef4444)', () => {
      const tween = createMissTween()
      const target = createMockTarget(tween)
      updateTween(target, 50)
      expect(target.text.tint).toBe(0xef4444)
    })

    it('applies horizontal offset that dampens over time', () => {
      const tween = createMissTween()
      const target = createMockTarget(tween)
      // At t=0.25 (50ms/200ms), shake should be non-zero
      updateTween(target, 50)
      const xAtQuarter = target.text.x
      // Should have some offset from baseX
      // At t close to 1, offset should be near 0 (dampened)
      updateTween(target, 140) // elapsed=190, t~0.95
      const xAtEnd = target.text.x
      // The offset at end should be smaller than at quarter
      expect(Math.abs(xAtEnd - 100)).toBeLessThan(Math.abs(xAtQuarter - 100))
    })

    it('returns true when complete', () => {
      const tween = createMissTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 200)).toBe(true)
    })
  })

  describe('bottom tween', () => {
    it('fades alpha from 1 to 0', () => {
      const tween = createBottomTween()
      const target = createMockTarget(tween)
      updateTween(target, 200) // t=0.5
      expect(target.text.alpha).toBeCloseTo(0.5, 1)
      updateTween(target, 200) // t=1.0
      expect(target.text.alpha).toBeCloseTo(0, 1)
    })

    it('returns true when elapsed >= duration', () => {
      const tween = createBottomTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 400)).toBe(true)
    })
  })
})
