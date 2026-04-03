import { describe, it, expect, vi } from 'vitest'

vi.mock('pixi.js', async () => {
  const { createPixiMocks } = await import('../__mocks__/pixi.js')
  return createPixiMocks()
})

import { DestructionEffect, LaserBolt } from '@/game/effects.js'
import { MockContainer } from '../__mocks__/pixi.js'

describe('DestructionEffect', () => {
  it('burst creates 12 particles by default', () => {
    const parent = new MockContainer() as never
    const fx = new DestructionEffect(parent)
    fx.burst(100, 200, 0xff0000)
    expect(fx.activeCount).toBe(12)
  })

  it('burst creates custom count of particles', () => {
    const parent = new MockContainer() as never
    const fx = new DestructionEffect(parent)
    fx.burst(100, 200, 0xff0000, 8)
    expect(fx.activeCount).toBe(8)
  })

  it('update reduces particle life', () => {
    const parent = new MockContainer() as never
    const fx = new DestructionEffect(parent)
    fx.burst(100, 200, 0xff0000, 4)
    expect(fx.activeCount).toBe(4)
    // Update with small dt -- particles should still be alive
    fx.update(100)
    expect(fx.activeCount).toBe(4)
  })

  it('dead particles are removed after enough time', () => {
    const parent = new MockContainer() as never
    const fx = new DestructionEffect(parent)
    fx.burst(100, 200, 0xff0000, 4)
    // Life starts at 1.0, decreases by ds*1.5 per update
    // At dt=800ms: ds=0.8, life -= 1.2 -> life = -0.2 => all dead
    fx.update(800)
    expect(fx.activeCount).toBe(0)
  })

  it('clear removes all particles', () => {
    const parent = new MockContainer() as never
    const fx = new DestructionEffect(parent)
    fx.burst(100, 200, 0xff0000, 12)
    fx.clear()
    expect(fx.activeCount).toBe(0)
  })
})

describe('LaserBolt', () => {
  it('fire creates a bolt', () => {
    const parent = new MockContainer() as never
    const bolt = new LaserBolt(parent)
    expect(bolt.isActive).toBe(false)
    bolt.fire(100, 600, 200, 200)
    expect(bolt.isActive).toBe(true)
  })

  it('update returns true while bolt animation is running', () => {
    const parent = new MockContainer() as never
    const bolt = new LaserBolt(parent)
    bolt.fire(100, 600, 200, 200)

    // Still running at 100ms (DURATION=150ms)
    expect(bolt.update(100)).toBe(true)
    expect(bolt.isActive).toBe(true)

    // Should complete after 150ms total
    expect(bolt.update(100)).toBe(false)
    expect(bolt.isActive).toBe(false)
  })

  it('update returns false when no bolt is active', () => {
    const parent = new MockContainer() as never
    const bolt = new LaserBolt(parent)
    expect(bolt.update(16)).toBe(false)
  })
})
