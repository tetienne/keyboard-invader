# Phase 6: Profiles & Local Persistence - Research

**Researched:** 2026-04-01
**Domain:** LocalStorage persistence, profile management, PixiJS state machine extension
**Confidence:** HIGH

## Summary

Phase 6 introduces a profile system allowing multiple children to share one device, each with their own saved progress. The technical domain is straightforward: LocalStorage for persistence, a new `ProfileState` in the existing state machine, and extending `GameContext` with profile-aware methods.

The key architectural decision (D-13) is the adapter/repository pattern for the persistence layer, which decouples game logic from the storage backend. This is well-scoped: the adapter wraps LocalStorage now and Firebase later (Phase 10). The data model is small (max 4 profiles, 10 sessions each), well within LocalStorage's 5MB limit.

The main implementation complexity lies in integration points: extending `StateName`, `TRANSITIONS`, `GameContext`, the `Game` class, and `BootState`; creating profile CRUD operations; building the profile selection/creation UI in PixiJS; and wiring `DifficultyManager` to accept initial params from the active profile's saved state.

**Primary recommendation:** Build a `ProfileRepository` interface with a `LocalStorageProfileRepository` implementation. Keep the profile data model as plain TypeScript interfaces with a `schemaVersion` envelope. The profile selection screen uses the same PixiJS BitmapText + pointer event patterns established in MenuState.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: App opens to dedicated profile selection screen (boot -> profiles -> menu -> playing)
- D-02: First launch shows profile creation flow directly as first-run experience
- D-03: After selecting profile, child proceeds to existing MenuState
- D-04: Pre-defined set of 6-8 colorful cartoon SVG avatars (geometric placeholders for now)
- D-05: Child can change avatar later from profile edit screen
- D-06: Profile stores: name, avatarId, cumulativeStats, lastDifficultyParams, preferredGameMode, createdAt
- D-07: Last 10 session summaries per profile
- D-08: Versioned schema with sensible defaults for missing fields (extensible for Phase 7)
- D-09: Maximum 4 profiles
- D-10: Delete with confirmation step
- D-11: Editing limited to name and avatar
- D-12: Single JSON key in LocalStorage, one read on boot, write after session/profile change
- D-13: Adapter/repository pattern for persistence (Firebase swap in Phase 10)
- D-14: New 'profiles' state in StateName. Transitions: boot -> profiles, profiles -> menu. Menu gets "change profile" link
- D-15: GameContext extended with setActiveProfile(), getActiveProfile(), persistence layer access
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | L'enfant choisit son profil en cliquant sur son avatar (pas de mot de passe) | ProfileState with avatar grid using PixiJS pointer events (same pattern as MenuState buttons). Profile selection screen as new entry point after boot |
| PROF-02 | La progression de chaque enfant est sauvegardee dans le navigateur (LocalStorage) | ProfileRepository with LocalStorageProfileRepository. Single JSON key, versioned schema, read on boot, write after changes |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.7 | Type-safe profile data model | Already in project |
| PixiJS | 8.17.x | Profile selection screen rendering | Already in project; BitmapText + pointer events for UI |
| Vitest | 3.x | Unit testing persistence layer | Already in project |

### No New Dependencies

This phase requires zero new packages. LocalStorage is a browser native API. Avatar placeholders use PixiJS Graphics primitives. The persistence layer is pure TypeScript with `JSON.parse`/`JSON.stringify`.

## Architecture Patterns

### Recommended Project Structure
```
src/
  game/
    types.ts              # Extended: StateName + 'profiles', ProfileData types
    profile-state.ts      # NEW: ProfileState class (GameState implementation)
    game.ts               # Extended: GameContext profile methods, repo init
    difficulty.ts          # Extended: optional initial params in constructor
    states.ts              # Unchanged (except BootState target)
  persistence/
    types.ts              # ProfileData, StorageEnvelope, SessionSummary
    repository.ts         # ProfileRepository interface
    local-storage.ts      # LocalStorageProfileRepository implementation
    schema.ts             # Version check, migration, defaults
  avatars/
    definitions.ts        # 6-8 avatar definitions (id, color, shape)
    renderer.ts           # Draw avatar using PixiJS Graphics
```

