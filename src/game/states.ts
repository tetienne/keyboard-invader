import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/700.css'
import {
  Assets,
  BitmapFont,
  BitmapFontManager,
  BitmapText,
  Container,
  Graphics,
} from 'pixi.js'
import type { SplitBitmapText } from 'pixi.js'
import type {
  GameState,
  StateName,
  GameContext,
  GameMode,
  SessionSaveResult,
} from './types.js'
import { TRANSITIONS, BASE_WIDTH, BASE_HEIGHT } from './types.js'
import {
  getAvailableLetters,
  findLowestMatch,
  findLowestEntity,
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
  createDodgeTween,
  createEscapeTween,
} from './tween.js'
import {
  DifficultyManager,
  LETTER_DIFFICULTY_CONFIG,
  WORD_DIFFICULTY_CONFIG,
} from './difficulty.js'
import { calculateXpGain, applyXp, xpForCurrentLevel } from './progression.js'
import { XpBar } from './xp-bar.js'
import { CelebrationOverlay } from './celebration.js'
import { AVATARS } from '../avatars/definitions.js'
import { getLocale, t } from '../shared/i18n/index.js'
import {
  LETTER_COLORS,
  SPACE_PALETTE,
  UI_CONSTANTS,
  ALIEN_TEXTURES_PATHS,
  WORD_ALIEN_TEXTURE_PATHS,
  SPACESHIP_PATH,
  STAR_PARTICLE_PATH,
  AVATAR_SVG_PATHS,
  getLevelTitle,
} from './theme.js'
import { MAX_SESSION_HISTORY } from '../persistence/types.js'
import { Starfield } from './starfield.js'
import { DestructionEffect, LaserBolt } from './effects.js'
import { Defender } from './defender.js'

function drawSpacePanel(g: Graphics, x: number, y: number, w: number, h: number): void {
  g.roundRect(x, y, w, h, UI_CONSTANTS.panelCornerRadius)
  g.fill({ color: SPACE_PALETTE.secondary, alpha: UI_CONSTANTS.panelBgAlpha })
  g.roundRect(x, y, w, h, UI_CONSTANTS.panelCornerRadius)
  g.stroke({ color: SPACE_PALETTE.glow, width: UI_CONSTANTS.panelBorderWidth, alpha: UI_CONSTANTS.panelBorderAlpha })
}

