import { describe, it, expect, vi } from 'vitest'
import {
  createHitTween,
  createDodgeTween,
  createEscapeTween,
  updateTween,
} from '@/game/tween.js'
import type { LetterTween } from '@/game/tween.js'

function createMockTarget(tween: LetterTween | null = null) {
  return {
    container: { scale: { set: vi.fn() }, alpha: 1, x: 100, y: 200 },
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
      expect(target.container.scale.set).toHaveBeenCalledWith(1)
    })

    it('at t=0.5 sets scale ~1.15', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 150) // 150/300 = 0.5
      expect(target.container.scale.set).toHaveBeenCalledWith(
        expect.closeTo(1.15, 1),
      )
    })

    it('at t=1.0 sets scale 1.3', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 300) // 300/300 = 1.0
      expect(target.container.scale.set).toHaveBeenCalledWith(
        expect.closeTo(1.3, 1),
      )
    })

    it('alpha decreases from 1 to 0', () => {
      const tween = createHitTween()
      const target = createMockTarget(tween)
      updateTween(target, 150) // t=0.5
      expect(target.container.alpha).toBeCloseTo(0.5, 1)
      updateTween(target, 150) // t=1.0
      expect(target.container.alpha).toBeCloseTo(0, 1)
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

  describe('dodge tween', () => {
    it('createDodgeTween returns type dodge, duration 400', () => {
      const tween = createDodgeTween()
      expect(tween.type).toBe('dodge')
      expect(tween.duration).toBe(400)
      expect(tween.elapsed).toBe(0)
    })

    it('moves x position during animation', () => {
      const tween = createDodgeTween()
      const target = createMockTarget(tween)
      updateTween(target, 50) // t=0.125 -> sin(0.5*PI) = 1, offset = 20*0.875 = 17.5
      expect(target.container.x).not.toBe(target.baseX)
    })

    it('restores x near baseX when complete', () => {
      const tween = createDodgeTween()
      const target = createMockTarget(tween)
      updateTween(target, 400) // t=1.0
      // At t=1.0, (1-t)=0 so offset is 0
      expect(target.container.x).toBeCloseTo(target.baseX, 1)
    })

    it('returns true when complete', () => {
      const tween = createDodgeTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 400)).toBe(true)
    })
  })

  describe('escape tween', () => {
    it('createEscapeTween returns type escape, duration 600', () => {
      const tween = createEscapeTween()
      expect(tween.type).toBe('escape')
      expect(tween.duration).toBe(600)
      expect(tween.elapsed).toBe(0)
    })

    it('reduces alpha to 0', () => {
      const tween = createEscapeTween()
      const target = createMockTarget(tween)
      updateTween(target, 300) // t=0.5
      expect(target.container.alpha).toBeCloseTo(0.5, 1)
      updateTween(target, 300) // t=1.0
      expect(target.container.alpha).toBeCloseTo(0, 1)
    })

    it('shrinks scale', () => {
      const tween = createEscapeTween()
      const target = createMockTarget(tween)
      updateTween(target, 600) // t=1.0
      // scale should be set to 0.5 at t=1.0
      expect(target.container.scale.set).toHaveBeenCalledWith(expect.closeTo(0.5, 1))
    })

    it('returns true when complete', () => {
      const tween = createEscapeTween()
      const target = createMockTarget(tween)
      expect(updateTween(target, 600)).toBe(true)
    })
  })
})
