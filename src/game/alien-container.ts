import { Container, Sprite, BitmapText, Texture, Assets } from 'pixi.js'
import { ALIEN_TEXTURES_PATHS, WORD_ALIEN_TEXTURE_PATHS } from './theme.js'

/**
 * AlienContainer wraps an alien Sprite + BitmapText label.
 * Each falling letter/word is visually carried by a cute alien creature.
 */
export class AlienContainer extends Container {
  readonly sprite: Sprite
  readonly label: BitmapText
  bobPhase: number
  blinkTimer: number
  private _blinkActive = false
  private _blinkElapsed = 0

  constructor(texture: Texture, letter: string, tint: number) {
    super()
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.addChild(this.sprite)

    this.label = new BitmapText({
      text: letter,
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    this.label.anchor.set(0.5)
    this.label.tint = tint
    this.addChild(this.label)

    this.bobPhase = Math.random() * Math.PI * 2
    this.blinkTimer = 2000 + Math.random() * 3000
  }

  /** Idle animation: gentle bobbing + occasional eye blink squash. */
  updateIdle(dt: number): void {
    this.bobPhase += dt * 0.003
    this.sprite.y = Math.sin(this.bobPhase) * 3

    if (this._blinkActive) {
      this._blinkElapsed += dt
      if (this._blinkElapsed >= 100) {
        this.sprite.scale.set(1, 1)
        this._blinkActive = false
      }
    } else {
      this.blinkTimer -= dt
      if (this.blinkTimer <= 0) {
        this._blinkActive = true
        this._blinkElapsed = 0
        this.sprite.scale.set(1, 0.7)
        this.blinkTimer = 2000 + Math.random() * 3000
      }
    }
  }

  /** Update label text and tint. */
  setLetter(letter: string, tint: number): void {
    this.label.text = letter
    this.label.tint = tint
  }

  /** Update sprite texture. */
  setTexture(texture: Texture): void {
    this.sprite.texture = texture
  }

  /** Get a random alien texture (already loaded by BootState). */
  static getRandomAlienTexture(wordMode: boolean): Texture {
    const paths = wordMode ? WORD_ALIEN_TEXTURE_PATHS : ALIEN_TEXTURES_PATHS
    const path = paths[Math.floor(Math.random() * paths.length)]!
    return Assets.get<Texture>(path)
  }

  /** Reset to initial state for pool recycling. */
  reset(): void {
    this.bobPhase = 0
    this.blinkTimer = 2000 + Math.random() * 3000
    this._blinkActive = false
    this._blinkElapsed = 0
    this.sprite.scale.set(1, 1)
    this.sprite.y = 0
    this.label.text = ''
    this.visible = false
  }
}
