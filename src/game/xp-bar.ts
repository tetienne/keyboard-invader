import { BitmapText, Container, Graphics } from 'pixi.js'
import { SPACE_PALETTE } from './theme.js'
import { t } from '../shared/i18n/index.js'

export interface XpBarConfig {
  width: number
  height: number
  showXpText: boolean
  showEarnedText: boolean
  fontSize: number
}

const FILL_COLOR = SPACE_PALETTE.accent
const BG_COLOR = SPACE_PALETTE.secondary
const ACCENT_COLOR = SPACE_PALETTE.accent

export class XpBar {
  readonly container: Container

  private readonly config: XpBarConfig
  private readonly bg: Graphics
  private readonly fill: Graphics
  private readonly levelText: BitmapText
  private readonly xpText: BitmapText | null
  private readonly earnedText: BitmapText | null

  private currentProgress = 0

  // Animation state
  private animating = false
  private animFrom = 0
  private animTo = 0
  private animDuration = 0
  private animElapsed = 0

  constructor(config: XpBarConfig) {
    this.config = config
    this.container = new Container()

    const cornerRadius = config.height / 2

    // Background pill with glow border
    this.bg = new Graphics()
    this.bg.roundRect(0, 0, config.width, config.height, cornerRadius)
    this.bg.fill(BG_COLOR)
    this.bg.roundRect(0, 0, config.width, config.height, cornerRadius)
    this.bg.stroke({ color: SPACE_PALETTE.glow, width: 1, alpha: 0.4 })
    this.container.addChild(this.bg)

    // Fill pill (initially empty)
    this.fill = new Graphics()
    this.container.addChild(this.fill)

    // Level label left of bar
    this.levelText = new BitmapText({
      text: t('progression.level').replace('{level}', '1'),
      style: { fontFamily: 'GameFont', fontSize: config.fontSize },
    })
    this.levelText.x = 0
    this.levelText.y = -(config.fontSize + 4)
    this.container.addChild(this.levelText)

    // XP fraction text right of bar (optional)
    if (config.showXpText) {
      this.xpText = new BitmapText({
        text: '0/0',
        style: { fontFamily: 'GameFont', fontSize: config.fontSize },
      })
      this.xpText.anchor.set(1, 0)
      this.xpText.x = config.width
      this.xpText.y = -(config.fontSize + 4)
      this.container.addChild(this.xpText)
    } else {
      this.xpText = null
    }

    // Earned text above bar (optional)
    if (config.showEarnedText) {
      this.earnedText = new BitmapText({
        text: '',
        style: { fontFamily: 'GameFont', fontSize: config.fontSize + 6 },
      })
      this.earnedText.tint = ACCENT_COLOR
      this.earnedText.anchor.set(0.5, 1)
      this.earnedText.x = config.width / 2
      this.earnedText.y = -(config.fontSize + 16)
      this.earnedText.visible = false
      this.container.addChild(this.earnedText)
    } else {
      this.earnedText = null
    }
  }

  /** Set bar state immediately (no animation). Used for initial display and HUD. */
  setProgress(level: number, currentXp: number, requiredXp: number): void {
    this.levelText.text = t('progression.level').replace('{level}', String(level))
    const progress = requiredXp > 0 ? Math.min(currentXp / requiredXp, 1) : 0
    this.currentProgress = progress
    this._drawFill(progress)

    if (this.xpText) {
      this.xpText.text = `${String(currentXp)}/${String(requiredXp)}`
    }
  }

  /** Set the "+N XP" earned text. Only visible if showEarnedText is true. */
  setEarnedText(xp: number): void {
    if (this.earnedText) {
      this.earnedText.text = `+${String(xp)} XP`
      this.earnedText.visible = true
    }
  }

  /** Start animated fill from current to target progress. Returns duration in ms. */
  animateFill(fromProgress: number, toProgress: number, duration: number): void {
    this.animFrom = fromProgress
    this.animTo = toProgress
    this.animDuration = duration
    this.animElapsed = 0
    this.animating = true
    this._drawFill(fromProgress)
  }

  /** Call each frame during animation. Returns true when animation complete. */
  update(dt: number): boolean {
    if (!this.animating) return true

    this.animElapsed += dt
    const rawT = Math.min(this.animElapsed / this.animDuration, 1)
    // easeOutQuad: t * (2 - t)
    const eased = rawT * (2 - rawT)
    const progress = this.animFrom + (this.animTo - this.animFrom) * eased
    this.currentProgress = progress
    this._drawFill(progress)

    if (rawT >= 1) {
      this.animating = false
      return true
    }
    return false
  }

  /** Reset fill to 0 (for level-up transitions). */
  resetFill(): void {
    this.currentProgress = 0
    this.animating = false
    this._drawFill(0)
  }

  /** Update the displayed level number. */
  setLevel(level: number): void {
    this.levelText.text = t('progression.level').replace('{level}', String(level))
  }

  /** Update the XP fraction text. */
  setXpText(current: number, required: number): void {
    if (this.xpText) {
      this.xpText.text = `${String(current)}/${String(required)}`
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  private _drawFill(progress: number): void {
    const { width, height } = this.config
    const cornerRadius = height / 2
    const fillWidth = Math.max(0, width * progress)

    this.fill.clear()
    if (fillWidth > 0) {
      this.fill.roundRect(0, 0, fillWidth, height, cornerRadius)
      this.fill.fill(FILL_COLOR)
    }
  }
}