### Pattern 1: Repository/Adapter for Persistence (D-13)

**What:** A `ProfileRepository` interface that abstracts storage operations. `LocalStorageProfileRepository` implements it now; a Firebase adapter replaces it in Phase 10.

**When to use:** Any read/write of profile data goes through the repository, never directly to `localStorage`.

**Example:**
```typescript
// src/persistence/repository.ts
export interface ProfileRepository {
  loadAll(): ProfileData[]
  saveAll(profiles: ProfileData[]): void
}

// src/persistence/local-storage.ts
export class LocalStorageProfileRepository implements ProfileRepository {
  private static readonly STORAGE_KEY = 'keyboard-invader-profiles'

  loadAll(): ProfileData[] {
    const raw = localStorage.getItem(LocalStorageProfileRepository.STORAGE_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as StorageEnvelope
      return migrateIfNeeded(parsed)
    } catch {
      // Corrupted data: reset silently (child should not see errors)
      localStorage.removeItem(LocalStorageProfileRepository.STORAGE_KEY)
      return []
    }
  }

  saveAll(profiles: ProfileData[]): void {
    const envelope: StorageEnvelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profiles,
    }
    try {
      localStorage.setItem(
        LocalStorageProfileRepository.STORAGE_KEY,
        JSON.stringify(envelope),
      )
    } catch {
      // QuotaExceededError: log warning, data not saved
      console.warn('Failed to save profiles: storage quota exceeded')
    }
  }
}
```

### Pattern 2: Versioned Schema Envelope (D-08)

**What:** Wrap all stored data in an envelope with `schemaVersion`. When loading, check version and apply defaults for missing fields. Phase 7 adds xp/level; the migration path is: read v1, apply v2 defaults, save as v2.

**Example:**
```typescript
// src/persistence/types.ts
export const CURRENT_SCHEMA_VERSION = 1

export interface StorageEnvelope {
  schemaVersion: number
  profiles: ProfileData[]
}

export interface ProfileData {
  id: string
  name: string                    // max 12 chars
  avatarId: string                // references predefined avatar
  cumulativeStats: CumulativeStats
  lastDifficultyParams: DifficultyParams | null
  preferredGameMode: GameMode | null
  sessionHistory: SessionSummary[]  // max 10, FIFO
  createdAt: string               // ISO date string
}

export interface CumulativeStats {
  totalSessions: number
  totalHits: number
  totalMisses: number
  bestAccuracy: number            // 0-100
}

export interface SessionSummary {
  hits: number
  misses: number
  accuracy: number                // 0-100
  mode: GameMode
  date: string                    // ISO date string
}
```

### Pattern 3: State Machine Integration (D-14)

**What:** Add `'profiles'` to `StateName` union and update `TRANSITIONS`. `BootState` transitions to `'profiles'` instead of `'menu'`. `ProfileState` transitions to `'menu'` after selection.

**Key changes to existing files:**
```typescript
// types.ts changes
export type StateName = 'boot' | 'profiles' | 'menu' | 'playing' | 'paused' | 'gameover'

export const TRANSITIONS: Record<StateName, readonly StateName[]> = {
  boot: ['profiles'],           // was ['menu']
  profiles: ['menu'],           // NEW
  menu: ['playing', 'profiles'], // added 'profiles' for back-link
  playing: ['paused', 'menu', 'gameover'],
  paused: ['playing', 'menu'],
  gameover: ['menu', 'playing'],
} as const
```

### Pattern 4: DifficultyManager Initial Params Restoration

**What:** DifficultyManager constructor currently only accepts `DifficultyConfig`, always resetting to base values. Add an optional second parameter for restoration from profile.

