# Phase 6: Profiles & Local Persistence - Research

**Researched:** 2026-04-01
**Domain:** LocalStorage persistence, profile management, state machine extension
**Confidence:** HIGH

## Summary

Phase 6 introduces a profile system allowing multiple children to share one device, each with their own saved progress. The technical domain is straightforward: LocalStorage for persistence, a new `ProfileState` in the existing state machine, and extending `GameContext` with profile-aware methods.

The key architectural decision (D-13) is the adapter/repository pattern for the persistence layer, which decouples game logic from the storage backend. This is well-scoped: the adapter wraps LocalStorage now and Firebase later (Phase 10). The data model is small (profiles + last 10 sessions per profile), well within LocalStorage's 5MB limit.

The main implementation complexity lies in the integration points: extending `StateName`, `TRANSITIONS`, `GameContext`, the `Game` class, and `BootState`; creating profile CRUD operations; building the profile selection and creation UI screens using PixiJS; and wiring `DifficultyManager` to accept initial params from the active profile's saved state.

**Primary recommendation:** Build a thin `ProfileRepository` interface with a `LocalStorageAdapter` implementation. Keep the profile data model as a plain TypeScript interface with a `schemaVersion` field. The profile selection screen uses the same PixiJS `BitmapText` + pointer event patterns established in `MenuState`.

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

### Claude's Discretion
- LocalStorage key naming and data serialization format
- Profile selection screen layout and animations
- Exact avatar placeholder designs (simple geometric SVGs)
- Error handling for corrupted LocalStorage data (silent reset vs warning)
- Whether preferred game mode auto-selects in MenuState or just highlights

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | L'enfant choisit son profil en cliquant sur son avatar (pas de mot de passe) | ProfileState with avatar grid using PixiJS pointer events (same pattern as MenuState buttons). Profile selection screen as new entry point after boot |
| PROF-02 | La progression de chaque enfant est sauvegardee dans le navigateur (LocalStorage) | ProfileRepository with LocalStorageAdapter. Single JSON key, versioned schema, read on boot / write after changes |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 | Type-safe profile data model | Already in project |
| PixiJS | 8.17.1 | Profile selection screen rendering | Already in project, BitmapText + pointer events for UI |
| Vitest | 4.1.2 | Unit testing persistence layer | Already in project |

### No New Dependencies

This phase requires zero new packages. LocalStorage is a browser native API. SVG avatars are inline assets. The persistence layer is pure TypeScript with `JSON.parse` / `JSON.stringify`.

## Architecture Patterns

### Recommended Project Structure
```
src/
  game/
    types.ts           # Extended: StateName + 'profiles', new profile types
    states.ts          # Extended: ProfileState class added
    game.ts            # Extended: GameContext profile methods, persistence init
  persistence/
    types.ts           # ProfileData, ProfileStore, SessionSummary interfaces
    repository.ts      # ProfileRepository interface (adapter pattern)
    local-storage.ts   # LocalStorageAdapter implements ProfileRepository
    schema.ts          # Schema version, migration helpers, defaults
  screens/
    profile-select.ts  # Profile selection grid (PixiJS Container)
    profile-create.ts  # Profile creation flow (PixiJS Container)
    profile-edit.ts    # Edit name/avatar (PixiJS Container)
  assets/
    avatars/           # 6-8 SVG placeholder files (geometric shapes)
```

### Pattern 1: Repository / Adapter Pattern (D-13)

**What:** A `ProfileRepository` interface that abstracts storage operations. `LocalStorageAdapter` implements it now; `FirebaseAdapter` replaces it in Phase 10.

**When to use:** Any read/write of profile data goes through the repository, never directly to `localStorage`.

**Example:**
```typescript
// src/persistence/repository.ts
interface ProfileRepository {
  loadAll(): ProfileData[]
  save(profile: ProfileData): void
  delete(profileId: string): void
  saveSessionSummary(profileId: string, summary: SessionSummary): void
}

// src/persistence/local-storage.ts
class LocalStorageAdapter implements ProfileRepository {
  private static readonly STORAGE_KEY = 'keyboard-invader-profiles'
  private static readonly SCHEMA_VERSION = 1

  loadAll(): ProfileData[] {
    const raw = localStorage.getItem(LocalStorageAdapter.STORAGE_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as StorageEnvelope
      return this.migrate(parsed)
    } catch {
      // Corrupted data: reset silently (child should not see errors)
      localStorage.removeItem(LocalStorageAdapter.STORAGE_KEY)
      return []
    }
  }

  private persist(profiles: ProfileData[]): void {
    const envelope: StorageEnvelope = {
      schemaVersion: LocalStorageAdapter.SCHEMA_VERSION,
      profiles,
    }
    localStorage.setItem(
      LocalStorageAdapter.STORAGE_KEY,
      JSON.stringify(envelope),
    )
  }
}
```

