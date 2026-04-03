import { Sprite, Assets } from 'pixi.js'
import type { Container } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import { SPACESHIP_PATH } from './theme.js'

/**
 * Defender spaceship positioned at the bottom of the screen.
 * Gentle hover bob animation for idle state.
 */
export class Defender {
  private readonly sprite: Sprite
  private bobPhase = 0
  private readonly baseY: number

  constructor(parent: Container) {
    const texture = Assets.get(SPACESHIP_PATH)
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.sprite.x = BASE_WIDTH / 2
    this.baseY = BASE_HEIGHT - 48
    this.sprite.y = this.baseY
    parent.addChild(this.sprite)
  }

  /** Gentle hover bob via sine wave. */
  update(dt: number): void {
    this.bobPhase += dt * 0.002
    this.sprite.y = this.baseY + Math.sin(this.bobPhase) * 2
  }

  /** Get current sprite position. */
  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  destroy(): void {
    this.sprite.destroy()
  }
}
