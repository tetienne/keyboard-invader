---
phase: quick-260426-pph
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/game/states.ts
  - tests/game/states.test.ts
autonomous: true
requirements:
  - QUICK-260426-PPH
must_haves:
  truths:
    - "Letter aliens call updateIdle(dt) every frame in PlayingState.update fall loop (continuous bobbing/blinking even while tweening)"
    - "Word aliens call updateIdle(dt) every frame in PlayingState.update fall loop (continuous bobbing/blinking even while tweening)"
    - "Vitest test asserts updateIdle is invoked on spawned entities for BOTH modes"
    - "ESLint and pnpm test pass after the fix"
  artifacts:
    - path: src/game/states.ts
      provides: "PlayingState.update() with two updateIdle(dt) call sites — one per fall loop"
      contains: "entity.container.updateIdle(dt)"
    - path: tests/game/states.test.ts
      provides: "Regression tests proving updateIdle is invoked for letter and word entities"
      contains: "updateIdle).toHaveBeenCalled"
  key_links:
    - from: src/game/states.ts (PlayingState.update activeEntities loop)
      to: AlienContainer.updateIdle
      via: "entity.container.updateIdle(dt) called outside the tween guard"
      pattern: "entity\\.container\\.updateIdle\\(dt\\)"
    - from: src/game/states.ts (PlayingState.update activeWordEntities loop)
      to: AlienContainer.updateIdle
      via: "entity.container.updateIdle(dt) called outside the tween guard"
      pattern: "entity\\.container\\.updateIdle\\(dt\\)"
---

<objective>
Restore the regressed `entity.container.updateIdle(dt)` wiring in `PlayingState.update()` for both the `activeEntities` (letter) and `activeWordEntities` (word) fall loops. This call was added in commit `e10348e` (Phase 8.1) but was lost when commit `60147bf` restored planning artifacts from a wiped worktree without restoring the source change. Confirmed via `grep -rn "updateIdle" src/` → only the definition site at `src/game/alien-container.ts:32` remains; **zero call sites**.

Add a regression test that asserts `updateIdle` is invoked on spawned entities so this can never silently regress again.

Purpose: Aliens currently fall as static sprites with no bobbing or blinking — child UX feels lifeless. The animation logic exists in `AlienContainer.updateIdle()` but is never invoked.
Output: Two restored call sites in `states.ts` + new positive assertions in `states.test.ts`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@src/game/states.ts
@src/game/alien-container.ts
@tests/game/states.test.ts

<interfaces>
<!-- Key contracts. Extracted from codebase. Executor must NOT explore further. -->

From src/game/alien-container.ts:
```typescript
export class AlienContainer extends Container {
  // ... other members
  updateIdle(dt: number): void {
    // Bobbing + occasional blink. Safe to call every frame, including
    // while the entity is tweening — does not touch position.x/y of the
    // container (only sprite child y) so it does not conflict with the
    // tween system.
  }
}
```

From src/game/letters.ts (LetterEntity) and src/game/words.ts (WordEntity):
Both have `container: AlienContainer` (typed via interface). `entity.container.updateIdle(dt)` is the call shape.

Existing target loops in src/game/states.ts (PlayingState.update, around lines 564-574):
```typescript
const dtSec = dt / 1000
for (const entity of this.activeEntities) {
  if (entity.tween === null && !entity.markedForRemoval) {
    entity.container.y += fallSpeed * dtSec
  }
}
for (const entity of this.activeWordEntities) {
  if (entity.tween === null && !entity.markedForRemoval) {
    entity.container.y += fallSpeed * dtSec
  }
}
```

Test mocks already expose `updateIdle: vi.fn()` on every spawned pool item:
- tests/game/states.test.ts lines 153, 180, 424, 456, 491, 536, 582, 842
The mocks are READY — they've been in the test file since Phase 8.1. We just need to add positive assertions and wire the source.
</interfaces>

<reference_diff>
The exact restoration from commit `e10348e` (PR-ready):
```diff
 const dtSec = dt / 1000
 for (const entity of this.activeEntities) {
+  entity.container.updateIdle(dt)
   if (entity.tween === null && !entity.markedForRemoval) {
     entity.container.y += fallSpeed * dtSec
   }
 }
 for (const entity of this.activeWordEntities) {
+  entity.container.updateIdle(dt)
   if (entity.tween === null && !entity.markedForRemoval) {
     entity.container.y += fallSpeed * dtSec
   }
 }
```