### Pattern 2: Versioned Schema Envelope (D-08)

**What:** Wrap stored data in an envelope with `schemaVersion`. When loading, check version and apply migrations if needed. New fields get sensible defaults.

**Example:**
```typescript
interface StorageEnvelope {
  schemaVersion: number
  profiles: ProfileData[]
}

// Phase 7 will add xp/level fields. Migration:
// v1 -> v2: add xp: 0, level: 1 defaults to each profile
function migrate(envelope: StorageEnvelope): ProfileData[] {
  // For now, only version 1 exists
  return envelope.profiles
}
```

### Pattern 3: State Machine Integration (D-14)

**What:** Add `'profiles'` to `StateName` union and update `TRANSITIONS`. `BootState` transitions to `'profiles'` instead of `'menu'`. `ProfileState` transitions to `'menu'` after selection.

**Key changes to existing files:**
- `types.ts`: `StateName` gets `'profiles'`, `TRANSITIONS` updated
- `states.ts` or new file: `ProfileState` class implementing `GameState`
- `game.ts`: Register `ProfileState`, add profile methods to `GameContext`
- `BootState.enter()`: Change `ctx.transitionTo('menu')` to `ctx.transitionTo('profiles')`

### Pattern 4: Screen Components in PixiJS

**What:** Extract complex UI into reusable screen components (PixiJS Containers) that `ProfileState` composes. This keeps the state class focused on transitions while screens handle layout/interaction.

**Example:**
```typescript
// src/screens/profile-select.ts
class ProfileSelectScreen extends Container {
  constructor(
    profiles: ProfileData[],
    onSelect: (id: string) => void,
    onCreate: () => void,
  ) {
    super()
    // Build avatar grid, "new profile" button
    // Use BitmapText + pointer events (same as MenuState)
  }

  destroy(): void {
    // Clean up children
    super.destroy({ children: true })
  }
}
```

### Pattern 5: DifficultyManager Initial Params Restoration

**What:** `DifficultyManager` constructor currently accepts only a `DifficultyConfig`. To restore difficulty from a profile, either: (a) add optional `initialParams` to constructor, or (b) add a `restore(params: DifficultyParams)` method.

**Recommendation:** Option (a), add optional second argument. Simpler, no state mutation after construction.

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

### Anti-Patterns to Avoid
- **Direct localStorage calls outside the adapter:** Breaks the Phase 10 Firebase swap. All storage goes through `ProfileRepository`.
- **Storing the entire DifficultyManager state:** Only store `DifficultyParams` (3 numbers). The rolling window is session-local and should not persist.
- **Using `innerHTML` or DOM for the profile screen:** The game uses PixiJS canvas exclusively. Profile UI must also be PixiJS-based (BitmapText, Graphics, Sprites).
- **Generating unique IDs with `crypto.randomUUID()`:** Not available in all target browsers. Use `Date.now().toString(36) + Math.random().toString(36).slice(2)` or similar simple approach.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ID generation | UUID library | Simple `Date.now().toString(36) + random` | Only need uniqueness within 4 profiles on one device |
| Schema migration | Full migration framework | Simple version check with defaults | Only 1-2 schema versions expected in v1 |
| Form validation | Custom validation library | Simple length check on name (1-12 chars) | Only one text input in the entire phase |

**Key insight:** The data model is tiny (max 4 profiles, 10 sessions each). Over-engineering the persistence layer would waste more time than the data complexity warrants.

## Common Pitfalls

### Pitfall 1: LocalStorage Quota Exceeded
**What goes wrong:** `localStorage.setItem()` throws `QuotaExceededError` when storage is full.
**Why it happens:** Other apps on the same origin consume space, or device has restrictive limits.
**How to avoid:** Wrap `setItem` in try/catch. With max 4 profiles and 10 sessions each, data is under 10KB, so this is unlikely but must be handled.
**Warning signs:** Uncaught exception on save.

