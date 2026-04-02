import { BitmapText, Container, Graphics } from 'pixi.js'
import type { GameState, GameContext } from './types.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import type { ProfileData } from '../persistence/types.js'
import {
  MAX_PROFILES,
  DEFAULT_UNLOCKED_AVATARS,
  generateProfileId,
  createDefaultStats,
} from '../persistence/types.js'
import { AVATARS } from '../avatars/definitions.js'
import type { AvatarDefinition } from '../avatars/definitions.js'
import { drawAvatar } from '../avatars/renderer.js'
import { t } from '../shared/i18n/index.js'
import type { TranslationKey } from '../shared/i18n/index.js'

export class ProfileState implements GameState {
  private _container: Container | null = null
  private _profiles: ProfileData[] = []
  private _editTarget: ProfileData | null = null
  private _selectedAvatarId: string | null = null
  private _nameInput: HTMLInputElement | null = null
  private _lockedTooltip: BitmapText | null = null
  private _tooltipTimer = 0

  enter(ctx: GameContext): void {
    this._container = new Container()
    ctx.gameRoot.addChild(this._container)

    this._profiles = ctx.getProfileRepository().loadAll()

    if (this._profiles.length === 0) {
      this._renderCreateView(ctx)
    } else {
      this._renderSelectView(ctx)
    }
  }

  exit(ctx: GameContext): void {
    this._removeInput()
    this._lockedTooltip = null
    this._tooltipTimer = 0
    if (this._container) {
      ctx.gameRoot.removeChild(this._container)
      this._container.destroy({ children: true })
      this._container = null
    }
    this._editTarget = null
    this._selectedAvatarId = null
  }

  update(_ctx: GameContext, dt: number): void {
    // Fade out locked avatar tooltip
    if (this._lockedTooltip && this._tooltipTimer > 0) {
      this._tooltipTimer -= dt
      if (this._tooltipTimer <= 0) {
        this._lockedTooltip.alpha = 0
        this._lockedTooltip = null
      } else if (this._tooltipTimer < 500) {
        // Fade over last 500ms
        this._lockedTooltip.alpha = this._tooltipTimer / 500
      }
    }
  }

  render(): void {
    // no-op
  }

  // --- Sub-views ---

  private _clearView(): void {
    this._removeInput()
    if (this._container) {
      const removed = this._container.removeChildren()
      for (const child of removed) child.destroy({ children: true })
    }
  }