function saveSessionToProfile(ctx: GameContext): SessionSaveResult | null {
  const profile = ctx.getActiveProfile()
  const result = ctx.getSessionResult()
  if (!profile || !result) return null

  const accuracy =
    result.total > 0 ? Math.round((result.hits / result.total) * 100) : 0

  // Update cumulative stats
  profile.cumulativeStats.totalSessions++
  profile.cumulativeStats.totalHits += result.hits
  profile.cumulativeStats.totalMisses += result.misses
  profile.cumulativeStats.bestAccuracy = Math.max(
    profile.cumulativeStats.bestAccuracy,
    accuracy,
  )

  // Add session summary (FIFO, max 10)
  profile.sessionHistory.push({
    hits: result.hits,
    misses: result.misses,
    accuracy,
    mode: result.mode,
    date: new Date().toISOString(),
  })
  if (profile.sessionHistory.length > MAX_SESSION_HISTORY) {
    profile.sessionHistory.shift()
  }

  // Save difficulty params for next session restoration
  profile.lastDifficultyParams = ctx.getDifficulty() ?? null

  // Save preferred game mode
  profile.preferredGameMode = ctx.getGameMode()

  // Calculate XP gain and apply to profile
  const xpGain = calculateXpGain(result.hits, result.total, result.mode)
  const levelUp = applyXp(profile.xp, profile.level, xpGain.totalXp)

  profile.xp = levelUp.remainingXp
  profile.level = levelUp.newLevel

  // Check for new avatar unlocks
  const newUnlocks: string[] = []
  for (const avatar of AVATARS) {
    if (
      avatar.unlockLevel &&
      avatar.unlockLevel <= levelUp.newLevel &&
      !profile.unlockedAvatarIds.includes(avatar.id)
    ) {
      profile.unlockedAvatarIds.push(avatar.id)
      newUnlocks.push(avatar.id)
    }
  }

  // Persist all profiles
  const repo = ctx.getProfileRepository()
  const allProfiles = repo.loadAll()
  const idx = allProfiles.findIndex((p) => p.id === profile.id)
  if (idx >= 0) {
    allProfiles[idx] = profile
  }
  repo.saveAll(allProfiles)

  const saveResult: SessionSaveResult = { xpGain, levelUp, newUnlocks }
  ctx.setSessionSaveResult(saveResult)
  return saveResult
}

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
    void (async () => {
      try {
        await document.fonts.load('400 80px Fredoka')
        await document.fonts.load('700 48px Fredoka')

        BitmapFont.install({
          name: 'GameFont',
          style: {
            fontFamily: 'Fredoka',
            fontSize: 80,
            fill: '#ffffff',
          },
          chars: BitmapFontManager.ASCII,
          resolution: 2,
        })

        BitmapFont.install({
          name: 'GameFontBold',
          style: {
            fontFamily: 'Fredoka',
            fontWeight: '700',
            fontSize: 48,
            fill: '#ffffff',
          },
          chars: BitmapFontManager.ASCII,
          resolution: 2,
        })

        const assetPaths: string[] = [
          ...ALIEN_TEXTURES_PATHS,
          ...WORD_ALIEN_TEXTURE_PATHS,
          SPACESHIP_PATH,
          STAR_PARTICLE_PATH,
          ...Object.values(AVATAR_SVG_PATHS),
        ]
        await Assets.load(assetPaths)

        ctx.transitionTo('profiles')
      } catch (err) {
        console.error('BootState: failed to load assets', err)
      }
    })()
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
  private menuContainer: Container | null = null
  private starfield: Starfield | null = null
  private bgContainer: Container | null = null

  enter(ctx: GameContext): void {
    // Background layer with starfield
    this.bgContainer = new Container()
    ctx.gameRoot.addChild(this.bgContainer)
    this.starfield = new Starfield(this.bgContainer)

    // Menu UI container
    this.menuContainer = new Container()
    ctx.gameRoot.addChild(this.menuContainer)

    const title = new BitmapText({
      text: 'Keyboard Invader',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.2
    this.menuContainer.addChild(title)

    // Letter mode button with space panel
    const letterPanelW = 200
    const letterPanelH = 70
    const letterPanel = new Graphics()
    drawSpacePanel(letterPanel, -letterPanelW / 2, -letterPanelH / 2, letterPanelW, letterPanelH)
    letterPanel.x = BASE_WIDTH / 2
    letterPanel.y = BASE_HEIGHT * 0.45
    letterPanel.eventMode = 'static'
    letterPanel.cursor = 'pointer'
    letterPanel.on('pointerover', () => letterPanel.scale.set(1.1))
    letterPanel.on('pointerout', () => letterPanel.scale.set(1.0))
    letterPanel.on('pointertap', () => {
      ctx.setGameMode('letters')
      ctx.transitionTo('playing')
    })
    this.menuContainer.addChild(letterPanel)

    const letterBtnText = new BitmapText({
      text: 'A B C',
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    letterBtnText.anchor.set(0.5)
    letterBtnText.y = -6
    letterPanel.addChild(letterBtnText)

    const letterLabel = new BitmapText({
      text: 'Lettres',
      style: { fontFamily: 'GameFont', fontSize: 14 },
    })
    letterLabel.anchor.set(0.5)
    letterLabel.y = 18
    letterPanel.addChild(letterLabel)

    // Word mode button with space panel
    const wordPanel = new Graphics()
    drawSpacePanel(wordPanel, -letterPanelW / 2, -letterPanelH / 2, letterPanelW, letterPanelH)
    wordPanel.x = BASE_WIDTH / 2
    wordPanel.y = BASE_HEIGHT * 0.62
    wordPanel.eventMode = 'static'
    wordPanel.cursor = 'pointer'
    wordPanel.on('pointerover', () => wordPanel.scale.set(1.1))
    wordPanel.on('pointerout', () => wordPanel.scale.set(1.0))
    wordPanel.on('pointertap', () => {
      ctx.setGameMode('words')
      ctx.transitionTo('playing')
    })
    this.menuContainer.addChild(wordPanel)

    const wordBtnText = new BitmapText({
      text: 'MOT',
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    wordBtnText.anchor.set(0.5)
    wordBtnText.y = -6
    wordPanel.addChild(wordBtnText)

    const wordLabel = new BitmapText({
      text: 'Mots',
      style: { fontFamily: 'GameFont', fontSize: 14 },
    })
    wordLabel.anchor.set(0.5)
    wordLabel.y = 18
    wordPanel.addChild(wordLabel)

    // "Change player" back-link
    const profileBtn = new BitmapText({
      text: t('profiles.back'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    profileBtn.anchor.set(0.5)
    profileBtn.x = BASE_WIDTH / 2
    profileBtn.y = BASE_HEIGHT * 0.85
    profileBtn.eventMode = 'static'
    profileBtn.cursor = 'pointer'
    profileBtn.on('pointerover', () => profileBtn.scale.set(1.1))
    profileBtn.on('pointerout', () => profileBtn.scale.set(1.0))
    profileBtn.on('pointertap', () => {
      ctx.transitionTo('profiles')
    })
    this.menuContainer.addChild(profileBtn)
  }

  exit(ctx: GameContext): void {
    if (this.starfield) {
      this.starfield.destroy()
      this.starfield = null
    }
    if (this.bgContainer) {
      ctx.gameRoot.removeChild(this.bgContainer)
      this.bgContainer.destroy({ children: true })
      this.bgContainer = null
    }
    if (this.menuContainer) {
      ctx.gameRoot.removeChild(this.menuContainer)
      this.menuContainer.destroy({ children: true })
      this.menuContainer = null
    }
  }

  update(_ctx: GameContext, dt: number): void {
    this.starfield?.update(dt)
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
  private hudXpBar: XpBar | null = null
  private hudLevelLabel: BitmapText | null = null

  // Visual modules
  private starfield: Starfield | null = null
  private effects: DestructionEffect | null = null
  private laser: LaserBolt | null = null
  private defender: Defender | null = null
  private bgContainer: Container | null = null
  private entitiesContainer: Container | null = null
  private effectsContainer: Container | null = null
  private defenderContainer: Container | null = null
  private hudContainer: Container | null = null

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
    const profile = ctx.getActiveProfile()
    const initialDifficulty = profile?.lastDifficultyParams ?? undefined
    this.difficulty = new DifficultyManager(
      this.mode === 'words' ? WORD_DIFFICULTY_CONFIG : LETTER_DIFFICULTY_CONFIG,
      initialDifficulty,
    )

    if (this.mode === 'words') {
      this.wordLists = loadWordLists(getLocale())
    }

    // Z-layer containers (back to front)
    this.bgContainer = new Container()
    this.entitiesContainer = new Container()
    this.effectsContainer = new Container()
    this.defenderContainer = new Container()
    this.hudContainer = new Container()
    ctx.gameRoot.addChild(this.bgContainer)
    ctx.gameRoot.addChild(this.entitiesContainer)
    ctx.gameRoot.addChild(this.effectsContainer)
    ctx.gameRoot.addChild(this.defenderContainer)
    ctx.gameRoot.addChild(this.hudContainer)

    // Visual modules
    this.starfield = new Starfield(this.bgContainer)
    this.effects = new DestructionEffect(this.effectsContainer)
    this.laser = new LaserBolt(this.effectsContainer)
    this.defender = new Defender(this.defenderContainer)

    // Score counter at top-right
    this.scoreText = new BitmapText({
      text: 'Score: 0',
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    this.scoreText.x = BASE_WIDTH - 200
    this.scoreText.y = 20
    this.hudContainer.addChild(this.scoreText)

    // HUD XP bar (top-left)
    if (profile) {
      this.hudLevelLabel = new BitmapText({
        text: `Niv. ${String(profile.level)}`,
        style: { fontFamily: 'GameFont', fontSize: 18 },
      })
      this.hudLevelLabel.x = 16
      this.hudLevelLabel.y = 4
      this.hudContainer.addChild(this.hudLevelLabel)

      this.hudXpBar = new XpBar({
        width: 140,
        height: 10,
        showXpText: false,
        showEarnedText: false,
        fontSize: 18,
      })
      this.hudXpBar.container.x = 16
      this.hudXpBar.container.y = 24
      const progress = xpForCurrentLevel(profile.xp, profile.level)
      this.hudXpBar.setProgress(
        profile.level,
        progress.current,
        progress.required > 0 ? progress.required : 1,
      )
      this.hudContainer.addChild(this.hudXpBar.container)
    }
  }

  update(ctx: GameContext, dt: number): void {
    this.timePlayedMs += dt

    // Update visual modules
    this.starfield?.update(dt)
    this.effects?.update(dt)
    this.laser?.update(dt)
    this.defender?.update(dt)

    const sessionLength =
      this.mode === 'words' ? this.WORD_SESSION_LENGTH : this.SESSION_LENGTH
    const { fallSpeed, spawnInterval } = this.difficulty.params

    // Update starfield intensity based on difficulty
    this.starfield?.setIntensity(this.difficulty.params.complexityLevel)

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

    // --- Bottom detection: use escape tween instead of bottom tween ---
    for (const entity of this.activeEntities) {
      if (
        entity.tween === null &&
        !entity.markedForRemoval &&
        entity.text.y > BASE_HEIGHT + 40
      ) {
        this.misses++
        this.difficulty.recordResult(false)
        entity.tween = createEscapeTween()
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
        entity.tween = createEscapeTween()
        entity.markedForRemoval = true
      }
    }

    // --- Cleanup pass (reverse iteration) ---
    for (let i = this.activeEntities.length - 1; i >= 0; i--) {
      const entity = this.activeEntities[i]
      if (entity?.markedForRemoval && entity.tween === null) {
        entity.text.visible = false
        if (this.entitiesContainer) {
          this.entitiesContainer.removeChild(entity.text)
        } else {
          ctx.gameRoot.removeChild(entity.text)
        }
        ctx.releasePoolItem(entity.poolIndex)
        this.activeEntities.splice(i, 1)
      }
    }
    for (let i = this.activeWordEntities.length - 1; i >= 0; i--) {
      const entity = this.activeWordEntities[i]
      if (entity?.markedForRemoval && entity.tween === null) {
        const sbt = entity.text as unknown as SplitBitmapText
        sbt.visible = false
        if (this.entitiesContainer) {
          this.entitiesContainer.removeChild(sbt)
        } else {
          ctx.gameRoot.removeChild(sbt)
        }
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
      if (this.entitiesContainer) {
        this.entitiesContainer.removeChild(entity.text)
      }
      ctx.releasePoolItem(entity.poolIndex)
    }
    this.activeEntities = []

    // Release word entities
    for (const entity of this.activeWordEntities) {
      const sbt = entity.text as unknown as SplitBitmapText
      sbt.visible = false
      if (this.entitiesContainer) {
        this.entitiesContainer.removeChild(sbt)
      }
      ctx.releaseWordPoolItem(entity.poolIndex)
    }
    this.activeWordEntities = []

    // Destroy visual modules
    if (this.starfield) { this.starfield.destroy(); this.starfield = null }
    if (this.effects) { this.effects.clear(); this.effects = null }
    if (this.laser) { this.laser = null }
    if (this.defender) { this.defender.destroy(); this.defender = null }

    // Remove score/HUD (already children of containers that will be destroyed)
    this.scoreText = null
    this.hudXpBar?.destroy()
    this.hudXpBar = null
    this.hudLevelLabel = null

    // Destroy z-layer containers
    const containers = [this.bgContainer, this.entitiesContainer, this.effectsContainer, this.defenderContainer, this.hudContainer]
    for (const c of containers) {
      if (c) {
        ctx.gameRoot.removeChild(c)
        c.destroy({ children: true })
      }
    }
    this.bgContainer = null
    this.entitiesContainer = null
    this.effectsContainer = null
    this.defenderContainer = null
    this.hudContainer = null

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

    const parent = this.entitiesContainer ?? ctx.gameRoot
    parent.addChild(bt)
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

    const wordParent = this.entitiesContainer ?? ctx.gameRoot
    wordParent.addChild(sbt)
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

        // Fire laser from defender to target
        if (this.defender && this.laser) {
          const defPos = this.defender.getPosition()
          this.laser.fire(defPos.x, defPos.y, match.text.x, match.text.y)
        }
        // Destruction burst at alien position
        this.effects?.burst(match.text.x, match.text.y, match.originalTint)

        match.tween = createHitTween()
        match.markedForRemoval = true
      } else {
        this.misses++
        this.difficulty.recordResult(false)
        const lowest = findLowestEntity(this.activeEntities)
        if (lowest?.tween === null) {
          lowest.tween = createDodgeTween()
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

        // Fire laser from defender to target
        if (this.defender && this.laser) {
          const defPos = this.defender.getPosition()
          this.laser.fire(defPos.x, defPos.y, activeWord.text.x, activeWord.text.y)
        }
        // Destruction burst
        this.effects?.burst(activeWord.text.x, activeWord.text.y, activeWord.originalTint)

        activeWord.tween = createHitTween()
        activeWord.markedForRemoval = true
      } else {
        // Wrong key: dodge animation, no cursor reset
        this.misses++
        if (activeWord.tween === null) {
          activeWord.tween = createDodgeTween()
        }
      }
    }
  }

  private _updateTweens(entities: LetterEntity[], dt: number): void {
    for (const entity of entities) {
      if (entity.tween !== null) {
        const done = updateTween(entity, dt)
        if (done) {
          if (entity.tween.type === 'miss' || entity.tween.type === 'dodge') {
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
          if (entity.tween.type === 'miss' || entity.tween.type === 'dodge') {
            // Restore char tints after miss/dodge
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

type ResultsPhase = 'stats' | 'xp-filling' | 'celebrating' | 'xp-resetting' | 'done'

/**
 * Game over / results state: shows session summary with accuracy, items, time,
 * XP earned, and animated XP bar.
 */
export class GameOverState implements GameState {
  private container: Container | null = null
  private bgContainer: Container | null = null
  private starfield: Starfield | null = null
  private xpBar: XpBar | null = null
  private resultsPhase: ResultsPhase = 'stats'
  private phaseTimer = 0
  private pendingLevelUps = 0
  private currentDisplayLevel = 1
  private saveResult: SessionSaveResult | null = null
  private targetProgress = 0
  private targetXpCurrent = 0
  private targetXpRequired = 0
  private celebration: CelebrationOverlay | null = null

  enter(ctx: GameContext): void {
    const result = ctx.getSessionResult()
    this.saveResult = saveSessionToProfile(ctx)

    // Starfield background
    this.bgContainer = new Container()
    ctx.gameRoot.addChild(this.bgContainer)
    this.starfield = new Starfield(this.bgContainer)

    this.container = new Container()

    // Title
    const title = new BitmapText({
      text: 'Bravo !',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.15

    // Level title under title
    const profile = ctx.getActiveProfile()
    if (profile) {
      const levelTitle = getLevelTitle(profile.level, getLocale())
      const levelTitleText = new BitmapText({
        text: `${levelTitle} - Niv. ${String(profile.level)}`,
        style: { fontFamily: 'GameFont', fontSize: 18 },
      })
      levelTitleText.tint = SPACE_PALETTE.glow
      levelTitleText.anchor.set(0.5)
      levelTitleText.x = BASE_WIDTH / 2
      levelTitleText.y = BASE_HEIGHT * 0.22
      this.container.addChild(levelTitleText)
    }

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

    // Accuracy line (shifted up per UI-SPEC: 0.30)
    const accuracyText = new BitmapText({
      text: `${String(accuracy)}% precision`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    accuracyText.anchor.set(0.5)
    accuracyText.x = BASE_WIDTH / 2
    accuracyText.y = BASE_HEIGHT * 0.30

    // Items line (shifted up: 0.36)
    const itemsText = new BitmapText({
      text: `${String(total)} ${itemLabel} pratiques`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    itemsText.anchor.set(0.5)
    itemsText.x = BASE_WIDTH / 2
    itemsText.y = BASE_HEIGHT * 0.36

    // Time line (shifted up: 0.42)
    const timeText = new BitmapText({
      text: `Temps: ${timeStr}`,
      style: { fontFamily: 'GameFont', fontSize: 22 },
    })
    timeText.anchor.set(0.5)
    timeText.x = BASE_WIDTH / 2
    timeText.y = BASE_HEIGHT * 0.42

    // XP earned text at 0.50 (accent color)
    if (this.saveResult) {
      const xpEarnedText = new BitmapText({
        text: `+${String(this.saveResult.xpGain.totalXp)} XP`,
        style: { fontFamily: 'GameFont', fontSize: 28 },
      })
      xpEarnedText.tint = 0xe94560
      xpEarnedText.anchor.set(0.5)
      xpEarnedText.x = BASE_WIDTH / 2
      xpEarnedText.y = BASE_HEIGHT * 0.50
      this.container.addChild(xpEarnedText)
    }

    // XP bar at 0.56 (results variant, centered)
    this.xpBar = new XpBar({
      width: 320,
      height: 20,
      showXpText: true,
      showEarnedText: false,
      fontSize: 22,
    })
    this.xpBar.container.x = BASE_WIDTH / 2 - 160
    this.xpBar.container.y = BASE_HEIGHT * 0.56

    // Calculate initial bar state (before XP was added)
    if (this.saveResult) {
      const prevLevel = this.saveResult.levelUp.previousLevel
      const prevTotalXp = this.saveResult.levelUp.remainingXp - this.saveResult.xpGain.totalXp
      const prevProgress = xpForCurrentLevel(prevTotalXp, prevLevel)
      this.xpBar.setProgress(
        prevLevel,
        Math.max(0, prevProgress.current),
        prevProgress.required > 0 ? prevProgress.required : 1,
      )
      this.pendingLevelUps = this.saveResult.levelUp.levelsGained
      this.currentDisplayLevel = prevLevel

      // Pre-compute target for the fill animation
      if (this.pendingLevelUps > 0) {
        // First fill goes to 100% at current level
        this.targetProgress = 1.0
      } else {
        // Fill to new position at same level
        const newProgress = xpForCurrentLevel(
          this.saveResult.levelUp.remainingXp,
          this.saveResult.levelUp.newLevel,
        )
        this.targetProgress = newProgress.required > 0
          ? newProgress.current / newProgress.required
          : 0
        this.targetXpCurrent = newProgress.current
        this.targetXpRequired = newProgress.required
      }
    } else {
      this.xpBar.setProgress(1, 0, 1)
      this.pendingLevelUps = 0
      this.currentDisplayLevel = 1
    }

    this.container.addChild(this.xpBar.container)

    // "Rejouer" button (shifted down: 0.70)
    const replayBtn = new BitmapText({
      text: 'Rejouer',
      style: { fontFamily: 'GameFont', fontSize: 28 },
    })
    replayBtn.anchor.set(0.5)
    replayBtn.x = BASE_WIDTH / 2
    replayBtn.y = BASE_HEIGHT * 0.70
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

    // "Menu" button (shifted down: 0.80)
    const menuBtn = new BitmapText({
      text: 'Menu',
      style: { fontFamily: 'GameFont', fontSize: 20 },
    })
    menuBtn.anchor.set(0.5)
    menuBtn.x = BASE_WIDTH / 2
    menuBtn.y = BASE_HEIGHT * 0.80
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

    // Initialize animation phase
    this.resultsPhase = 'stats'
    this.phaseTimer = 0
  }

  exit(ctx: GameContext): void {
    if (this.starfield) {
      this.starfield.destroy()
      this.starfield = null
    }
    if (this.bgContainer) {
      ctx.gameRoot.removeChild(this.bgContainer)
      this.bgContainer.destroy({ children: true })
      this.bgContainer = null
    }
    if (this.xpBar) {
      this.xpBar.destroy()
      this.xpBar = null
    }
    if (this.container) {
      ctx.gameRoot.removeChild(this.container)
      this.container.destroy({ children: true })
      this.container = null
    }
    if (this.celebration) {
      this.celebration.destroy()
      this.celebration = null
    }
    this.saveResult = null
    this.resultsPhase = 'stats'
    this.phaseTimer = 0
    this.pendingLevelUps = 0
  }

  update(_ctx: GameContext, dt: number): void {
    this.starfield?.update(dt)
    if (!this.xpBar) return

    switch (this.resultsPhase) {
      case 'stats': {
        // Wait 300ms before starting fill animation
        this.phaseTimer += dt
        if (this.phaseTimer >= 300 && this.saveResult) {
          const prevTotalXp = this.saveResult.levelUp.remainingXp - this.saveResult.xpGain.totalXp
          const prevProgress = xpForCurrentLevel(prevTotalXp, this.currentDisplayLevel)
          const fromProgress = prevProgress.required > 0
            ? Math.max(0, prevProgress.current) / prevProgress.required
            : 0
          const toProgress = this.targetProgress
          const duration = Math.max(200, 800 * Math.abs(toProgress - fromProgress))
          this.xpBar.animateFill(fromProgress, toProgress, duration)
          this.resultsPhase = 'xp-filling'
        }
        break
      }
      case 'xp-filling': {
        const done = this.xpBar.update(dt)
        if (done) {
          if (this.pendingLevelUps > 0) {
            // Level up: show celebration (placeholder: 2500ms pause)
            this.phaseTimer = 0
            this.resultsPhase = 'celebrating'
          } else {
            // Update final XP text
            this.xpBar.setXpText(this.targetXpCurrent, this.targetXpRequired)
            this.resultsPhase = 'done'
          }
        }
        break
      }
      case 'celebrating': {
        // Create celebration overlay if not already active
        if (!this.celebration && this.container) {
          this.celebration = new CelebrationOverlay(this.currentDisplayLevel + 1)
          this.container.addChild(this.celebration.container)
        }

        // Update celebration; when done, advance level-up sequence
        if (this.celebration) {
          const celebrationDone = this.celebration.update(dt)
          if (celebrationDone) {
            this.container?.removeChild(this.celebration.container)
            this.celebration.destroy()
            this.celebration = null

            this.pendingLevelUps--
            this.currentDisplayLevel++
            this.xpBar.resetFill()
            this.xpBar.setLevel(this.currentDisplayLevel)

            // Compute the target for remaining XP at new level
            if (this.pendingLevelUps > 0) {
              // More level-ups: fill to 100% again
              this.targetProgress = 1.0
            } else {
              // Final level: fill to actual remaining progress
              const newProgress = xpForCurrentLevel(
                this.saveResult!.levelUp.remainingXp,
                this.saveResult!.levelUp.newLevel,
              )
              this.targetProgress = newProgress.required > 0
                ? newProgress.current / newProgress.required
                : 0
              this.targetXpCurrent = newProgress.current
              this.targetXpRequired = newProgress.required
            }
            this.resultsPhase = 'xp-resetting'
            this.phaseTimer = 0
          }
        }
        break
      }
      case 'xp-resetting': {
        // Brief pause then start fill for remaining XP
        this.phaseTimer += dt
        if (this.phaseTimer >= 200) {
          const toProgress = this.targetProgress
          const duration = Math.max(200, 800 * toProgress)
          this.xpBar.animateFill(0, toProgress, duration)
          this.resultsPhase = 'xp-filling'
        }
        break
      }
      case 'done':
        // Buttons already active
        break
    }
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
