# Phase 3: Letter Mode Gameplay - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 03-letter-mode-gameplay
**Areas discussed:** Letter rendering, Letter selection, Feedback, Score & session, Accent handling
**Mode:** Auto (all decisions auto-selected with recommended defaults)

---

## Letter Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| BitmapText per letter | One BitmapText entity per falling letter, using existing GameFont | ✓ |
| SplitBitmapText | PixiJS v8.11+ feature for splitting text into characters | |

**User's choice:** [auto] BitmapText per letter (recommended default)
**Notes:** GameFont already installed in BootState. Large ~80px size for child visibility. Bright cycling color palette.

---

## Letter Selection & Difficulty

| Option | Description | Selected |
|--------|-------------|----------|
| Home row first | Start ASDF JKL;, gradually add rows | ✓ |
| Full alphabet random | All 26 letters equally weighted from start | |
| Frequency-based | Common letters first (E, T, A, O...) | |

**User's choice:** [auto] Home row first (recommended default)
**Notes:** Standard typing pedagogy. Fixed difficulty -- no adaptive ramp in Phase 3.

---

## Visual Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Scale + green flash | Letter scales up, flashes green, fades out | ✓ |
| Explosion particles | Letter bursts into particles | |
| Simple fade | Letter just fades away | |

**User's choice:** [auto] Scale + green flash for correct, gentle red flash + shake for wrong (recommended default)
**Notes:** Non-punitive wrong-key feedback aligns with core value. No scary effects for 5-year-olds.

---

## Score & Session Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed letter count | Session ends after N letters (e.g., 20) | ✓ |
| Time-based | Session lasts X seconds | |
| Infinite until quit | Player decides when to stop | |

**User's choice:** [auto] Fixed letter count with results screen (recommended default)
**Notes:** Simple hit counter top-right. Results show hits/misses/accuracy. "Rejouer" button.

---

## Accent Handling

| Option | Description | Selected |
|--------|-------------|----------|
| ASCII-only (a-z) | No accented characters | ✓ |
| Include common accents | e, a, c, etc. | |

**User's choice:** [auto] ASCII-only for Phase 3 (recommended default)
**Notes:** Resolves STATE.md blocker about accented characters. Dead-key handling deferred.

---

## Claude's Discretion

- Exact color palette values
- Animation timing/easing specifics
- Results screen layout
- Letter spawn positioning
- Exact session letter count

## Deferred Ideas

- Accented character support -- future phase
- Sound effects -- Phase 9
- Particle effects -- Phase 8
- Adaptive difficulty -- Phase 5
- Streak/combo system -- Phase 7+
