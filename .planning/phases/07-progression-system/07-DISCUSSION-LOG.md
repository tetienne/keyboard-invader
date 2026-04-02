# Phase 7: Progression System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 07-progression-system
**Areas discussed:** XP formula & leveling curve, Level-up celebration, Progress visibility, Level rewards & motivation, XP bar visual design, Level-up timing & flow, Schema migration strategy, Locked avatar UX

---

## XP Formula & Leveling Curve

### XP Scaling Model

| Option | Description | Selected |
|--------|-------------|----------|
| Accuracy-based | XP = base per hit + accuracy bonus. Higher accuracy earns more per hit. | ✓ |
| Flat per hit | Fixed XP per correct hit. Simple, predictable. | |
| Time-weighted | XP based on time played + hits. Rewards engagement. | |

**User's choice:** Accuracy-based
**Notes:** Aligns with the 70% target from adaptive difficulty. Rewards quality over quantity.

### Level Count & Curve

| Option | Description | Selected |
|--------|-------------|----------|
| 10 levels, gentle curve | Early levels fast (2-3 sessions), later slower (5-8 sessions) | ✓ |
| 20 levels, linear | Consistent XP per level, more granular | |
| 5 levels, fast | Quick progression, max level in days | |

**User's choice:** 10 levels, gentle curve
**Notes:** Achievable within weeks of regular play.

### Mode XP Multiplier

| Option | Description | Selected |
|--------|-------------|----------|
| Word mode = 1.5x | Words are harder, multiplier rewards the challenge | ✓ |
| Same XP for both modes | Both kids progress at same rate | |
| You decide | Claude picks | |

**User's choice:** Word mode = 1.5x

---

## Level-Up Celebration

### Presentation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen overlay | Takes over screen for 2-3 sec after results, auto-dismisses | ✓ |
| Inline in results screen | Part of session summary, smaller animation | |
| Separate state | New 'levelup' state in state machine | |

**User's choice:** Full-screen overlay

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Particles + scale burst | Stars/confetti burst outward, level number scales with bounce | ✓ |
| Simple glow + text | Level number glows and pulses, 'Level Up!' text fades in | |
| You decide | Claude picks based on tween system capabilities | |

**User's choice:** Particles + scale burst

---

## Progress Visibility

### In-Game HUD

| Option | Description | Selected |
|--------|-------------|----------|
| No in-game display | Level/XP only on results and profile screens | |
| Small level badge in corner | Just level number in top corner | |
| Level + mini XP bar | Both level number and thin XP bar during gameplay | ✓ |

**User's choice:** Level + mini XP bar
**Notes:** User chose maximum visibility over clean gameplay screen.

### Results Screen XP Display

| Option | Description | Selected |
|--------|-------------|----------|
| Animated XP bar fill | XP bar animates from previous to new XP, level-up triggers overlay | ✓ |
| Static XP summary | Just '+X XP' text and current level | |
| You decide | Claude picks | |

**User's choice:** Animated XP bar fill

### Profile Screen Level Display

| Option | Description | Selected |
|--------|-------------|----------|
| Level badge on avatar | Small level number on/near avatar in selection screen | ✓ |
| Level + XP bar per profile | Both level and XP bar per profile card | |
| No level on profile screen | Level only visible in-game | |

**User's choice:** Level badge on avatar

---

## Level Rewards & Motivation

### Unlock System

| Option | Description | Selected |
|--------|-------------|----------|
| Unlock new avatars | 3 free + 3 locked, unlockable at specific levels | ✓ |
| Cosmetic titles only | Each level grants a title, no avatar unlocks | |
| No unlocks | Purely numeric progression | |
| Both avatars + titles | Unlock avatars AND earn titles | |

**User's choice:** Unlock new avatars

### Avatar Lock Split

| Option | Description | Selected |
|--------|-------------|----------|
| 3 free, 3 unlockable | Unlocked at levels 3, 5, and 8 | ✓ |
| All 6 free, add new ones | Keep current avatars free, add new locked ones | |
| You decide | Claude picks | |

**User's choice:** 3 free, 3 unlockable

---

## XP Bar Visual Design

| Option | Description | Selected |
|--------|-------------|----------|
| Rounded pill, gradient fill | Capsule shape, blue-to-purple gradient, level on left, XP on right | ✓ |
| Flat rectangular bar | Simple flat bar with solid color | |
| You decide | Claude picks | |

**User's choice:** Rounded pill, gradient fill

---

## Level-Up Timing & Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Bar fills, overlay triggers, bar resets | XP bar to 100%, celebration overlay, bar resets at new level. Repeats for multi-level-up. | ✓ |
| Bar fills, inline celebration, continues | Smaller inline flash, no overlay | |
| Show final state only | One celebration, then show final level/XP | |

**User's choice:** Bar fills, overlay triggers, bar resets

---

## Schema Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-migrate with defaults | v1 profiles get xp: 0, level: 1. All existing avatars remain. | ✓ |
| Reset + retroactive XP | Calculate XP from sessionHistory retroactively | |
| You decide | Claude picks based on schema.ts patterns | |

**User's choice:** Auto-migrate with defaults

---

## Locked Avatar UX

| Option | Description | Selected |
|--------|-------------|----------|
| Grayed + lock icon + level label | Gray out locked avatars, lock icon, "Niv. 5" label, encouraging message on tap | ✓ |
| Hidden until unlocked | Locked avatars not shown | |
| Silhouette outline | Dark mystery shapes | |

**User's choice:** Grayed + lock icon + level label

---

## Claude's Discretion

- Exact XP values per hit and accuracy bonus multiplier formula
- Exact XP thresholds per level (following gentle curve constraint)
- Particle count, colors, and animation timing for celebration
- XP bar dimensions and positioning in HUD vs results screen
- Lock icon design and tooltip positioning

## Deferred Ideas

- Cosmetic titles per level -- could be Phase 8
- Retroactive XP from session history -- decided against
- Full character sprites beyond avatars -- Phase 8
