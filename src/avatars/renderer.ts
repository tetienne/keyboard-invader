import type { Graphics } from 'pixi.js'
import type { AvatarDefinition } from './definitions.js'

export function drawAvatar(
  g: Graphics,
  def: AvatarDefinition,
  size: number,
): void {
  g.clear()

  const half = size / 2

  switch (def.shape) {
    case 'circle':
      g.circle(0, 0, half)
      break

    case 'square':
      g.roundRect(-half, -half, size, size, size * 0.15)
      break

    case 'triangle': {
      const h = (Math.sqrt(3) / 2) * size
      g.moveTo(0, -h / 2)
      g.lineTo(half, h / 2)
      g.lineTo(-half, h / 2)
      g.closePath()
      break
    }

    case 'star': {
      const outerR = half
      const innerR = half * 0.4
      const points = 5
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const angle = (Math.PI / points) * i - Math.PI / 2
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        if (i === 0) {
          g.moveTo(x, y)
        } else {
          g.lineTo(x, y)
        }
      }
      g.closePath()
      break
    }

    case 'diamond':
      g.moveTo(0, -half)
      g.lineTo(half * 0.7, 0)
      g.lineTo(0, half)
      g.lineTo(-half * 0.7, 0)
      g.closePath()
      break

    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const x = Math.cos(angle) * half
        const y = Math.sin(angle) * half
        if (i === 0) {
          g.moveTo(x, y)
        } else {
          g.lineTo(x, y)
        }
      }
      g.closePath()
      break
    }
  }

  g.fill({ color: def.color })
}
