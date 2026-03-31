import { BitmapFont, BitmapText, Container, Graphics } from 'pixi.js'
import type { SplitBitmapText } from 'pixi.js'
import type { GameState, StateName, GameContext, GameMode } from './types.js'
import { TRANSITIONS, BASE_WIDTH, BASE_HEIGHT } from './types.js'
import {
  getAvailableLetters,
  findLowestMatch,
  findLowestEntity,
  LETTER_COLORS,
} from './letters.js'
import type { LetterEntity } from './letters.js'
import type { WordEntity, WordLists } from './words.js'
import {
  loadWordLists,
  getAvailableWords,
  findActiveWord,
  matchWordKey,
} from './words.js'
import {
  updateTween,
  createHitTween,
  createMissTween,
  createBottomTween,
} from './tween.js'
import {
  DifficultyManager,
  LETTER_DIFFICULTY_CONFIG,
  WORD_DIFFICULTY_CONFIG,
} from './difficulty.js'
import { getLocale } from '../shared/i18n/index.js'

export class StateMachine {
  private states: Map<StateName, GameState>
  private _current: StateName | null = null

  constructor(states: Record<StateName, GameState>) {
    this.states = new Map(Object.entries(states) as [StateName, GameState][])
  }

  get current(): StateName | null {
    return this._current
  }

  get currentState(): GameState | undefined {
    return this._current ? this.states.get(this._current) : undefined
  }

  start(initial: StateName, ctx: GameContext): void {
    this._current = initial
    this.states.get(initial)?.enter(ctx)
  }

  transition(target: StateName, ctx: GameContext): void {
    if (this._current === null) {
      throw new Error('StateMachine not started')
    }

    const allowed = TRANSITIONS[this._current]
    if (!allowed.includes(target)) {
      throw new Error(
        `Invalid transition: ${this._current} -> ${target}. Allowed: ${allowed.join(', ')}`,
      )
    }

    const oldState = this.states.get(this._current)
    oldState?.exit(ctx)

    this._current = target
    const newState = this.states.get(target)
    newState?.enter(ctx)
  }

  update(ctx: GameContext, dt: number): void {
    this.currentState?.update(ctx, dt)
  }

  render(ctx: GameContext): void {
    this.currentState?.render(ctx)
  }
}

// --- Concrete State Classes ---

/**
 * Boot state: installs BitmapFont and transitions to menu immediately.
 */
export class BootState implements GameState {
  enter(ctx: GameContext): void {
    try {
      BitmapFont.install({
        name: 'GameFont',
        style: {
          fontFamily: 'Arial',
          fontSize: 48,
          fill: '#ffffff',
        },
      })
    } catch {
      // Font install may fail in test environments without canvas
    }
    ctx.transitionTo('menu')
  }

  exit(): void {
    // no-op
  }

  update(): void {
    // no-op
  }

  render(): void {
    // no-op
  }
}

/**
 * Menu state: shows game title and two mode selection buttons.
 */
export class MenuState implements GameState {
  private title: BitmapText | null = null
  private letterBtn: BitmapText | null = null
  private letterLabel: BitmapText | null = null
  private wordBtn: BitmapText | null = null
  private wordLabel: BitmapText | null = null

