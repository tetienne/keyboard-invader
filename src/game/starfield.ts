import { Container, Graphics } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'

interface StarLayer {
  container: Container
  stars: Graphics[]
  speed: number
  baseAlpha: number
}

const LAYER_CONFIGS = [
  { count: 40, speed: 10, alpha: 0.3, size: 1 },
  { count: 25, speed: 25, alpha: 0.6, size: 2 },
  { count: 15, speed: 45, alpha: 1.0, size: 3 },
] as const

/**
 * Parallax starfield background with 3 depth layers.
 * Far stars move slowly, near stars move fast.
 */
export class Starfield {
  private readonly layers: StarLayer[] = []

  constructor(parent: Container) {
    for (const config of LAYER_CONFIGS) {
      const layerContainer = new Container()
      parent.addChild(layerContainer)

      const stars: Graphics[] = []
      for (let i = 0; i < config.count; i++) {
        const star = new Graphics()
        star.circle(0, 0, config.size)
        star.fill(0xffffff)
        star.x = Math.random() * BASE_WIDTH
        star.y = Math.random() * BASE_HEIGHT
        star.alpha = config.alpha
        layerContainer.addChild(star)
        stars.push(star)
      }

      this.layers.push({
        container: layerContainer,
        stars,
        speed: config.speed,
        baseAlpha: config.alpha,
      })
    }
  }

  /** Move stars downward. Wrap to top when off-screen. */
  update(dt: number): void {
    const ds = dt / 1000
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.y += layer.speed * ds
        if (star.y > BASE_HEIGHT) {
          star.y = -2
          star.x = Math.random() * BASE_WIDTH
        }
      }
    }
  }

  /** Adjust star intensity for difficulty-based visual shift. */
  setIntensity(level: number): void {
    // Near layer (index 2)
    if (this.layers[2]) {
      this.layers[2].container.alpha = Math.min(0.8 + level * 0.04, 1.0)
    }
    // Mid layer (index 1)
    if (this.layers[1]) {
      this.layers[1].container.alpha = Math.min(0.5 + level * 0.02, 0.8)
    }
  }

  destroy(): void {
    for (const layer of this.layers) {
      layer.container.destroy({ children: true })
    }
  }

  /** Expose layer count for testing. */
  get layerCount(): number {
    return this.layers.length
  }

  /** Expose total star count for testing. */
  get totalStarCount(): number {
    return this.layers.reduce((sum, l) => sum + l.stars.length, 0)
  }
}
