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
    expect(alien.letterLabel).toBeDefined()
    expect(alien.letterLabel.text).toBe('A')
    expect(alien.letterLabel.tint).toBe(0x1a1a3e) // dark text
    expect(alien.sprite.tint).toBe(0xff0000) // alien body colored
  })

  it('updateIdle changes sprite y (bobbing)', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    const initialY = alien.sprite.y
    alien.updateIdle(1000) // 1 second
    // Bobbing should change sprite.y via sine wave
    expect(alien.sprite.y).not.toBe(initialY)
  })

  it('setLetter updates label text and tint', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    alien.setLetter('B', 0x00ff00)
    expect(alien.letterLabel.text).toBe('B')
    expect(alien.letterLabel.tint).toBe(0x1a1a3e) // dark text
    expect(alien.sprite.tint).toBe(0x00ff00) // alien body colored
  })

  it('setTexture updates sprite texture', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    const newTexture = new MockTexture()
    alien.setTexture(newTexture as never)
    expect(alien.sprite.texture).toBe(newTexture)
  })

  it('reset restores initial state', () => {
    const alien = new AlienContainer(texture as never, 'A', 0xffffff)
    alien.alpha = 0.5
    alien.visible = true

    alien.reset()

    expect(alien.alpha).toBe(1)
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