  enter(ctx: GameContext): void {
    this.title = new BitmapText({
      text: 'Keyboard Invader',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    this.title.x = BASE_WIDTH / 2 - this.title.width / 2
    this.title.y = BASE_HEIGHT * 0.2

    // Letter mode button
    this.letterBtn = new BitmapText({
      text: 'A B C',
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    this.letterBtn.anchor.set(0.5)
    this.letterBtn.x = BASE_WIDTH / 2
    this.letterBtn.y = BASE_HEIGHT * 0.45
    this.letterBtn.eventMode = 'static'
    this.letterBtn.cursor = 'pointer'
    this.letterBtn.on('pointerover', () => {
      this.letterBtn?.scale.set(1.1)
    })
    this.letterBtn.on('pointerout', () => {
      this.letterBtn?.scale.set(1.0)
    })
    this.letterBtn.on('pointertap', () => {
      ctx.setGameMode('letters')
      ctx.transitionTo('playing')
    })

    this.letterLabel = new BitmapText({
      text: 'Lettres',
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    this.letterLabel.anchor.set(0.5)
    this.letterLabel.x = BASE_WIDTH / 2
    this.letterLabel.y = BASE_HEIGHT * 0.45 + 35

    // Word mode button
    this.wordBtn = new BitmapText({
      text: 'MOT',
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    this.wordBtn.anchor.set(0.5)
    this.wordBtn.x = BASE_WIDTH / 2
    this.wordBtn.y = BASE_HEIGHT * 0.62
    this.wordBtn.eventMode = 'static'
    this.wordBtn.cursor = 'pointer'
    this.wordBtn.on('pointerover', () => {
      this.wordBtn?.scale.set(1.1)
    })
    this.wordBtn.on('pointerout', () => {
      this.wordBtn?.scale.set(1.0)
    })
    this.wordBtn.on('pointertap', () => {
      ctx.setGameMode('words')
      ctx.transitionTo('playing')
    })

    this.wordLabel = new BitmapText({
      text: 'Mots',
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    this.wordLabel.anchor.set(0.5)
    this.wordLabel.x = BASE_WIDTH / 2
    this.wordLabel.y = BASE_HEIGHT * 0.62 + 35

    ctx.gameRoot.addChild(this.title)
    ctx.gameRoot.addChild(this.letterBtn)
    ctx.gameRoot.addChild(this.letterLabel)
    ctx.gameRoot.addChild(this.wordBtn)
    ctx.gameRoot.addChild(this.wordLabel)
  }

  exit(ctx: GameContext): void {
    const items = [
      this.title,
      this.letterBtn,
      this.letterLabel,
      this.wordBtn,
      this.wordLabel,
    ]
    for (const item of items) {
      if (item) {
        ctx.gameRoot.removeChild(item)
        item.destroy()
      }
    }
    this.title = null
    this.letterBtn = null
    this.letterLabel = null
    this.wordBtn = null
    this.wordLabel = null
  }

  update(): void {
    // Menu is static
  }

  render(): void {
    // no-op
  }
}

/**
 * Playing state: spawns falling letters or words based on game mode.
 */
export class PlayingState implements GameState {
  private spawnTimer = 0
  private totalSpawned = 0
  private activeEntities: LetterEntity[] = []
  private activeWordEntities: WordEntity[] = []
  private wordLists: WordLists | null = null
  private hits = 0
  private misses = 0
  private timePlayedMs = 0
  private mode: GameMode = 'letters'
  private scoreText: BitmapText | null = null
  private difficulty!: DifficultyManager

  // Session lengths stay fixed (D-14)
  private readonly SESSION_LENGTH = 20
  private readonly WORD_SESSION_LENGTH = 15

  enter(ctx: GameContext): void {
    this.spawnTimer = 0
    this.totalSpawned = 0
    this.activeEntities = []
    this.activeWordEntities = []
    this.hits = 0
    this.misses = 0
    this.timePlayedMs = 0
    this.mode = ctx.getGameMode()
    this.difficulty = new DifficultyManager(
      this.mode === 'words' ? WORD_DIFFICULTY_CONFIG : LETTER_DIFFICULTY_CONFIG,
    )

    if (this.mode === 'words') {
      this.wordLists = loadWordLists(getLocale())
    }

    // Score counter at top-right
    this.scoreText = new BitmapText({
      text: 'Score: 0',
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    this.scoreText.x = BASE_WIDTH - 200
    this.scoreText.y = 20
    ctx.gameRoot.addChild(this.scoreText)
  }

  update(ctx: GameContext, dt: number): void {
    this.timePlayedMs += dt

    const sessionLength =
      this.mode === 'words' ? this.WORD_SESSION_LENGTH : this.SESSION_LENGTH
    const { fallSpeed, spawnInterval } = this.difficulty.params

    // --- Spawn logic ---
    this.spawnTimer += dt
    while (
      this.spawnTimer >= spawnInterval &&
      this.totalSpawned < sessionLength
    ) {
      this.spawnTimer -= spawnInterval

      if (this.mode === 'letters') {
        this._spawnLetter(ctx)
      } else {
        this._spawnWord(ctx)
      }
      this.totalSpawned++
    }

    // --- Fall logic ---
    const dtSec = dt / 1000
    for (const entity of this.activeEntities) {
      if (entity.tween === null && !entity.markedForRemoval) {
        entity.text.y += fallSpeed * dtSec
      }
    }
    for (const entity of this.activeWordEntities) {
      if (entity.tween === null && !entity.markedForRemoval) {
        entity.text.y += fallSpeed * dtSec
      }
    }

    // --- Input processing ---
    const keys = ctx.getInputBuffer()
    if (this.mode === 'letters') {
      this._processLetterInput(keys)
    } else {
      this._processWordInput(keys)
    }

    // --- Update score display ---
    if (this.scoreText) {
      this.scoreText.text = 'Score: ' + String(this.hits)
    }

    // --- Tween updates (both arrays) ---
    this._updateTweens(this.activeEntities, dt)
    this._updateWordTweens(this.activeWordEntities, dt)

    // --- Bottom detection (Pitfall 5: items reaching bottom count as misses) ---
    for (const entity of this.activeEntities) {
      if (
        entity.tween === null &&
        !entity.markedForRemoval &&
        entity.text.y > BASE_HEIGHT + 40
      ) {
        this.misses++
        this.difficulty.recordResult(false)
        entity.tween = createBottomTween()
        entity.markedForRemoval = true
      }
    }
    for (const entity of this.activeWordEntities) {
      if (
        entity.tween === null &&
        !entity.markedForRemoval &&
        entity.text.y > BASE_HEIGHT + 40
      ) {
        this.misses++
        this.difficulty.recordResult(false)
        entity.tween = createBottomTween()
        entity.markedForRemoval = true
      }
    }

    // --- Cleanup pass (reverse iteration) ---
    for (let i = this.activeEntities.length - 1; i >= 0; i--) {
      const entity = this.activeEntities[i]
      if (entity?.markedForRemoval && entity.tween === null) {
        entity.text.visible = false
        ctx.gameRoot.removeChild(entity.text)
        ctx.releasePoolItem(entity.poolIndex)
        this.activeEntities.splice(i, 1)
      }
    }
    for (let i = this.activeWordEntities.length - 1; i >= 0; i--) {
      const entity = this.activeWordEntities[i]
      if (entity?.markedForRemoval && entity.tween === null) {
        const sbt = entity.text as unknown as SplitBitmapText
        sbt.visible = false
        ctx.gameRoot.removeChild(sbt)
        ctx.releaseWordPoolItem(entity.poolIndex)
        this.activeWordEntities.splice(i, 1)
      }
    }

    // --- Push difficulty to context for debug overlay ---
    ctx.setDifficulty(this.difficulty.params)

    // --- Session end check ---
    const activeCount =
      this.mode === 'words'
        ? this.activeWordEntities.length
        : this.activeEntities.length
    if (this.totalSpawned >= sessionLength && activeCount === 0) {
      ctx.setSessionResult({
        hits: this.hits,
        misses: this.misses,
        total: sessionLength,
        timePlayed: Math.round(this.timePlayedMs),
        mode: this.mode,
      })
      ctx.transitionTo('gameover')
    }
  }

  render(): void {
    // PixiJS auto-renders scene graph
  }

  exit(ctx: GameContext): void {
    ctx.setDifficulty(null)

    // Release letter entities
    for (const entity of this.activeEntities) {
      entity.text.visible = false
      ctx.gameRoot.removeChild(entity.text)
      ctx.releasePoolItem(entity.poolIndex)
    }
    this.activeEntities = []

    // Release word entities
    for (const entity of this.activeWordEntities) {
      const sbt = entity.text as unknown as SplitBitmapText
      sbt.visible = false
      ctx.gameRoot.removeChild(sbt)
      ctx.releaseWordPoolItem(entity.poolIndex)
    }
    this.activeWordEntities = []

    // Remove score text
    if (this.scoreText) {
      ctx.gameRoot.removeChild(this.scoreText)
      this.scoreText.destroy()
      this.scoreText = null
    }

    this.spawnTimer = 0
    this.totalSpawned = 0
    this.hits = 0
    this.misses = 0
    this.timePlayedMs = 0
    this.wordLists = null
  }

  // --- Private helpers ---

  private _spawnLetter(ctx: GameContext): void {
    const available = getAvailableLetters(this.difficulty.params.complexityLevel)
    const letter =
      available[Math.floor(Math.random() * available.length)] ?? 'a'

    const { item, index } = ctx.acquirePoolItem()
    const bt = item as BitmapText

    bt.text = letter.toUpperCase()
    const colorIdx = Math.floor(Math.random() * LETTER_COLORS.length)
    bt.tint = LETTER_COLORS[colorIdx] ?? 0xffffff
    bt.scale.set(1)
    bt.alpha = 1
    bt.anchor.set(0.5)
    bt.x = 80 + Math.random() * (BASE_WIDTH - 160)
    bt.y = -40
    bt.visible = true

    ctx.gameRoot.addChild(bt)
    this.activeEntities.push({
      text: bt,
      poolIndex: index,
      letter,
      baseX: bt.x,
      originalTint: bt.tint,
      tween: null,
      markedForRemoval: false,
    })
  }

  private _spawnWord(ctx: GameContext): void {
    if (!this.wordLists) return

    const available = getAvailableWords(
      this.wordLists,
      this.difficulty.params.complexityLevel,
    )
    const word =
      available[Math.floor(Math.random() * available.length)] ?? 'mot'

    const { item, index } = ctx.acquireWordPoolItem()
    const sbt = item as SplitBitmapText

    sbt.text = word.toUpperCase()
    // Ensure chars are populated after text change
    sbt.split()

    const colorIdx = Math.floor(Math.random() * LETTER_COLORS.length)
    const tint = LETTER_COLORS[colorIdx] ?? 0xffffff

    // Reset all char tints to the chosen color
    for (const char of sbt.chars) {
      char.tint = tint
    }

    sbt.tint = 0xffffff // Container tint neutral so char tints show
    sbt.scale.set(1)
    sbt.alpha = 1

    // Constrain x to prevent edge overflow
    const wordWidth = sbt.width || 100
    const minX = wordWidth / 2 + 20
    const maxX = BASE_WIDTH - wordWidth / 2 - 20
    sbt.x = minX + Math.random() * Math.max(0, maxX - minX)
    sbt.y = -40
    sbt.visible = true

    ctx.gameRoot.addChild(sbt)
    this.activeWordEntities.push({
      text: sbt as unknown as WordEntity['text'],
      poolIndex: index,
      word: word.toLowerCase(),
      cursorIndex: 0,
      baseX: sbt.x,
      originalTint: tint,
      tween: null,
      markedForRemoval: false,
    })
  }

  private _processLetterInput(keys: string[]): void {
    for (const key of keys) {
      const match = findLowestMatch(this.activeEntities, key)
      if (match) {
        this.hits++
        this.difficulty.recordResult(true)
        match.tween = createHitTween()
        match.markedForRemoval = true
      } else {
        this.misses++
        this.difficulty.recordResult(false)
        const lowest = findLowestEntity(this.activeEntities)
        if (lowest?.tween === null) {
          lowest.tween = createMissTween()
        }
      }
    }
  }

  private _processWordInput(keys: string[]): void {
    const activeWord = findActiveWord(this.activeWordEntities)
    if (!activeWord) return

    for (const key of keys) {
      const result = matchWordKey(activeWord, key)
      if (result === 'correct') {
        // Green highlight on matched character
        const charObj = activeWord.text.chars[activeWord.cursorIndex]
        if (charObj) charObj.tint = 0x4ade80
        activeWord.cursorIndex++
        this.hits++
      } else if (result === 'complete') {
        // Green the last character, then trigger hit tween
        const charObj = activeWord.text.chars[activeWord.cursorIndex]
        if (charObj) charObj.tint = 0x4ade80
        activeWord.cursorIndex++
        this.hits++
        this.difficulty.recordResult(true)
        activeWord.tween = createHitTween()
        activeWord.markedForRemoval = true
      } else {
        // Wrong key: red flash + shake, no cursor reset
        this.misses++
        if (activeWord.tween === null) {
          activeWord.tween = createMissTween()
        }
      }
    }
  }

  private _updateTweens(entities: LetterEntity[], dt: number): void {
    for (const entity of entities) {
      if (entity.tween !== null) {
        const done = updateTween(entity, dt)
        if (done) {
          if (entity.tween.type === 'miss') {
            entity.text.tint = entity.originalTint
            entity.text.x = entity.baseX
            entity.tween = null
          } else {
            entity.tween = null
          }
        }
      }
    }
  }

  private _updateWordTweens(entities: WordEntity[], dt: number): void {
    for (const entity of entities) {
      if (entity.tween !== null) {
        const done = updateTween(entity, dt)
        if (done) {
          if (entity.tween.type === 'miss') {
            // Restore char tints after miss
            for (let i = entity.cursorIndex; i < entity.text.chars.length; i++) {
              const c = entity.text.chars[i]
              if (c) c.tint = entity.originalTint
            }
            entity.text.x = entity.baseX
            entity.tween = null
          } else {
            entity.tween = null
          }
        }
      }
    }
  }
}

/**
 * Game over / results state: shows session summary with accuracy, items, and time.
 */
export class GameOverState implements GameState {
  private container: Container | null = null

  enter(ctx: GameContext): void {
    const result = ctx.getSessionResult()
    this.container = new Container()

    // Title
    const title = new BitmapText({
      text: 'Bravo !',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.15

    // Stats
    const hits = result?.hits ?? 0
    const total = result?.total ?? 0
    const mode = result?.mode ?? ctx.getGameMode()
    const timePlayed = result?.timePlayed ?? 0
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0

    // Format time as mm:ss
    const totalSec = Math.floor(timePlayed / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`

    const itemLabel = mode === 'words' ? 'mots' : 'lettres'

    // Accuracy line
    const accuracyText = new BitmapText({
      text: `${String(accuracy)}% precision`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    accuracyText.anchor.set(0.5)
    accuracyText.x = BASE_WIDTH / 2
    accuracyText.y = BASE_HEIGHT * 0.35

    // Items line
    const itemsText = new BitmapText({
      text: `${String(total)} ${itemLabel} pratiques`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    itemsText.anchor.set(0.5)
    itemsText.x = BASE_WIDTH / 2
    itemsText.y = BASE_HEIGHT * 0.42

    // Time line
    const timeText = new BitmapText({
      text: `Temps: ${timeStr}`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    timeText.anchor.set(0.5)
    timeText.x = BASE_WIDTH / 2
    timeText.y = BASE_HEIGHT * 0.49

    // "Rejouer" button
    const replayBtn = new BitmapText({
      text: 'Rejouer',
      style: { fontFamily: 'GameFont', fontSize: 28 },
    })
    replayBtn.anchor.set(0.5)
    replayBtn.x = BASE_WIDTH / 2
    replayBtn.y = BASE_HEIGHT * 0.65
    replayBtn.eventMode = 'static'
    replayBtn.cursor = 'pointer'
    replayBtn.on('pointerover', () => {
      replayBtn.scale.set(1.1)
    })
    replayBtn.on('pointerout', () => {
      replayBtn.scale.set(1.0)
    })
    replayBtn.on('pointertap', () => {
      ctx.transitionTo('playing')
    })

    // "Menu" button
    const menuBtn = new BitmapText({
      text: 'Menu',
      style: { fontFamily: 'GameFont', fontSize: 20 },
    })
    menuBtn.anchor.set(0.5)
    menuBtn.x = BASE_WIDTH / 2
    menuBtn.y = BASE_HEIGHT * 0.78
    menuBtn.eventMode = 'static'
    menuBtn.cursor = 'pointer'
    menuBtn.on('pointerover', () => {
      menuBtn.scale.set(1.1)
    })
    menuBtn.on('pointerout', () => {
      menuBtn.scale.set(1.0)
    })
    menuBtn.on('pointertap', () => {
      ctx.transitionTo('menu')
    })

    this.container.addChild(
      title,
      accuracyText,
      itemsText,
      timeText,
      replayBtn,
      menuBtn,
    )
    ctx.gameRoot.addChild(this.container)
  }

  exit(ctx: GameContext): void {
    if (this.container) {
      ctx.gameRoot.removeChild(this.container)
      this.container.destroy({ children: true })
      this.container = null
    }
  }

  update(): void {
    /* static screen */
  }

  render(): void {
    /* no-op */
  }
}

/**
 * Paused state: shows semi-transparent overlay with "PAUSE" text.
 */
export class PausedState implements GameState {
  private overlay: Container | null = null

  enter(ctx: GameContext): void {
    this.overlay = new Container()

    const bg = new Graphics()
    bg.rect(0, 0, BASE_WIDTH, BASE_HEIGHT)
    bg.fill({ color: 0x000000, alpha: 0.5 })
    this.overlay.addChild(bg)

    const text = new BitmapText({
      text: 'PAUSE',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    text.x = BASE_WIDTH / 2 - text.width / 2
    text.y = BASE_HEIGHT / 2 - text.height / 2
    this.overlay.addChild(text)

    ctx.gameRoot.addChild(this.overlay)
  }

  exit(ctx: GameContext): void {
    if (this.overlay) {
      ctx.gameRoot.removeChild(this.overlay)
      this.overlay.destroy({ children: true })
      this.overlay = null
    }
  }

  update(): void {
    // no-op
  }

  render(): void {
    // no-op
  }
}