  private _renderSelectView(ctx: GameContext): void {
    this._clearView()
    if (!this._container) return

    // Title
    const title = new BitmapText({
      text: t('profiles.title'),
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.1
    this._container.addChild(title)

    // Avatar grid: horizontal row centered
    const avatarSize = 100
    const spacing = 160
    const totalWidth =
      this._profiles.length * spacing +
      (this._profiles.length < MAX_PROFILES ? spacing : 0)
    const startX = (BASE_WIDTH - totalWidth) / 2 + spacing / 2

    for (let i = 0; i < this._profiles.length; i++) {
      const profile = this._profiles[i]!
      const avatarDef = AVATARS.find((a) => a.id === profile.avatarId)
      const x = startX + i * spacing
      const y = BASE_HEIGHT * 0.4

      // Avatar graphic
      const avatarContainer = new Container()
      avatarContainer.x = x
      avatarContainer.y = y

      if (avatarDef) {
        const g = new Graphics()
        drawAvatar(g, avatarDef, avatarSize)
        avatarContainer.addChild(g)
      }

      // Level badge at bottom-right
      const badgeX = avatarSize / 2 - 8
      const badgeY = avatarSize / 2 - 8
      const badge = new Graphics()
      badge.circle(badgeX, badgeY, 12)
      badge.fill(0x16213e)
      badge.stroke({ color: 0xffffff, width: 1 })
      avatarContainer.addChild(badge)

      const badgeText = new BitmapText({
        text: String(profile.level ?? 1),
        style: { fontFamily: 'GameFont', fontSize: 18 },
      })
      badgeText.anchor.set(0.5)
      badgeText.x = badgeX
      badgeText.y = badgeY
      avatarContainer.addChild(badgeText)

      avatarContainer.eventMode = 'static'
      avatarContainer.cursor = 'pointer'
      avatarContainer.on('pointerover', () => {
        avatarContainer.scale.set(1.15)
      })
      avatarContainer.on('pointerout', () => {
        avatarContainer.scale.set(1.0)
      })
      avatarContainer.on('pointertap', () => {
        this._selectProfile(ctx, profile)
      })
      this._container.addChild(avatarContainer)

      // Profile name below avatar
      const nameText = new BitmapText({
        text: profile.name,
        style: { fontFamily: 'GameFont', fontSize: 18 },
      })
      nameText.anchor.set(0.5)
      nameText.x = x
      nameText.y = y + avatarSize / 2 + 15
      this._container.addChild(nameText)

      // Edit button
      const editBtn = new BitmapText({
        text: t('profiles.edit'),
        style: { fontFamily: 'GameFont', fontSize: 14 },
      })
      editBtn.anchor.set(0.5)
      editBtn.x = x
      editBtn.y = y + avatarSize / 2 + 40
      editBtn.eventMode = 'static'
      editBtn.cursor = 'pointer'
      editBtn.on('pointerover', () => editBtn.scale.set(1.1))
      editBtn.on('pointerout', () => editBtn.scale.set(1.0))
      editBtn.on('pointertap', () => {
        this._editTarget = profile
        this._renderEditView(ctx, profile)
      })
      this._container.addChild(editBtn)

      // Delete button
      const deleteBtn = new BitmapText({
        text: t('profiles.delete'),
        style: { fontFamily: 'GameFont', fontSize: 14 },
      })
      deleteBtn.anchor.set(0.5)
      deleteBtn.x = x
      deleteBtn.y = y + avatarSize / 2 + 60
      deleteBtn.eventMode = 'static'
      deleteBtn.cursor = 'pointer'
      deleteBtn.on('pointerover', () => deleteBtn.scale.set(1.1))
      deleteBtn.on('pointerout', () => deleteBtn.scale.set(1.0))
      deleteBtn.on('pointertap', () => {
        this._editTarget = profile
        this._renderDeleteConfirmView(ctx, profile)
      })
      this._container.addChild(deleteBtn)
    }

    // "New player" button (if not at max)
    if (this._profiles.length < MAX_PROFILES) {
      const newX = startX + this._profiles.length * spacing
      const newY = BASE_HEIGHT * 0.4

      const plusBtn = new BitmapText({
        text: '+',
        style: { fontFamily: 'GameFont', fontSize: 48 },
      })
      plusBtn.anchor.set(0.5)
      plusBtn.x = newX
      plusBtn.y = newY
      plusBtn.eventMode = 'static'
      plusBtn.cursor = 'pointer'
      plusBtn.on('pointerover', () => plusBtn.scale.set(1.15))
      plusBtn.on('pointerout', () => plusBtn.scale.set(1.0))
      plusBtn.on('pointertap', () => {
        this._renderCreateView(ctx)
      })
      this._container.addChild(plusBtn)

      const newLabel = new BitmapText({
        text: t('profiles.new'),
        style: { fontFamily: 'GameFont', fontSize: 14 },
      })
      newLabel.anchor.set(0.5)
      newLabel.x = newX
      newLabel.y = newY + 40
      this._container.addChild(newLabel)
    }
  }

  private _selectProfile(ctx: GameContext, profile: ProfileData): void {
    ctx.setActiveProfile(profile)
    if (profile.preferredGameMode) {
      ctx.setGameMode(profile.preferredGameMode)
    }
    ctx.transitionTo('menu')
  }

  private _renderCreateView(ctx: GameContext): void {
    this._selectedAvatarId = null
    this._renderProfileForm(ctx, {
      titleKey: 'profiles.create.title',
      initialName: '',
      initialAvatarId: null,
      unlockedAvatarIds: [...DEFAULT_UNLOCKED_AVATARS],
      onConfirm: (name) => {
        const newProfile: ProfileData = {
          id: generateProfileId(),
          name,
          avatarId: this._selectedAvatarId!,
          cumulativeStats: createDefaultStats(),
          lastDifficultyParams: null,
          preferredGameMode: null,
          sessionHistory: [],
          createdAt: new Date().toISOString(),
          xp: 0,
          level: 1,
          unlockedAvatarIds: [...DEFAULT_UNLOCKED_AVATARS],
        }
        this._profiles.push(newProfile)
        ctx.getProfileRepository().saveAll(this._profiles)
        this._selectProfile(ctx, newProfile)
      },
    })
  }

  private _renderEditView(ctx: GameContext, profile: ProfileData): void {
    this._selectedAvatarId = profile.avatarId
    this._renderProfileForm(ctx, {
      titleKey: 'profiles.edit',
      initialName: profile.name,
      initialAvatarId: profile.avatarId,
      unlockedAvatarIds: profile.unlockedAvatarIds ?? [...DEFAULT_UNLOCKED_AVATARS],
      onConfirm: (name) => {
        profile.name = name
        profile.avatarId = this._selectedAvatarId!
        ctx.getProfileRepository().saveAll(this._profiles)
        this._renderSelectView(ctx)
      },
    })
  }

  private _renderProfileForm(
    ctx: GameContext,
    opts: {
      titleKey: TranslationKey
      initialName: string
      initialAvatarId: string | null
      unlockedAvatarIds: string[]
      onConfirm: (name: string) => void
    },
  ): void {
    this._clearView()
    if (!this._container) return

    const title = new BitmapText({
      text: t(opts.titleKey),
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.08
    this._container.addChild(title)

    const nameLabel = new BitmapText({
      text: t('profiles.create.name'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    nameLabel.anchor.set(0.5)
    nameLabel.x = BASE_WIDTH / 2
    nameLabel.y = BASE_HEIGHT * 0.2
    this._container.addChild(nameLabel)

    this._createNameInput(opts.initialName)

    const avatarLabel = new BitmapText({
      text: t('profiles.create.avatar'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    avatarLabel.anchor.set(0.5)
    avatarLabel.x = BASE_WIDTH / 2
    avatarLabel.y = BASE_HEIGHT * 0.4
    this._container.addChild(avatarLabel)

    this._renderAvatarGrid(opts.initialAvatarId, opts.unlockedAvatarIds)

    const confirmBtn = new BitmapText({
      text: t('profiles.create.confirm'),
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    confirmBtn.anchor.set(0.5)
    confirmBtn.x = BASE_WIDTH / 2
    confirmBtn.y = BASE_HEIGHT * 0.78
    confirmBtn.eventMode = 'static'
    confirmBtn.cursor = 'pointer'
    confirmBtn.on('pointerover', () => confirmBtn.scale.set(1.1))
    confirmBtn.on('pointerout', () => confirmBtn.scale.set(1.0))
    confirmBtn.on('pointertap', () => {
      const name = this._nameInput?.value.trim() ?? ''
      if (name.length === 0 || !this._selectedAvatarId) return
      opts.onConfirm(name)
    })
    this._container.addChild(confirmBtn)
  }

  private _renderAvatarGrid(
    initialSelectedId: string | null,
    unlockedAvatarIds: string[] = [...DEFAULT_UNLOCKED_AVATARS],
  ): void {
    if (!this._container) return

    const avatarSize = 70
    const spacing = 110
    const totalWidth = AVATARS.length * spacing
    const startX = (BASE_WIDTH - totalWidth) / 2 + spacing / 2
    const highlightGraphics: Graphics[] = []

    for (let i = 0; i < AVATARS.length; i++) {
      const def = AVATARS[i]!
      const x = startX + i * spacing
      const y = BASE_HEIGHT * 0.55

      const isLocked =
        def.unlockLevel !== undefined &&
        !unlockedAvatarIds.includes(def.id)

      const avatarContainer = new Container()
      avatarContainer.x = x
      avatarContainer.y = y

      const highlight = new Graphics()
      highlight.circle(0, 0, avatarSize / 2 + 8)
      highlight.fill({ color: 0xffffff, alpha: 0.3 })
      highlight.visible = !isLocked && def.id === initialSelectedId
      avatarContainer.addChild(highlight)
      highlightGraphics.push(highlight)

      const g = new Graphics()
      drawAvatar(g, def, avatarSize)
      avatarContainer.addChild(g)

      if (isLocked) {
        // Grayed out appearance
        g.alpha = 0.3
        g.tint = 0x666666

        // Lock icon overlay
        const lock = new Graphics()
        // Body rect
        lock.rect(-8, -3, 16, 14)
        lock.fill({ color: 0xffffff, alpha: 0.8 })
        // Shackle arc
        lock.arc(0, -3, 6, Math.PI, 0)
        lock.stroke({ color: 0xffffff, width: 2 })
        avatarContainer.addChild(lock)

        // Level label below avatar
        const levelLabel = new BitmapText({
          text: t('progression.avatar.locked').replace(
            '{level}',
            String(def.unlockLevel),
          ),
          style: { fontFamily: 'GameFont', fontSize: 18 },
        })
        levelLabel.tint = 0xa0aec0
        levelLabel.anchor.set(0.5)
        levelLabel.x = 0
        levelLabel.y = avatarSize / 2 + 12
        avatarContainer.addChild(levelLabel)

        // Locked avatar tap: show encouraging message
        avatarContainer.eventMode = 'static'
        avatarContainer.cursor = 'default'
        avatarContainer.on('pointertap', () => {
          this._showLockedTooltip(
            x,
            y + avatarSize / 2 + 32,
            def.unlockLevel!,
          )
        })
      } else {
        // Unlocked: selectable
        avatarContainer.eventMode = 'static'
        avatarContainer.cursor = 'pointer'
        avatarContainer.on('pointerover', () =>
          avatarContainer.scale.set(1.15),
        )
        avatarContainer.on('pointerout', () => avatarContainer.scale.set(1.0))
        avatarContainer.on('pointertap', () => {
          this._selectedAvatarId = def.id
          for (const h of highlightGraphics) h.visible = false
          highlight.visible = true
        })
      }

      this._container.addChild(avatarContainer)
    }
  }

  private _showLockedTooltip(x: number, y: number, level: number): void {
    // Remove previous tooltip
    if (this._lockedTooltip && this._container) {
      this._container.removeChild(this._lockedTooltip)
      this._lockedTooltip.destroy()
    }

    const msg = t('progression.avatar.locked.message').replace(
      '{level}',
      String(level),
    )
    this._lockedTooltip = new BitmapText({
      text: msg,
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    this._lockedTooltip.tint = 0xa0aec0
    this._lockedTooltip.anchor.set(0.5)
    this._lockedTooltip.x = x
    this._lockedTooltip.y = y
    this._lockedTooltip.alpha = 1

    this._container?.addChild(this._lockedTooltip)
    this._tooltipTimer = 2000
  }

  private _renderDeleteConfirmView(
    ctx: GameContext,
    profile: ProfileData,
  ): void {
    this._clearView()
    if (!this._container) return

    // Show profile name and avatar
    const avatarDef = AVATARS.find((a) => a.id === profile.avatarId)
    if (avatarDef) {
      const g = new Graphics()
      drawAvatar(g, avatarDef, 80)
      g.x = BASE_WIDTH / 2
      g.y = BASE_HEIGHT * 0.25
      this._container.addChild(g)
    }

    const nameText = new BitmapText({
      text: profile.name,
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    nameText.anchor.set(0.5)
    nameText.x = BASE_WIDTH / 2
    nameText.y = BASE_HEIGHT * 0.38
    this._container.addChild(nameText)

    // Confirmation text
    const confirmText = new BitmapText({
      text: t('profiles.delete.confirm'),
      style: { fontFamily: 'GameFont', fontSize: 28 },
    })
    confirmText.anchor.set(0.5)
    confirmText.x = BASE_WIDTH / 2
    confirmText.y = BASE_HEIGHT * 0.5
    this._container.addChild(confirmText)

    // Yes button
    const yesBtn = new BitmapText({
      text: t('profiles.delete.yes'),
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    yesBtn.anchor.set(0.5)
    yesBtn.x = BASE_WIDTH / 2 - 80
    yesBtn.y = BASE_HEIGHT * 0.65
    yesBtn.eventMode = 'static'
    yesBtn.cursor = 'pointer'
    yesBtn.on('pointerover', () => yesBtn.scale.set(1.1))
    yesBtn.on('pointerout', () => yesBtn.scale.set(1.0))
    yesBtn.on('pointertap', () => {
      this._profiles = this._profiles.filter((p) => p.id !== profile.id)
      ctx.getProfileRepository().saveAll(this._profiles)

      // Clear active profile if it was the deleted one
      if (ctx.getActiveProfile()?.id === profile.id) {
        ctx.setActiveProfile(null)
      }

      if (this._profiles.length === 0) {
        this._renderCreateView(ctx)
      } else {
        this._renderSelectView(ctx)
      }
    })
    this._container.addChild(yesBtn)

    // No button
    const noBtn = new BitmapText({
      text: t('profiles.delete.no'),
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    noBtn.anchor.set(0.5)
    noBtn.x = BASE_WIDTH / 2 + 80
    noBtn.y = BASE_HEIGHT * 0.65
    noBtn.eventMode = 'static'
    noBtn.cursor = 'pointer'
    noBtn.on('pointerover', () => noBtn.scale.set(1.1))
    noBtn.on('pointerout', () => noBtn.scale.set(1.0))
    noBtn.on('pointertap', () => {
      this._renderSelectView(ctx)
    })
    this._container.addChild(noBtn)
  }

  // --- HTML input helpers ---

  private _createNameInput(initialValue: string): void {
    this._removeInput()
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 12
    input.value = initialValue
    input.placeholder = t('profiles.create.name')
    input.style.position = 'absolute'
    input.style.left = '50%'
    input.style.top = '30%'
    input.style.transform = 'translateX(-50%)'
    input.style.fontSize = '24px'
    input.style.textAlign = 'center'
    input.style.maxWidth = '200px'
    input.style.padding = '8px'
    input.style.borderRadius = '8px'
    input.style.border = '2px solid #a855f7'
    input.style.outline = 'none'
    input.style.fontFamily = 'Arial, sans-serif'
    input.style.backgroundColor = '#1a1a2e'
    input.style.color = '#ffffff'

    const container = document.getElementById('game-container')
    if (container) {
      container.appendChild(input)
    }
    this._nameInput = input
    // Focus after a tick to ensure it's in DOM
    setTimeout(() => input.focus(), 50)
  }

  private _removeInput(): void {
    if (this._nameInput) {
      this._nameInput.remove()
      this._nameInput = null
    }
  }
}