**Example:**
```typescript
constructor(
  private readonly config: DifficultyConfig,
  initialParams?: DifficultyParams,
) {
  this._fallSpeed = initialParams?.fallSpeed ?? config.baseFallSpeed
  this._spawnInterval = initialParams?.spawnInterval ?? config.baseSpawnInterval
  this._complexityLevel = initialParams?.complexityLevel ?? 0
}
```

### Pattern 5: Avatar Rendering with PixiJS Graphics

**What:** Use PixiJS Graphics primitives for placeholder avatars rather than SVG file loading. Simpler, no async asset pipeline, and these will be replaced in Phase 8 (Visual Identity).

**Example:**
```typescript
// src/avatars/definitions.ts
export interface AvatarDefinition {
  id: string
  label: string
  color: number
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon'
}

export const AVATARS: readonly AvatarDefinition[] = [
  { id: 'avatar-red',    label: 'Rouge',  color: 0xff6b6b, shape: 'circle' },
  { id: 'avatar-blue',   label: 'Bleu',   color: 0x4dabf7, shape: 'square' },
  { id: 'avatar-green',  label: 'Vert',   color: 0x51cf66, shape: 'triangle' },
  { id: 'avatar-yellow', label: 'Jaune',  color: 0xffd43b, shape: 'star' },
  { id: 'avatar-purple', label: 'Violet', color: 0xcc5de8, shape: 'diamond' },
  { id: 'avatar-orange', label: 'Orange', color: 0xff922b, shape: 'hexagon' },
]
```

### Anti-Patterns to Avoid
- **Direct localStorage calls outside the adapter:** Breaks the Phase 10 Firebase swap. All storage goes through `ProfileRepository`.
- **Storing the entire DifficultyManager internal state:** Only store `DifficultyParams` (3 numbers). The rolling window is session-local and should not persist.
- **Adding ProfileState to states.ts:** The file is already 777 lines. Create a separate `profile-state.ts` file.
- **Using `crypto.randomUUID()` for IDs:** Requires secure context (HTTPS) in some browsers. Use `Date.now().toString(36) + Math.random().toString(36).slice(2)` for simplicity; uniqueness among 4 local profiles is trivial.
- **SVG file loading for placeholder avatars:** Adds async complexity for disposable placeholders. Use Graphics primitives.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ID generation | UUID library | `Date.now().toString(36) + random` | Only need uniqueness within 4 local profiles |
| Schema migration framework | Full migration pipeline | Simple version check with defaults | At most 1-2 schema versions in v1 lifecycle |
| Text input in canvas | Custom PixiJS text input widget | HTML `<input>` overlay | Browsers handle keyboard input, IME, accents, mobile keyboards |
| Form validation library | zod/yup/ajv | Simple length check `name.trim().length > 0 && name.trim().length <= 12` | Single text field with trivial constraints |

**Key insight:** The data model is tiny (max 4 profiles, 10 sessions each, under 10KB total). Simple code beats framework complexity.

## Common Pitfalls

### Pitfall 1: LocalStorage Quota Exceeded
**What goes wrong:** `localStorage.setItem()` throws `QuotaExceededError`.
**Why it happens:** Other apps on the same origin consume space, or device has restrictive limits.
**How to avoid:** Wrap `setItem` in try/catch. With max 4 profiles and 10 sessions each, data is under 10KB. Extremely unlikely but must be handled gracefully.
**Warning signs:** Uncaught exception on save.

### Pitfall 2: JSON.parse on Corrupted Data
**What goes wrong:** `JSON.parse` throws on corrupted or manually-edited localStorage values.
**Why it happens:** Browser extensions, manual editing, storage corruption.
**How to avoid:** Wrap `JSON.parse` in try/catch. On failure, reset to empty array and remove the corrupted key. Log to `console.warn` for debugging.
**Warning signs:** App crashes on boot with blank screen.

### Pitfall 3: Stale Active Profile After Deletion
**What goes wrong:** Active profile reference points to a deleted profile.
**Why it happens:** Profile deleted while it was the active selection.
**How to avoid:** After deletion, if deleted profile was active, clear active profile and return to profile selection screen.
**Warning signs:** Undefined property access errors.

