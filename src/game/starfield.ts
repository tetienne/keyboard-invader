import { Container, Graphics } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import { SPACE_PALETTE } from './theme.js'

interface Star {
  graphic: Graphics
  speed: number
  baseSpeed: number
}

export class Starfield {
  private stars: Star[] = []
  private intensity = 1

  constructor(parent: Container) {
    const count = 60
    for (let i = 0; i < count; i++) {
      const g = new Graphics()
      const radius = 0.5 + Math.random() * 1.5
      const bright = Math.random() > 0.7
      g.circle(0, 0, radius)
      g.fill(bright ? SPACE_PALETTE.starBright : SPACE_PALETTE.starDim)
      g.x = Math.random() * BASE_WIDTH
      g.y = Math.random() * BASE_HEIGHT
      g.alpha = 0.3 + Math.random() * 0.7

      const baseSpeed = 10 + Math.random() * 30
      this.stars.push({ graphic: g, speed: baseSpeed, baseSpeed })
      parent.addChild(g)
    }
  }

  update(dt: number): void {
    const ds = dt / 1000
    for (const star of this.stars) {
      star.graphic.y += star.speed * this.intensity * ds
      if (star.graphic.y > BASE_HEIGHT) {
        star.graphic.y = -2
        star.graphic.x = Math.random() * BASE_WIDTH
      }
    }
  }

  setIntensity(level: number): void {
    this.intensity = 1 + level * 0.3
  }

  destroy(): void {
    for (const star of this.stars) {
      star.graphic.destroy()
    }
    this.stars = []
  }
}
