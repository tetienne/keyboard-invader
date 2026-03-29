# Roadmap: Keyboard Invader

## Overview

Keyboard Invader transforms typing practice into a fun game for children ages 5-8. The build progresses from project scaffolding and game engine foundation through core gameplay mechanics, then layers on adaptive difficulty, profiles, audio/visual polish, and finally optional cloud sync. Each phase delivers a coherent, testable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Scaffolding & Dev Tooling** - TypeScript + Vite + PixiJS project with strict linting, pre-commit hooks, and deployment pipeline
- [ ] **Phase 2: Game Engine Foundation** - Game loop, state machine, input handling (AZERTY-safe), and canvas rendering infrastructure
- [ ] **Phase 3: Letter Mode Gameplay** - Single-letter falling invaders with keyboard input matching and basic collision detection
- [ ] **Phase 4: Word Mode & Game Modes** - Word-based gameplay for older children, mode selection, pause/resume, score display, and session summary
- [ ] **Phase 5: Adaptive Difficulty** - Real-time difficulty adjustment targeting 70% success rate via speed, complexity, and spawn rate
- [ ] **Phase 6: Profiles & Local Persistence** - Avatar-based child profiles with LocalStorage saving of all progress
- [ ] **Phase 7: Progression System** - XP earning, leveling, and level-up celebration animations
- [ ] **Phase 8: Visual Identity** - Cartoon/SVG art style, character sprites, visual effects, and 60fps rendering validation
- [ ] **Phase 9: Audio System** - Sound effects, background music, volume controls, and autoplay policy handling
- [ ] **Phase 10: Responsive Layout & Cross-Browser** - Desktop-first responsive design with tablet/mobile support and browser compatibility

## Phase Details

