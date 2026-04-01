import { BitmapText, Container, Graphics } from 'pixi.js'
import type { GameState, GameContext } from './types.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import type { ProfileData } from '../persistence/types.js'
import {
  MAX_PROFILES,
  generateProfileId,
  createDefaultStats,
} from '../persistence/types.js'
import { AVATARS } from '../avatars/definitions.js'
import type { AvatarDefinition } from '../avatars/definitions.js'
import { drawAvatar } from '../avatars/renderer.js'
import { t } from '../shared/i18n/index.js'

type ProfileView = 'select' | 'create' | 'edit' | 'delete-confirm'

export class ProfileState implements GameState {
  private _currentView: ProfileView = 'select'
  private _container: Container | null = null
  private _profiles: ProfileData[] = []
  private _editTarget: ProfileData | null = null
  private _selectedAvatarId: string | null = null
  private _nameInput: HTMLInputElement | null = null

  enter(ctx: GameContext): void {
    this._container = new Container()
    ctx.gameRoot.addChild(this._container)

    this._profiles = ctx.getProfileRepository().loadAll()

    if (this._profiles.length === 0) {
      this._currentView = 'create'
      this._renderCreateView(ctx)
    } else {
      this._currentView = 'select'
      this._renderSelectView(ctx)
    }
  }

  exit(ctx: GameContext): void {
    this._removeInput()
    if (this._container) {
      ctx.gameRoot.removeChild(this._container)
      this._container.destroy({ children: true })
      this._container = null
    }
    this._editTarget = null
    this._selectedAvatarId = null
  }

  update(): void {
    // Static UI, pointer events handle interaction
  }

  render(): void {
    // no-op
  }

  // --- Sub-views ---