### Pitfall 4: BootState Transition Change Breaks Tests
**What goes wrong:** Existing tests expect `boot -> menu` transition.
**Why it happens:** `tests/game/states.test.ts` tests BootState; changing to `boot -> profiles` breaks assertions.
**How to avoid:** Update tests as part of the integration task. The `types-ext.test.ts` file also checks StateName values.
**Warning signs:** Test failures after modifying BootState or TRANSITIONS.

### Pitfall 5: Text Input in Canvas Context
**What goes wrong:** Building a custom text input in PixiJS (cursor blinking, selection, backspace, IME) takes days and still handles edge cases poorly.
**Why it happens:** Canvas has no native form elements.
**How to avoid:** Use a hidden HTML `<input>` element positioned over the canvas for name entry. Style with Tailwind for the large/friendly look. This is the standard pattern for canvas games needing text input.
**Warning signs:** Attempting to handle keydown events for text editing in PixiJS.

### Pitfall 6: Session Save Timing
**What goes wrong:** Profile data not saved if the user closes the browser mid-session.
**Why it happens:** Session results are only computed at session end (gameover state).
**How to avoid:** This is acceptable for v1. Sessions are short (15-20 items). Save occurs reliably on session completion in GameOverState. Adding `beforeunload` saves is fragile and not worth the complexity.
**Warning signs:** None; this is a conscious tradeoff.

## Code Examples

### GameContext Extension (D-15)
```typescript
// types.ts additions
export interface GameContext {
  // ... existing methods ...
  setActiveProfile(profile: ProfileData | null): void
  getActiveProfile(): ProfileData | null
  getProfileRepository(): ProfileRepository
}
```

### Session End: Save to Profile
```typescript
// In GameOverState.enter() or a dedicated save function
function saveSessionToProfile(ctx: GameContext): void {
  const profile = ctx.getActiveProfile()
  const result = ctx.getSessionResult()
  if (!profile || !result) return

  const accuracy = result.total > 0
    ? Math.round((result.hits / result.total) * 100)
    : 0

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
  if (profile.sessionHistory.length > 10) {
    profile.sessionHistory.shift()
  }

  // Save difficulty params for next session restoration
  profile.lastDifficultyParams = ctx.getDifficulty()

  // Persist all profiles
  const repo = ctx.getProfileRepository()
  // (repo holds the full list; update the profile in place and saveAll)
}
```

### i18n Keys to Add
```json
{
  "profiles.title": "Qui joue ?",
  "profiles.new": "Nouveau joueur",
  "profiles.create.title": "Cree ton profil !",
  "profiles.create.name": "Ton prenom",
  "profiles.create.avatar": "Choisis ton avatar",
  "profiles.create.confirm": "C'est parti !",
  "profiles.edit": "Modifier",
  "profiles.delete": "Supprimer",
  "profiles.delete.confirm": "Vraiment supprimer ?",
  "profiles.delete.yes": "Oui",
  "profiles.delete.no": "Non",
  "profiles.back": "Changer de joueur"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IndexedDB for all client storage | LocalStorage for small data, IndexedDB for large/binary | Always | Profile data < 10KB; LocalStorage is the right choice |
| Multiple localStorage keys | Single key with JSON envelope | Best practice | Simpler migration, atomic reads |

## Open Questions

1. **Text input for profile name**
   - What we know: PixiJS has no native text input. Children aged 5-8 need something simple.
   - What's unclear: Exact positioning/styling of the HTML input overlay.
   - Recommendation: Use a styled HTML `<input>` element overlaid on the canvas. Position it absolutely over the name area. Style it large and friendly with Tailwind. Hide it after name entry. This is standard for canvas games.

2. **Preferred game mode behavior in MenuState (discretion item)**
   - Recommendation: Auto-highlight (visual emphasis on the preferred mode button, e.g., slightly larger scale) but do not auto-select. The child should still actively choose.

3. **Error handling for corrupted data (discretion item)**
   - Recommendation: Silent reset to empty profiles array. Log to `console.warn`. A child should never see a JSON error message.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vite.config.ts` (inline test config) |
