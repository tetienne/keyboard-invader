import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('pixi.js', async () => {
  const { createPixiMocks } = await import('../__mocks__/pixi.js')
  return createPixiMocks()
})

// Must import after mock
import { AlienContainer } from '@/game/alien-container.js'
import { MockTexture } from '../__mocks__/pixi.js'

describe('AlienContainer', () => {
  let texture: InstanceType<typeof MockTexture>

  beforeEach(() => {
    texture = new MockTexture()
  })

  it('constructor creates sprite and label as children', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xff0000)
    // Container mock stores children
    expect(alien.sprite).toBeDefined()
    expect(alien.label).toBeDefined()
    expect(alien.label.text).toBe('A')
    expect(alien.label.tint).toBe(0xff0000)
  })

  it('updateIdle changes bobPhase', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    const initialPhase = alien.bobPhase
    alien.updateIdle(100)
    expect(alien.bobPhase).not.toBe(initialPhase)
    expect(alien.bobPhase).toBeCloseTo(initialPhase + 100 * 0.003, 3)
  })

  it('updateIdle triggers blink when timer expires', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    alien.blinkTimer = 50 // Almost expired
    alien.updateIdle(60) // Should trigger blink
    // Sprite scaleY should be 0.7 during blink
    expect(alien.sprite.scale.set).toHaveBeenCalledWith(1, 0.7)
  })

  it('setLetter updates label text and tint', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    alien.setLetter('B', 0x00ff00)
    expect(alien.label.text).toBe('B')
    expect(alien.label.tint).toBe(0x00ff00)
  })

  it('setTexture updates sprite texture', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    const newTexture = new MockTexture()
    alien.setTexture(newTexture as never)
    expect(alien.sprite.texture).toBe(newTexture)
  })

  it('reset restores initial state', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    alien.bobPhase = 5
    alien.label.text = 'Z'
    alien.visible = true

    alien.reset()

    expect(alien.bobPhase).toBe(0)
    expect(alien.label.text).toBe('')
    expect(alien.visible).toBe(false)
  })

  it('getRandomAlienTexture returns a texture for letter mode', () => {
    const result = AlienContainer.getRandomAlienTexture(false)
    expect(result).toBeDefined()
  })

  it('getRandomAlienTexture returns a texture for word mode', () => {
    const result = AlienContainer.getRandomAlienTexture(true)
    expect(result).toBeDefined()
  })
})