  private _clearView(): void {
    this._removeInput()
    if (this._container) {
      this._container.removeChildren()
      // Destroy children manually since removeChildren does not destroy
      // (PixiJS v8 requires explicit destroy)
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
        this._currentView = 'edit'
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
        this._currentView = 'delete-confirm'
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
        this._currentView = 'create'
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
    this._clearView()
    if (!this._container) return

    this._selectedAvatarId = null

    // Title
    const title = new BitmapText({
      text: t('profiles.create.title'),
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.08
    this._container.addChild(title)

    // Name input label
    const nameLabel = new BitmapText({
      text: t('profiles.create.name'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    nameLabel.anchor.set(0.5)
    nameLabel.x = BASE_WIDTH / 2
    nameLabel.y = BASE_HEIGHT * 0.2
    this._container.addChild(nameLabel)

    // HTML input for name entry
    this._createNameInput('')

    // Avatar selection label
    const avatarLabel = new BitmapText({
      text: t('profiles.create.avatar'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    avatarLabel.anchor.set(0.5)
    avatarLabel.x = BASE_WIDTH / 2
    avatarLabel.y = BASE_HEIGHT * 0.4
    this._container.addChild(avatarLabel)

    // Avatar grid
    const avatarSize = 70
    const spacing = 110
    const totalWidth = AVATARS.length * spacing
    const startX = (BASE_WIDTH - totalWidth) / 2 + spacing / 2
    const highlightGraphics: Graphics[] = []

    for (let i = 0; i < AVATARS.length; i++) {
      const def = AVATARS[i]!
      const x = startX + i * spacing
      const y = BASE_HEIGHT * 0.55

      const avatarContainer = new Container()
      avatarContainer.x = x
      avatarContainer.y = y

      // Highlight ring (hidden by default)
      const highlight = new Graphics()
      highlight.circle(0, 0, avatarSize / 2 + 8)
      highlight.fill({ color: 0xffffff, alpha: 0.3 })
      highlight.visible = false
      avatarContainer.addChild(highlight)
      highlightGraphics.push(highlight)

      const g = new Graphics()
      drawAvatar(g, def, avatarSize)
      avatarContainer.addChild(g)

      avatarContainer.eventMode = 'static'
      avatarContainer.cursor = 'pointer'
      avatarContainer.on('pointerover', () => avatarContainer.scale.set(1.15))
      avatarContainer.on('pointerout', () => avatarContainer.scale.set(1.0))
      avatarContainer.on('pointertap', () => {
        this._selectedAvatarId = def.id
        // Update highlight rings
        for (const h of highlightGraphics) {
          h.visible = false
        }
        highlight.visible = true
      })

      this._container.addChild(avatarContainer)
    }

    // Confirm button
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

      const newProfile: ProfileData = {
        id: generateProfileId(),
        name,
        avatarId: this._selectedAvatarId,
        cumulativeStats: createDefaultStats(),
        lastDifficultyParams: null,
        preferredGameMode: null,
        sessionHistory: [],
        createdAt: new Date().toISOString(),
      }
      this._profiles.push(newProfile)
      ctx.getProfileRepository().saveAll(this._profiles)
      this._selectProfile(ctx, newProfile)
    })
    this._container.addChild(confirmBtn)
  }

  private _renderEditView(ctx: GameContext, profile: ProfileData): void {
    this._clearView()
    if (!this._container) return

    this._selectedAvatarId = profile.avatarId

    // Title
    const title = new BitmapText({
      text: t('profiles.edit'),
      style: { fontFamily: 'GameFont', fontSize: 36 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.08
    this._container.addChild(title)

    // Name input (pre-filled)
    const nameLabel = new BitmapText({
      text: t('profiles.create.name'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    nameLabel.anchor.set(0.5)
    nameLabel.x = BASE_WIDTH / 2
    nameLabel.y = BASE_HEIGHT * 0.2
    this._container.addChild(nameLabel)

    this._createNameInput(profile.name)

    // Avatar selection
    const avatarLabel = new BitmapText({
      text: t('profiles.create.avatar'),
      style: { fontFamily: 'GameFont', fontSize: 18 },
    })
    avatarLabel.anchor.set(0.5)
    avatarLabel.x = BASE_WIDTH / 2
    avatarLabel.y = BASE_HEIGHT * 0.4
    this._container.addChild(avatarLabel)

    const avatarSize = 70
    const spacing = 110
    const totalWidth = AVATARS.length * spacing
    const startX = (BASE_WIDTH - totalWidth) / 2 + spacing / 2
    const highlightGraphics: Graphics[] = []

    for (let i = 0; i < AVATARS.length; i++) {
      const def = AVATARS[i]!
      const x = startX + i * spacing
      const y = BASE_HEIGHT * 0.55

      const avatarContainer = new Container()
      avatarContainer.x = x
      avatarContainer.y = y

      const highlight = new Graphics()
      highlight.circle(0, 0, avatarSize / 2 + 8)
      highlight.fill({ color: 0xffffff, alpha: 0.3 })
      highlight.visible = def.id === profile.avatarId
      avatarContainer.addChild(highlight)
      highlightGraphics.push(highlight)

      const g = new Graphics()
      drawAvatar(g, def, avatarSize)
      avatarContainer.addChild(g)

      avatarContainer.eventMode = 'static'
      avatarContainer.cursor = 'pointer'
      avatarContainer.on('pointerover', () => avatarContainer.scale.set(1.15))
      avatarContainer.on('pointerout', () => avatarContainer.scale.set(1.0))
      avatarContainer.on('pointertap', () => {
        this._selectedAvatarId = def.id
        for (const h of highlightGraphics) {
          h.visible = false
        }
        highlight.visible = true
      })

      this._container.addChild(avatarContainer)
    }

    // Confirm button
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

      profile.name = name
      profile.avatarId = this._selectedAvatarId
      ctx.getProfileRepository().saveAll(this._profiles)

      this._currentView = 'select'
      this._renderSelectView(ctx)
    })
    this._container.addChild(confirmBtn)
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
        this._currentView = 'create'
        this._renderCreateView(ctx)
      } else {
        this._currentView = 'select'
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
      this._currentView = 'select'
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
