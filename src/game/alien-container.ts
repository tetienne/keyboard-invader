import { Container, Sprite, Assets, BitmapText, Texture } from 'pixi.js'
import { ALIEN_TEXTURES_PATHS, WORD_ALIEN_TEXTURE_PATHS } from './theme.js'

/**
 * Safely retrieves a texture from the asset cache.
 * Assets.get() is typed as always returning T, but at runtime it returns
 * undefined if the asset has not been loaded yet.
 */
function safeGetTexture(path: string): Texture | undefined {
  return Assets.get<Texture>(path) as Texture | undefined
}

export class AlienContainer extends Container {
  readonly sprite: Sprite
  readonly letterLabel: BitmapText
  wordLabel: BitmapText | null = null
  private bobPhase = 0
  private blinkTimer = 0

  constructor(texture: Texture, letter: string, tint: number) {
    super()

    this.sprite = new Sprite(texture)
    this.sprite.width = 72
    this.sprite.height = 72
    this.sprite.anchor.set(0.5)
    this.addChild(this.sprite)

    this.letterLabel = new BitmapText({
      text: letter,
      style: { fontFamily: 'GameFont', fontSize: 38 },
    })
    this.letterLabel.anchor.set(0.5)
    this.letterLabel.tint = 0xffffff // white text
    this.sprite.tint = tint // color the alien body
    this.letterLabel.y = 2
    this.addChild(this.letterLabel)
  }

  updateIdle(dt: number): void {
    const ds = dt / 1000
    // Bobbing
    this.bobPhase += ds * 3
    this.sprite.y = Math.sin(this.bobPhase) * 3

    // Blinking (briefly squeeze y-scale)
    this.blinkTimer += ds
    if (this.blinkTimer > 3 + Math.random() * 2) {
      this.sprite.scale.y = 0.85
      this.blinkTimer = 0
      setTimeout(() => {
        if (!this.destroyed) this.sprite.scale.y = 1
      }, 120)
    }
  }

  setLetter(letter: string, tint: number): void {
    this.letterLabel.text = letter
    this.letterLabel.tint = 0xffffff // white text
    this.sprite.tint = tint // color the alien body
  }

  setTexture(texture: Texture): void {
    this.sprite.texture = texture
  }

  static getRandomAlienTexture(wordMode: boolean): Texture {
    const paths = wordMode ? WORD_ALIEN_TEXTURE_PATHS : ALIEN_TEXTURES_PATHS
    const idx = Math.floor(Math.random() * paths.length)
    const path = paths[idx]
    if (!path) return Texture.WHITE
    const texture = safeGetTexture(path)
    if (!texture) {
      console.warn(`Alien texture not loaded: ${path}`)
      return Texture.WHITE
    }
    return texture
  }

  reset(): void {
    this.bobPhase = 0
    this.blinkTimer = 0
    this.sprite.scale.set(1)
    this.sprite.alpha = 1
    this.letterLabel.alpha = 1
    this.alpha = 1
    this.scale.set(1)
    this.visible = false
  }
}
