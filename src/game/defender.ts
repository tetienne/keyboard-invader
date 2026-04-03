import { Container, Sprite, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import { SPACESHIP_PATH } from './theme.js'

export class Defender {
  private sprite: Sprite
  private bobPhase = 0

  constructor(parent: Container) {
    const texture = Assets.get<Texture>(SPACESHIP_PATH)
    this.sprite = new Sprite(texture)
    this.sprite.width = 48
    this.sprite.height = 48
    this.sprite.anchor.set(0.5)
    this.sprite.x = BASE_WIDTH / 2
    this.sprite.y = BASE_HEIGHT - 40
    parent.addChild(this.sprite)
  }

  update(dt: number): void {
    const ds = dt / 1000
    this.bobPhase += ds * 2
    this.sprite.y = BASE_HEIGHT - 40 + Math.sin(this.bobPhase) * 3
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  destroy(): void {
    this.sprite.destroy()
  }
}