| Quick run command | `mise exec -- npx vitest run` |
| Full suite command | `mise exec -- npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile selection by avatar click | unit | `mise exec -- npx vitest run tests/game/profile-state.test.ts -x` | No (Wave 0) |
| PROF-01 | First launch shows creation flow | unit | `mise exec -- npx vitest run tests/game/profile-state.test.ts -x` | No (Wave 0) |
| PROF-02 | Profiles persist to LocalStorage | unit | `mise exec -- npx vitest run tests/persistence/local-storage.test.ts -x` | No (Wave 0) |
| PROF-02 | Session results saved to profile | unit | `mise exec -- npx vitest run tests/persistence/local-storage.test.ts -x` | No (Wave 0) |
| PROF-02 | Corrupted data handled gracefully | unit | `mise exec -- npx vitest run tests/persistence/local-storage.test.ts -x` | No (Wave 0) |
| D-08 | Schema versioning applies defaults | unit | `mise exec -- npx vitest run tests/persistence/schema.test.ts -x` | No (Wave 0) |
| D-09 | Max 4 profiles enforced | unit | `mise exec -- npx vitest run tests/persistence/local-storage.test.ts -x` | No (Wave 0) |
| D-14 | Transitions: boot->profiles->menu | unit | `mise exec -- npx vitest run tests/game/states.test.ts -x` | Yes (needs update) |

### Sampling Rate
- **Per task commit:** `mise exec -- npx vitest run`
- **Per wave merge:** `mise exec -- npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/persistence/local-storage.test.ts` -- covers PROF-02, D-09, D-12
- [ ] `tests/persistence/schema.test.ts` -- covers D-08 schema versioning and defaults
- [ ] `tests/game/profile-state.test.ts` -- covers PROF-01, D-01, D-02
- [ ] Update `tests/game/states.test.ts` -- BootState now transitions to 'profiles', not 'menu'
- [ ] Update `tests/game/types-ext.test.ts` -- StateName union includes 'profiles'
- [ ] `localStorage` mock needed in test environment (Vitest runs in Node; needs stub or jsdom)

## Project Constraints (from CLAUDE.md)

- **No backend:** All client-side, Firebase only for optional cloud sync (Phase 10)
- **No new frameworks:** Vanilla TypeScript + PixiJS for canvas rendering
- **Tailwind CSS:** For styling outside canvas (HTML input overlay for name entry)
- **pnpm:** Package manager
- **Vitest:** Test framework, config inline in vite.config.ts
- **Pre-commit hooks:** All formatting/linting handled by hooks; do not run formatters manually
- **No em dashes or en dashes** in any output
- **event.key** (not event.code) for keyboard input
- **Performance:** Animations fluid on modest machines
- **Child safety:** No personal data collected
- **PixiJS fully mocked in unit tests** via vi.mock (established pattern)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/game/types.ts`, `src/game/states.ts`, `src/game/game.ts`, `src/game/difficulty.ts` -- architecture and patterns verified by reading source
- Phase 06 CONTEXT.md -- all locked decisions D-01 through D-15
- Phase 05 CONTEXT.md D-13 -- difficulty resets each session, Phase 6 stores/restores
- Existing test suite: 132 tests passing, patterns established in `tests/game/`

### Secondary (MEDIUM confidence)
- LocalStorage API: well-established browser API, 5-10MB per origin, synchronous, `QuotaExceededError` on overflow
- PixiJS v8 Graphics API: verified by existing usage in codebase (PausedState, Game class)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing project tech
- Architecture: HIGH -- repository pattern is well understood, state machine extension is mechanical
- Pitfalls: HIGH -- LocalStorage edge cases are well documented, codebase patterns are clear
- UI/UX: MEDIUM -- text input overlay and avatar layout need validation during implementation

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain, no fast-moving dependencies)