### Pitfall 2: JSON.parse on Corrupted Data
**What goes wrong:** `JSON.parse` throws on corrupted/manually-edited localStorage values.
**Why it happens:** Browser extensions, user manually editing, storage corruption.
**How to avoid:** Always wrap `JSON.parse` in try/catch. On failure, reset to empty array (D-discretion: silent reset is appropriate for a children's game).
**Warning signs:** App crashes on boot.

### Pitfall 3: Stale Profile Reference After Deletion
**What goes wrong:** Active profile ID points to a deleted profile.
**Why it happens:** Profile deleted while it was active, then code tries to read its data.
**How to avoid:** After deletion, if the deleted profile was active, clear the active profile and return to profile selection screen.
**Warning signs:** Undefined access errors.

### Pitfall 4: BootState Transition Change Breaks Existing Tests
**What goes wrong:** Existing tests expect `boot -> menu` transition. Changing to `boot -> profiles` breaks them.
**Why it happens:** `tests/game/states.test.ts` likely tests BootState behavior.
**How to avoid:** Update tests as part of the integration task. Check `states.test.ts` for BootState assertions.
**Warning signs:** Test failures after modifying BootState.

### Pitfall 5: SVG Loading in PixiJS v8
**What goes wrong:** SVG assets not rendering correctly or loading asynchronously.
**Why it happens:** PixiJS v8 loads SVGs as textures, which requires async loading via `Assets.load()`.
**How to avoid:** For simple geometric avatar placeholders, consider using PixiJS `Graphics` primitives (circles, squares with colors) instead of SVG files. This avoids the asset loading pipeline entirely. SVG files can be introduced in Phase 8 (Visual Identity) when proper art assets arrive.
**Warning signs:** Empty avatar slots, flicker on first render.

### Pitfall 6: Profile Name Input Without DOM
**What goes wrong:** PixiJS has no built-in text input. Building a custom one is complex (cursor, selection, key handling).
**Why it happens:** Canvas rendering frameworks lack native form elements.
**How to avoid:** For the name input, use a hidden HTML `<input>` element overlaid on the canvas position, or use a simple PixiJS-based character picker. Given the constraint of max 12 chars for a child's first name, a simpler approach is: overlay a styled HTML input briefly for name entry, then return to PixiJS for the rest. This is the standard pattern for canvas-based games.
**Warning signs:** Attempting to build a full text input in PixiJS from scratch.

## Code Examples

### Profile Data Model (D-06, D-07, D-08)
```typescript
// src/persistence/types.ts
interface ProfileData {
  id: string
  name: string                    // max 12 chars, child's first name
  avatarId: string                // references pre-defined avatar
  cumulativeStats: CumulativeStats
  lastDifficultyParams: DifficultyParams | null  // null = fresh start
  preferredGameMode: GameMode | null
  recentSessions: SessionSummary[]  // max 10, newest first
  createdAt: string               // ISO date string
  schemaVersion: number           // for per-profile migration
}

interface CumulativeStats {
  totalSessions: number
  totalHits: number
  totalMisses: number
  bestAccuracy: number            // 0-100
}

interface SessionSummary {
  hits: number
  misses: number
  accuracy: number                // 0-100
  mode: GameMode
  date: string                    // ISO date string
}
```

### GameContext Extension (D-15)
```typescript
// Added to GameContext interface in types.ts
interface GameContext {
  // ... existing methods ...
  setActiveProfile(profile: ProfileData | null): void
  getActiveProfile(): ProfileData | null
  getProfileRepository(): ProfileRepository
}
```

### Avatar Placeholders Using Graphics
```typescript
// Simple geometric avatars, no SVG files needed
const AVATAR_DEFS = [
  { id: 'cat',    color: 0xff6b6b, shape: 'circle' },
  { id: 'star',   color: 0xffd93d, shape: 'star'   },
  { id: 'robot',  color: 0x6bceff, shape: 'square'  },
  { id: 'flower', color: 0xff6bde, shape: 'diamond' },
  { id: 'rocket', color: 0x6bff8e, shape: 'triangle'},
  { id: 'cloud',  color: 0xb16bff, shape: 'circle'  },
] as const

function drawAvatar(g: Graphics, def: AvatarDef, size: number): void {
  g.clear()
  // Draw shape with color, add simple face features
  // Large, colorful, immediately recognizable for 5-year-olds
}
```

### Session End: Save to Profile
```typescript
// In GameOverState.enter() or PlayingState.exit()
const profile = ctx.getActiveProfile()
if (profile) {
  const result = ctx.getSessionResult()
  if (result) {
    const summary: SessionSummary = {
      hits: result.hits,
      misses: result.misses,
      accuracy: result.total > 0 ? Math.round((result.hits / result.total) * 100) : 0,
      mode: result.mode,
      date: new Date().toISOString(),
    }
    const repo = ctx.getProfileRepository()
    repo.saveSessionSummary(profile.id, summary)

    // Also save difficulty params for next session restoration
    const difficulty = ctx.getDifficulty()
    if (difficulty) {
      profile.lastDifficultyParams = { ...difficulty }
      repo.save(profile)
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IndexedDB for all client storage | LocalStorage for small data, IndexedDB for large/binary | Always | Profile data < 10KB; LocalStorage is the right choice |
| JSON schema validation libraries | TypeScript interfaces + runtime checks | N/A | No need for ajv/zod for 4 profiles |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vite.config.ts` (inline test config) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile selection by avatar click loads correct profile | unit | `pnpm vitest run tests/game/profile-state.test.ts -t "select"` | Wave 0 |
| PROF-01 | First launch shows creation flow | unit | `pnpm vitest run tests/game/profile-state.test.ts -t "first launch"` | Wave 0 |
| PROF-02 | Profiles persist to LocalStorage and reload on boot | unit | `pnpm vitest run tests/persistence/local-storage.test.ts` | Wave 0 |
| PROF-02 | Session results saved to active profile | unit | `pnpm vitest run tests/persistence/local-storage.test.ts -t "session"` | Wave 0 |
| PROF-02 | Corrupted data handled gracefully | unit | `pnpm vitest run tests/persistence/local-storage.test.ts -t "corrupt"` | Wave 0 |
| D-08 | Schema migration applies defaults for missing fields | unit | `pnpm vitest run tests/persistence/schema.test.ts` | Wave 0 |
| D-09 | Cannot create more than 4 profiles | unit | `pnpm vitest run tests/persistence/local-storage.test.ts -t "max"` | Wave 0 |
| D-14 | State transitions: boot -> profiles -> menu | unit | `pnpm vitest run tests/game/states.test.ts -t "profiles"` | Extend existing |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/persistence/local-storage.test.ts` -- covers PROF-02, D-09
- [ ] `tests/persistence/schema.test.ts` -- covers D-08 schema versioning
- [ ] `tests/game/profile-state.test.ts` -- covers PROF-01 (profile selection behavior)
- [ ] Update `tests/game/states.test.ts` -- BootState now transitions to 'profiles', not 'menu'
- [ ] `localStorage` mock in test environment (Vitest runs in Node; needs `globalThis.localStorage` stub)

## Project Constraints (from CLAUDE.md)

- **No backend:** All client-side, Firebase only for optional cloud sync (Phase 10)
- **No new frameworks:** Vanilla TypeScript + PixiJS for rendering
- **Tailwind CSS:** For styling screens outside the game canvas (but profile screen is IN the canvas, so PixiJS-only)
- **pnpm:** Package manager
- **Vitest:** Test framework, config inline in vite.config.ts
- **Pre-commit hooks:** All formatting/linting handled by hooks; do not run formatters manually
- **No em dashes or en dashes** in any output
- **GSD workflow enforcement:** All edits through GSD commands
- **event.key** (not event.code) for keyboard input
- **Performance:** Animations fluid on modest machines
- **Child safety:** No personal data collected

## Open Questions

1. **Text input for profile name**
   - What we know: PixiJS has no native text input. Children aged 5-8 need something simple.
   - What's unclear: Whether an HTML overlay input or a PixiJS-based letter picker is better UX.
   - Recommendation: Use a hidden HTML `<input>` element positioned over the canvas for name entry. It is the simplest approach, supports mobile keyboards, and handles all edge cases (backspace, accents). Style it large and friendly with Tailwind. This is the standard pattern for canvas games needing text input.

2. **Preferred game mode behavior in MenuState (discretion item)**
   - What we know: Profile stores preferredGameMode.
   - Recommendation: Auto-highlight (visual emphasis) the preferred mode button but do not auto-select. The child should still actively choose, preserving agency.

3. **Error handling for corrupted data (discretion item)**
   - Recommendation: Silent reset to empty profiles array. A child should never see a JSON error. Log to `console.warn` for developer debugging.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/game/types.ts`, `src/game/states.ts`, `src/game/game.ts`, `src/game/difficulty.ts` -- current architecture patterns
- Phase 5 CONTEXT.md D-13 -- difficulty resets each session, Phase 6 stores/restores
- Phase 6 CONTEXT.md -- all locked decisions

### Secondary (MEDIUM confidence)
- LocalStorage API: MDN Web Docs, well-established browser API with 5-10MB limit per origin
- PixiJS v8 pointer events: confirmed by existing MenuState implementation in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing tech
- Architecture: HIGH -- repository pattern is well understood, state machine extension is mechanical
- Pitfalls: HIGH -- LocalStorage edge cases are well documented, codebase patterns are clear
- UI/UX: MEDIUM -- text input on canvas and avatar layout need validation during implementation

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain, no fast-moving dependencies)
