import { worldTrack, type TrackId } from '../../audio/music'
import { campaign, learnedLetters, nextLevel, type LevelDef } from '../../content/campaign'
import { allLetters, FINGER_COLORS, fingerFor, rowLetters } from '../../content/keyboard'
import { findLaser, findShip } from '../../content/ships'
import { wordList, wordsBetween } from '../../content/words'
import { formatNumber, t } from '../../core/i18n'
import { createRng } from '../../core/rng'
import {
  applyResult,
  isLevelUnlocked,
  levelInfo,
  levelStars,
  type RewardSummary,
} from '../../game/progression'
import { Session, type GameEvent, type SessionConfig, type SessionResult } from '../../game/session'
import { GameView } from '../../render/game-view'
import { keyWeight, type Profile } from '../../state/profile'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { KeyboardHint } from '../keyboard-hint'
import { hubScreen } from './hub'
import { mapScreen } from './map'
import { openSettings } from './settings'

export type Launch = { kind: 'level'; level: LevelDef } | { kind: 'endless' }

export const levelLaunch = (level: LevelDef): Launch => ({ kind: 'level', level })
export const endlessLaunch = (): Launch => ({ kind: 'endless' })

type Phase = 'brief' | 'play' | 'pause' | 'done'

function endlessPool(app: App, profile: Profile): string[] {
  const layout = app.settings.layout
  const learned = new Set(learnedLetters(layout, (id) => levelStars(profile, id) > 0))
  for (const k of rowLetters(layout, 'home')) learned.add(k)
  return [...learned]
}

function buildSession(app: App, profile: Profile, launch: Launch): Session {
  const lang = app.settings.lang
  const config: SessionConfig = {
    rng: createRng(Date.now() >>> 0),
    words: wordList(lang),
    keyWeight: (ch) => keyWeight(profile, ch),
    // Hunting keys with one finger is slower than typing: start gentler.
    pace: app.touchMode ? 0.75 : 1,
  }
  if (launch.kind === 'level') {
    config.level = launch.level
    if (launch.level.kind === 'words')
      config.words = wordsBetween(lang, launch.level.wordLen[0], launch.level.wordLen[1])
  } else {
    config.endless = { pool: endlessPool(app, profile), reader: profile.reader }
  }
  return new Session(config)
}