### Phase 1: Project Scaffolding & Dev Tooling
**Goal**: Developers have a fully configured, strict TypeScript project that builds, lints, and deploys to a free hosting platform
**Depends on**: Nothing (first phase)
**Requirements**: DX-01, DX-02, DX-03, DX-04, DX-05, INFRA-01
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` produces a deployable static bundle with zero errors
  2. A commit with a linting violation is rejected by pre-commit hooks
  3. The built application is live on a free hosting platform (Cloudflare Pages or equivalent)
  4. TypeScript strict mode catches an `any` type as a compile error
  5. The project includes PixiJS, Tailwind CSS, and Vite as configured dependencies
**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md -- Project init: pnpm, TypeScript strict, Vite, ESLint, Prettier, Tailwind, i18n foundation
- [ ] 01-02-PLAN.md -- PixiJS canvas test page, Vite entry HTML, Vitest smoke tests
- [ ] 01-03-PLAN.md -- prek hooks, commitlint, GitHub Actions CI/CD, Cloudflare Workers deploy, LICENSE, README

### Phase 2: Game Engine Foundation
**Goal**: A running game loop with keyboard input capture, canvas rendering, and state transitions that a developer can verify in-browser
**Depends on**: Phase 1
**Requirements**: GAME-01 (partial -- rendering infrastructure), AV-04
**Success Criteria** (what must be TRUE):
  1. A PixiJS canvas renders at 60fps with a fixed-timestep game loop running
  2. Keyboard input is captured using event.key (not event.code) and correctly handles AZERTY layouts
  3. The game transitions between states (boot, menu, playing, paused) via a finite state machine
  4. Object pooling is in place -- no per-frame allocations visible in DevTools memory timeline
  5. Tab visibility changes pause/resume the game loop automatically
**Plans**: TBD
**UI hint**: yes

### Phase 3: Letter Mode Gameplay
**Goal**: A 5-year-old can play a complete session of falling letters, pressing keys to destroy them, with immediate visual feedback
**Depends on**: Phase 2
**Requirements**: GAME-01, GAME-02, GAME-04, GAME-05
**Success Criteria** (what must be TRUE):
  1. Single letters fall from the top of the screen at a steady pace
  2. Pressing the correct key destroys the matching letter with a visible effect
  3. Pressing an incorrect key shows a distinct "wrong" visual feedback (no punishment, just indication)
  4. A score counter is visible on screen and increments on successful hits
**Plans**: TBD
**UI hint**: yes

### Phase 4: Word Mode & Game Modes
**Goal**: An 8-year-old can play word mode, both children can choose their mode, and sessions have a clear start/pause/end flow
**Depends on**: Phase 3
**Requirements**: GAME-03, GAME-06, GAME-07
**Success Criteria** (what must be TRUE):
  1. The child can select between letter mode and word mode before starting a session
  2. In word mode, complete words fall and the child types them letter-by-letter to destroy them
  3. The child can pause the game at any time and resume from where they left off
  4. At the end of a session, a summary screen shows accuracy, items practiced, and time played
**Plans**: TBD
**UI hint**: yes

### Phase 5: Adaptive Difficulty
**Goal**: The game automatically adjusts to each child's skill level, keeping them in a flow state rather than bored or frustrated
**Depends on**: Phase 4
**Requirements**: DIFF-01, DIFF-02, DIFF-03, DIFF-04
**Success Criteria** (what must be TRUE):
  1. A child who hits most letters sees the fall speed gradually increase
  2. A child who misses frequently sees the fall speed decrease (faster than the increase rate)
  3. Word complexity and length adapt to the child's demonstrated ability
  4. The spawn rate of new items adjusts so the screen is neither empty nor overwhelming
  5. Over a play session, the child's success rate converges toward approximately 70%
**Plans**: TBD

### Phase 6: Profiles & Local Persistence
**Goal**: Two children sharing the same computer each have their own profile with saved progress, selectable by clicking their avatar
**Depends on**: Phase 5
**Requirements**: PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. The app opens to a profile selection screen showing avatar icons for each child
  2. Clicking an avatar loads that child's saved progress (difficulty level, scores, settings)
  3. A new profile can be created by choosing an avatar and a name
  4. Closing the browser and reopening preserves all profile data via LocalStorage
**Plans**: TBD
**UI hint**: yes

### Phase 7: Progression System
**Goal**: Children earn XP, level up with celebration, and feel motivated to return and play again
**Depends on**: Phase 6
**Requirements**: PROG-01, PROG-02, PROG-03
**Success Criteria** (what must be TRUE):
  1. After each session, the child sees XP earned based on their performance
  2. Accumulated XP fills a visible progress bar toward the next level
  3. Reaching a new level triggers an animated celebration moment (not just a number change)
  4. XP and level are saved to the child's profile and persist across sessions
**Plans**: TBD
**UI hint**: yes

### Phase 8: Visual Identity
**Goal**: The game has a cohesive cartoon art style that appeals to children ages 5-8, with expressive characters and smooth visual effects
**Depends on**: Phase 7
**Requirements**: AV-01
**Success Criteria** (what must be TRUE):
  1. Falling letters/words have cartoon-styled containers or character decorations (not plain text)
  2. The game uses a consistent color palette and rounded, child-friendly visual language
  3. Destruction effects (particles, pops, sparkles) play when a letter/word is eliminated
  4. All visual elements render without jank at 60fps on a mid-range laptop (validated with 4x CPU throttle)
**Plans**: TBD
**UI hint**: yes

### Phase 9: Audio System
**Goal**: The game has satisfying sound effects and ambient music that make typing feel rewarding, with parent-friendly volume controls
**Depends on**: Phase 3 (can run in parallel with Phases 6-8 after core gameplay exists)
**Requirements**: AV-02, AV-03
**Success Criteria** (what must be TRUE):
  1. Each correct keypress plays a satisfying destruction sound
  2. Incorrect keypresses play a gentle "miss" sound (not punishing)
  3. Background music plays during gameplay with a visible volume slider
  4. Audio initializes correctly on first user interaction (no silent game due to autoplay policy)
**Plans**: TBD

### Phase 10: Responsive Layout & Cross-Browser
**Goal**: The game works well on desktop, is usable on tablets, and functions correctly across all modern browsers
**Depends on**: Phase 8
**Requirements**: INFRA-02, INFRA-03, PROF-03
**Success Criteria** (what must be TRUE):
  1. On desktop, the game fills the viewport appropriately with readable text and comfortable play area
  2. On a tablet, the game layout adapts and remains playable (with a message about needing a physical keyboard)
  3. The game functions correctly on Chrome, Firefox, Safari, and Edge (latest versions)
  4. Firebase cloud sync can be enabled for cross-device profile synchronization (optional feature toggle)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding & Dev Tooling | 0/3 | Planning complete | - |
| 2. Game Engine Foundation | 0/0 | Not started | - |
| 3. Letter Mode Gameplay | 0/0 | Not started | - |
| 4. Word Mode & Game Modes | 0/0 | Not started | - |
| 5. Adaptive Difficulty | 0/0 | Not started | - |
| 6. Profiles & Local Persistence | 0/0 | Not started | - |
| 7. Progression System | 0/0 | Not started | - |
| 8. Visual Identity | 0/0 | Not started | - |
| 9. Audio System | 0/0 | Not started | - |
| 10. Responsive Layout & Cross-Browser | 0/0 | Not started | - |

## Backlog

### Phase 999.1: Systeme de code pour sauvegarder sa progression (BACKLOG)

**Goal:** Permettre aux enfants de sauvegarder/restaurer leur progression via un code (alternative au cloud sync, sans compte utilisateur)
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