Note: `updateIdle` is called BEFORE the tween-guard `if` (i.e. unconditionally). Per Phase 8.1 design: "updateIdle runs on ALL entities (including tweening) for continuous bobbing/blinking" — bobbing animates `sprite.y` (a child of the container), not `container.y`, so there is no conflict with the tween system which animates `container.x` / `container.scale`.
</reference_diff>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add regression tests proving updateIdle is invoked for both modes</name>
  <files>tests/game/states.test.ts</files>
  <behavior>
    - In an existing letter-mode test (or a new dedicated `it(...)` block), after `state.update(ctx, dt)` runs at least once with at least one spawned entity, assert that the spawned entity's `updateIdle` mock has been called at least once.
    - Same assertion for word mode using the word pool item mock.
    - Both tests MUST FAIL before the source wiring is added (proving they catch the regression).
    - Both tests MUST PASS after Task 2 wires the calls.
  </behavior>
  <action>
    Open `tests/game/states.test.ts`. Add two NEW focused regression tests inside the existing `describe('PlayingState')` block (placement: near the other update/fall tests).

    Pattern for letter mode:
    1. Use the existing `createMockGameContext()` helper with letter mode.
    2. Capture the spawned item by storing the mocked pool-item object in a local array (mirror the pattern at lines 478-496).
    3. Call `state.enter(ctx)` then `state.update(ctx, 5000)` to spawn.
    4. Call `state.update(ctx, 16)` again so a fall-loop pass runs over the spawned entity.
    5. Assert: `expect(items[0].updateIdle).toHaveBeenCalled()`.

    Pattern for word mode: identical structure but use `createWordMockGameContext()` (the helper around line 818) and `acquireWordPoolItem`.

    Test names (exact):
    - `it('calls updateIdle on letter entities each frame for bobbing/blinking', ...)`
    - `it('calls updateIdle on word entities each frame for bobbing/blinking', ...)`

    DO NOT modify `src/game/states.ts` in this task. RED step: run `pnpm test -- tests/game/states.test.ts` and confirm BOTH new tests fail with a clear "expected updateIdle to have been called" message before committing.

    Commit only AFTER confirming both tests fail. Commit message: `test(quick-260426-pph): add failing regression tests for alien updateIdle wiring`.
  </action>
  <verify>
    <automated>pnpm test -- tests/game/states.test.ts 2>&1 | grep -E "(calls updateIdle on letter|calls updateIdle on word)" && pnpm exec eslint tests/</automated>
  </verify>
  <done>
    Two new `it(...)` blocks exist in tests/game/states.test.ts, both fail at the `toHaveBeenCalled()` assertion with the source still un-wired, ESLint clean on tests/, atomic commit landed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Re-wire updateIdle(dt) into both fall loops</name>
  <files>src/game/states.ts</files>
  <behavior>
    - After this change, the regression tests from Task 1 PASS.
    - All previously passing tests STILL PASS (no regressions).
    - `grep -c "entity\.container\.updateIdle(dt)" src/game/states.ts` returns exactly `2`.
    - ESLint is clean.
  </behavior>
  <action>
    Open `src/game/states.ts`. Locate `PlayingState.update` (currently around line 531). Find the two consecutive `for` loops over `this.activeEntities` and `this.activeWordEntities` immediately after `const dtSec = dt / 1000` (around lines 564-574).

    Add `entity.container.updateIdle(dt)` as the FIRST statement inside each loop body, BEFORE the `if (entity.tween === null && !entity.markedForRemoval)` guard. This matches the original Phase 8.1 design: bobbing/blinking runs on all entities, including tweening ones, because `updateIdle` only mutates `sprite.y` (a child) not `container.y` / `container.x` / `container.scale` (which the tween system owns).

    Final shape:
    ```typescript
    const dtSec = dt / 1000
    for (const entity of this.activeEntities) {
      entity.container.updateIdle(dt)
      if (entity.tween === null && !entity.markedForRemoval) {
        entity.container.y += fallSpeed * dtSec
      }
    }
    for (const entity of this.activeWordEntities) {
      entity.container.updateIdle(dt)
      if (entity.tween === null && !entity.markedForRemoval) {
        entity.container.y += fallSpeed * dtSec
      }
    }
    ```

    Do NOT introduce a helper function or refactor the loops. This is a 2-line restoration — adding abstractions would exceed scope.

    Verify the wiring count BEFORE running the test suite:
    `grep -c "entity\.container\.updateIdle(dt)" src/game/states.ts` → must print `2`.

    Then run `pnpm test` (full suite) and `pnpm exec eslint src/ tests/`. Both must pass cleanly.

    Commit message: `fix(quick-260426-pph): re-wire AlienContainer.updateIdle in PlayingState fall loops`.

    Commit body should include:
    - Brief regression context (lost in worktree wipe at commit 60147bf, originally added in e10348e).
    - Confirmation that grep verifies 2 call sites.
    - Confirmation that the new regression tests now pass.
  </action>
  <verify>
    <automated>test "$(grep -c 'entity\.container\.updateIdle(dt)' src/game/states.ts)" = "2" && pnpm test && pnpm exec eslint src/ tests/</automated>
  </verify>
  <done>
    `grep -c "entity\.container\.updateIdle(dt)" src/game/states.ts` returns 2; full `pnpm test` suite green including the two new regression tests; ESLint clean on src/ and tests/; atomic commit landed.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `grep -rn "updateIdle" src/` → must show 3 lines: 1 definition (`alien-container.ts:32`) + 2 call sites (`states.ts`).
2. `pnpm test` → entire suite green; the two new tests in `states.test.ts` (`calls updateIdle on letter entities…`, `calls updateIdle on word entities…`) appear in passing output.
3. `pnpm exec eslint src/ tests/` → zero errors.
4. `git log --oneline -3` → shows two new atomic commits with `quick-260426-pph` scope (test commit then fix commit).
5. Manual smoke (optional, not blocking): `pnpm dev` → start a session → falling aliens visibly bob and occasionally blink. (Documented for the human; CI/automated checks above are sufficient to mark plan done.)
</verification>

<success_criteria>
- [ ] Regression tests added in tests/game/states.test.ts assert `updateIdle` is called for letter AND word modes
- [ ] Both regression tests demonstrably failed before the source fix (committed as a separate "red" commit)
- [ ] `entity.container.updateIdle(dt)` appears in BOTH fall loops in src/game/states.ts (exactly 2 occurrences)
- [ ] `pnpm test` passes (full suite) — no regressions
- [ ] `pnpm exec eslint src/ tests/` passes
- [ ] Two atomic conventional commits: `test(quick-260426-pph): ...` then `fix(quick-260426-pph): ...`
- [ ] No new abstractions, helpers, or refactors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260426-pph-re-wire-aliencontainer-updateidle-dt-in-/260426-pph-SUMMARY.md` documenting:
- The 2 lines restored
- Test additions (names + line ranges)
- Commit hashes for the test and fix commits
- `grep -c` verification result
- Confirmation that no ROADMAP.md changes were made (per quick-task constraint)
</output>