export function gameScreen(app: App, launch: Launch, skipBrief = false): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const layout = app.settings.layout
  const lang = app.settings.lang
  const level = launch.kind === 'level' ? launch.level : null
  const world = level ? campaign(layout)[level.world] : undefined
  /** Each world has its own tune; endless mode changes tune every two waves. */
  const gameTrack = (): TrackId =>
    worldTrack(level ? level.world : Math.floor((session.wave - 1) / 2))
  const session = buildSession(app, profile, launch)
  if (import.meta.env.DEV) Object.assign(window, { kiSession: session })
  const view = new GameView(findShip(profile.ship), findLaser(profile.laser))
  let phase: Phase = 'brief'

  // --- HUD -------------------------------------------------------------------
  const scoreEl = h('div', { class: 'score' }, '0')
  const multEl = h('div', { class: 'mult x1' }, 'x1')
  const comboEl = h('div', { class: 'combo-count' })
  const progressFill = h('i')
  const progress = h('div', { class: `progress${level?.boss ? ' boss' : ''}` }, progressFill)
  const labelEl = h('div', { class: 'label' })
  const hearts = Array.from({ length: session.maxHearts }, () => h('span', null, '❤️'))
  const pauseBtn = h(
    'button',
    { class: 'btn ghost icon-btn', title: t('paused'), onClick: () => pause() },
    '⏸',
  )
  const hud = h(
    'div',
    { class: 'hud' },
    h('div', { class: 'hud-score' }, scoreEl, multEl, comboEl),
    h('div', { class: 'hud-center' }, labelEl, progress),
    h('div', { class: 'hud-right' }, h('div', { class: 'hearts' }, ...hearts), pauseBtn),
  )
  hud.style.visibility = 'hidden'

  const activeKeys = level
    ? level.kind === 'letters'
      ? level.pool
      : allLetters(layout)
    : endlessPool(app, profile)
  const hintKeys = profile.reader && !level ? allLetters(layout) : activeKeys
  const keyboard = app.touchMode
    ? new KeyboardHint(layout, hintKeys, (key) => {
        app.unlockAudio()
        if (phase !== 'play') return
        if (key === 'back') session.releaseLock()
        else typeKey(key)
      })
    : app.settings.keyboardHint
      ? new KeyboardHint(layout, hintKeys)
      : null
  const layer = h('div', { class: 'overlay clear', style: 'pointer-events:none' })
  // Phones held sideways leave no room to play: ask to turn them (tablets are fine).
  const rotateHint = app.touchMode
    ? h('div', { class: 'rotate-hint' }, h('div', { class: 'phone' }, '📱'), t('rotatePhone'))
    : null
  const cramped = window.matchMedia('(orientation: landscape) and (max-height: 500px)')
  const el = h(
    'div',
    { class: 'screen play', style: 'padding:0' },
    hud,
    keyboard?.el ?? null,
    layer,
    rotateHint,
  )

  const measure = (): void => {
    view.bottomReserve = keyboard ? keyboard.el.offsetHeight + 16 : 0
  }
  requestAnimationFrame(measure)
  window.addEventListener('resize', measure)

  let shownScore = 0
  let lastMult = 1
  let lastHearts = session.hearts

  const setLayer = (content: HTMLElement | null, interactive = true): void => {
    layer.replaceChildren(...(content ? [content] : []))
    layer.style.pointerEvents = content && interactive ? 'auto' : 'none'
    layer.style.background = content && interactive ? '' : 'transparent'
  }

  const refreshHud = (dt: number): void => {
    shownScore += (session.score - shownScore) * Math.min(1, dt * 12)
    if (Math.abs(session.score - shownScore) < 1) shownScore = session.score
    scoreEl.textContent = formatNumber(Math.round(shownScore))
    const m = session.multiplier
    if (m !== lastMult) {
      multEl.textContent = `x${m}`
      multEl.className = `mult${m === 1 ? ' x1' : ''} bump`
      lastMult = m
      app.music.intensity = Math.min(3, m)
    }
    comboEl.textContent = session.combo >= 3 ? `🔥 ${session.combo}` : ''
    progressFill.style.width = `${Math.round(session.progress * 100)}%`
    labelEl.textContent = level
      ? `${t('levelTitle', { id: level.id })} · ${t(`tag.${level.tag}`)}`
      : t('wave', { n: session.wave })
    if (session.hearts !== lastHearts) {
      hearts.forEach((heart, i) => {
        const on = i < session.hearts
        heart.className = on ? '' : i < lastHearts ? 'off lost' : 'off'
      })
      lastHearts = session.hearts
    }
    keyboard?.setNext(session.nextKeyHint())
  }

  // --- audio / voice for game events -------------------------------------------
  const speakLetters = level ? level.kind === 'letters' && !level.boss : !profile.reader
  const onEvent = (e: GameEvent): void => {
    view.handle(e)
    const sfx = app.sfx
    switch (e.type) {
      case 'spawn':
        if (
          speakLetters &&
          app.settings.voice === 'all' &&
          e.enemy.text.length === 1 &&
          session.enemies.length <= 2
        ) {
          app.voice.say(e.enemy.text.toUpperCase(), lang, 1100)
        }
        break
      case 'shot':
        sfx.shoot(session.combo)
        break
      case 'hit':
        sfx.hit()
        break
      case 'kill':
        sfx.explode(session.combo, e.enemy.kind === 'boss')
        if (e.enemy.kind === 'golden') sfx.golden()
        break
      case 'mistake':
        sfx.mistake()
        break
      case 'combo':
        sfx.combo(e.multiplier)
        break
      case 'comboBreak':
        sfx.comboBreak()
        break
      case 'breach':
        sfx.breach()
        break
      case 'powerup':
        if (e.power === 'freeze') sfx.freeze()
        else sfx.powerup()
        break
      case 'bossIncoming':
        app.music.play('bossIntro')
        app.background.setWarp(0.35)
        break
      case 'bossSpawn':
        sfx.bossAlarm()
        app.background.setWarp(0)
        app.background.jump()
        if (app.music.current !== 'bossIntro') app.music.play('boss')
        break
      case 'bossHit':
        sfx.explode(12)
        if (e.enemy.hp / e.enemy.maxHp <= 0.34) app.music.finale = true
        break
      case 'wave':
        sfx.wave()
        if (!e.boss) app.music.play(gameTrack())
        break
      case 'victory':
        sfx.fanfare()
        break
      case 'defeat':
        sfx.defeat()
        break
      default:
        break
    }
  }

  const typeKey = (ch: string): void => {
    const before = session.correct
    session.press(ch)
    keyboard?.flash(ch, session.correct > before)
    for (const ev of session.drainEvents()) onEvent(ev)
  }

  // --- phases ------------------------------------------------------------------
  const start = (): void => {
    if (phase !== 'brief') return
    phase = 'play'
    setLayer(null)
    hud.style.visibility = 'visible'
    app.background.jump()
    app.sfx.warp()
    app.music.intensity = 1
    if (!level?.boss) app.music.play(gameTrack())
    view.showCallout(t('callout.ready'), ['#e6fbff', '#5fd4ff'], 1.2)
    app.voice.stop()
  }

  const settings = (): void => {
    openSettings(app, () => {
      view.setLoadout(findShip(profile.ship), findLaser(profile.laser))
    })
  }

  const pause = (): void => {
    if (phase !== 'play') return
    phase = 'pause'
    app.music.intensity = 0
    const box = h(
      'div',
      { class: 'dialog panel pop' },
      h('h2', { class: 'title' }, '⏸ ', t('paused')),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn big green', onClick: () => resume() }, '▶ ', t('resume')),
      ),
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          { class: 'btn blue', onClick: () => app.go(gameScreen(app, launch, true)) },
          '🔄 ',
          t('restart'),
        ),
        h('button', { class: 'btn ghost', onClick: () => quit() }, '🏠 ', t('quit')),
      ),
      h('button', { class: 'btn purple small', onClick: settings }, '⚙️ ', t('settings')),
    )
    setLayer(box)
  }

  const resume = (): void => {
    if (phase !== 'pause') return
    phase = 'play'
    app.music.intensity = Math.min(3, session.multiplier)
    setLayer(null)
  }

  const quit = (): void => {
    if (level) app.go(mapScreen(app, level.world))
    else app.go(hubScreen(app))
  }

  let fireworks = 0
  let resultsReadyAt = Infinity
  let primary: (() => void) | null = null

  const finish = (): void => {
    phase = 'done'
    const result = session.result()
    const rewards = applyResult(profile, result)
    app.save()
    app.music.intensity = 1
    fireworks = result.won ? 5 : 0
    showResults(result, rewards)
  }

  const showResults = (result: SessionResult, rewards: RewardSummary): void => {
    const lvl = levelInfo(profile.xp)
    const next = level && result.won ? nextLevel(layout, level) : undefined
    const nextOpen = next && isLevelUnlocked(profile, layout, next) ? next : undefined
    const title = !level ? t('endlessOver') : result.won ? t('resultWin') : t('resultLose')

    const starEls = [0, 1, 2].map(() => h('span', null, '⭐'))
    const scoreBig = h('div', { class: 'title', style: 'font-size:clamp(40px,6vw,64px)' }, '0')
    const xpFill = h('i')
    const stat = (value: string, label: string): HTMLElement =>
      h('div', { class: 'stat' }, h('b', null, value), h('small', null, label))

    const actions: HTMLElement[] = []
    const replay = (): void => app.go(gameScreen(app, launch, true))
    actions.push(h('button', { class: 'btn blue', onClick: replay }, '🔄 ', t('replay')))
    if (nextOpen) {
      const goNext = (): void => app.go(gameScreen(app, levelLaunch(nextOpen)))
      actions.push(h('button', { class: 'btn big green', onClick: goNext }, t('next'), ' ▶'))
      primary = goNext
    } else primary = replay
    actions.push(
      h(
        'button',
        { class: 'btn ghost', onClick: quit },
        level ? `🗺️ ${t('map')}` : `🏠 ${t('home')}`,
      ),
    )

    const box = h(
      'div',
      { class: 'dialog panel pop' },
      h('h2', { class: 'title' }, title),
      level && !result.won ? h('p', { class: 'subtitle' }, t('resultLoseSub')) : null,
      level ? h('div', { class: 'stars-big' }, ...starEls) : null,
      scoreBig,
      rewards.newBest ? h('div', { class: 'record' }, '🏅 ', t('newRecord')) : null,
      h(
        'div',
        { class: 'stats' },
        stat(`${Math.round(result.accuracy * 100)}%`, t('accuracy')),
        stat(String(result.kills), t('aliens')),
        stat(String(result.bestCombo), t('bestCombo')),
        level ? null : stat(String(result.wave), t('waveReached')),
      ),
      h(
        'div',
        { class: 'rewards' },
        h('div', { class: 'chip coins' }, `+${rewards.coins} 🪙`),
        h('div', { class: 'chip' }, `+${rewards.xp} XP`),
      ),
      h(
        'div',
        { style: 'width:100%' },
        h('div', { class: 'label', style: 'margin:0 0 4px' }, t('levelShort', { n: lvl.level })),
        h('div', { class: 'xpbar', style: 'height:16px' }, xpFill),
      ),
      rewards.levelAfter > rewards.levelBefore
        ? h('div', { class: 'levelup' }, '🎉 ', t('levelUp', { n: rewards.levelAfter }))
        : null,
      rewards.trophies.length > 0
        ? h(
            'div',
            { class: 'trophy-list' },
            ...rewards.trophies.map((tr) =>
              h(
                'div',
                { class: 'trophy-toast pop', title: tr.desc[lang] },
                h('span', { class: 'ico' }, tr.icon),
                h('div', null, h('small', null, t('newTrophy')), h('b', null, tr.name[lang])),
              ),
            ),
          )
        : null,
      h('div', { class: 'row' }, ...actions),
    )
    setLayer(box)
    resultsReadyAt = performance.now() + 1200

    // Animated reveal: stars one by one, score count-up, XP bar.
    for (let i = 0; i < rewards.stars; i++) {
      setTimeout(
        () => {
          starEls[i]?.classList.add('on')
          app.sfx.star(i)
          const r = starEls[i]?.getBoundingClientRect()
          if (r)
            view.particles.burst(
              r.left + r.width / 2,
              r.top + r.height / 2,
              '#ffd23f',
              24,
              420,
              'star',
              7,
            )
        },
        500 + i * 450,
      )
    }
    const t0 = performance.now()
    const countUp = (): void => {
      const k = Math.min(1, (performance.now() - t0) / 1200)
      scoreBig.textContent = formatNumber(Math.round(result.score * (1 - (1 - k) ** 3)))
      if (k < 1 && scoreBig.isConnected) requestAnimationFrame(countUp)
    }
    requestAnimationFrame(countUp)
    setTimeout(() => {
      xpFill.style.width = `${Math.round((lvl.into / lvl.needed) * 100)}%`
      app.sfx.coin()
    }, 700)
    if (rewards.levelAfter > rewards.levelBefore) {
      setTimeout(() => {
        app.sfx.levelUp()
        view.particles.confetti(window.innerWidth / 2, window.innerHeight * 0.7, 140, 1000)
      }, 1700)
    }
    if (rewards.trophies.length > 0) setTimeout(() => app.sfx.fanfare(), 2200)
  }

  // --- briefing --------------------------------------------------------------
  const briefing = (): HTMLElement => {
    const keycaps = (keys: readonly string[]): HTMLElement =>
      h(
        'div',
        { class: 'keycaps' },
        ...keys.map((k) => {
          const finger = fingerFor(layout, k)
          return h(
            'div',
            { class: 'keycap' },
            h(
              'div',
              { class: 'cap', style: `--kc:${finger ? FINGER_COLORS[finger] : '#fff'}` },
              k.toUpperCase(),
            ),
            finger ? h('small', null, t(`finger.${finger}`)) : null,
          )
        }),
      )
    let body: (HTMLElement | null)[]
    if (!level) body = [h('p', { class: 'subtitle' }, t('briefEndless'))]
    else if (level.boss) body = [h('p', { class: 'subtitle' }, t('briefBoss'))]
    else if (level.kind === 'words') body = [h('p', { class: 'subtitle' }, t('briefWords'))]
    else if (level.newKeys.length > 0)
      body = [h('p', { class: 'subtitle' }, t('briefNew')), keycaps(level.newKeys)]
    else body = [h('p', { class: 'subtitle' }, t('briefReview'))]

    return h(
      'div',
      { class: 'dialog panel pop' },
      h(
        'span',
        { class: `tag${level?.boss ? ' boss' : ''}` },
        level ? t(`tag.${level.tag}`) : '♾️',
      ),
      h('h2', { class: 'title' }, level ? t('levelTitle', { id: level.id }) : t('endless')),
      world ? h('p', { class: 'subtitle' }, t(`world.${world.index}` as 'world.0')) : null,
      ...body,
      h(
        'button',
        { class: 'btn big', onClick: start },
        '🚀 ',
        t(app.touchMode ? 'tapToTakeOff' : 'pressSpace'),
      ),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn ghost small', onClick: quit }, '◀ ', t('back')),
        h('button', { class: 'btn ghost small', onClick: settings }, '⚙️ ', t('settings')),
      ),
    )
  }

  if (skipBrief) {
    setTimeout(start, 0)
  } else {
    setLayer(briefing())
    if (level && level.newKeys.length > 0 && app.settings.voice !== 'off') {
      setTimeout(
        () => app.voice.say(level.newKeys.map((k) => k.toUpperCase()).join(', '), lang),
        400,
      )
    }
  }

  const onVisibility = (): void => {
    if (document.hidden) pause()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    el,
    scene: 'game',
    music: 'menu',
    world: level?.world ?? 5,
    update(dt) {
      if (phase === 'play' && rotateHint && cramped.matches) pause()
      if (phase === 'play') {
        session.update(dt * view.timeScale)
        for (const e of session.drainEvents()) onEvent(e)
        refreshHud(dt)
        if (session.status !== 'playing') finish()
      }
      if (fireworks > 0 && Math.random() < dt * 2.5) {
        fireworks -= 0.4
        const x = window.innerWidth * (0.15 + Math.random() * 0.7)
        const y = window.innerHeight * (0.15 + Math.random() * 0.4)
        view.particles.explosion(x, y, ['#ffd23f', '#ff5fa2', '#5fd4ff'], 1.2)
        app.sfx.explode(Math.floor(Math.random() * 30))
      }
      view.update(dt, session)
    },
    draw(ctx, w, height) {
      view.draw(ctx, session, w, height)
    },
    onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (phase === 'brief') {
        if (e.key === ' ' || e.key === 'Enter') start()
        else if (e.key === 'Escape') quit()
        return
      }
      if (phase === 'pause') {
        if (e.key === 'Escape' || e.key === ' ') resume()
        return
      }
      if (phase === 'done') {
        if ((e.key === 'Enter' || e.key === ' ') && performance.now() > resultsReadyAt) primary?.()
        return
      }
      if (e.key === 'Escape') {
        pause()
        return
      }
      if (e.key === 'Backspace') {
        session.releaseLock()
        return
      }
      if (e.repeat || e.key.length !== 1) return
      const ch = e.key.toLowerCase()
      if (!/^[a-z]$/.test(ch)) return
      typeKey(ch)
    },
    leave() {
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', onVisibility)
      app.voice.stop()
      app.music.intensity = 1
    },
  }
}
