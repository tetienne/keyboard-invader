import { campaign, type LevelDef } from '../src/content/campaign'
import { createRng } from '../src/core/rng'
import { Session, type GameEvent, type SessionConfig } from '../src/game/session'

export function level(id: string, patch: Partial<LevelDef> = {}): LevelDef {
  for (const w of campaign('azerty')) {
    const l = w.levels.find((x) => x.id === id)
    if (l) return { ...l, ...patch }
  }
  throw new Error(`no level ${id}`)
}

export function makeSession(config: Partial<SessionConfig> = {}): Session {
  return new Session({
    rng: createRng(42),
    words: ['chat', 'lune', 'robot', 'avion'],
    level: level('1-1'),
    ...config,
  })
}

/** Advances the simulation, collecting every event. */
export function run(session: Session, seconds: number, step = 1 / 60): GameEvent[] {
  const events: GameEvent[] = []
  for (let t = 0; t < seconds; t += step) {
    session.update(step)
    events.push(...session.drainEvents())
  }
  return events
}

/** Waits until at least one invader is on screen. */
export function waitForEnemy(session: Session, maxSeconds = 10): void {
  for (let t = 0; t < maxSeconds && session.enemies.length === 0; t += 1 / 60)
    session.update(1 / 60)
  session.drainEvents()
}

/** Plays perfectly: always types the hinted key. */
export function autoplay(session: Session, maxSeconds = 600): void {
  for (let t = 0; t < maxSeconds && session.status === 'playing'; t += 1 / 30) {
    const key = session.nextKeyHint()
    if (key && !session.ending) session.press(key)
    session.update(1 / 30)
    session.drainEvents()
  }
}
