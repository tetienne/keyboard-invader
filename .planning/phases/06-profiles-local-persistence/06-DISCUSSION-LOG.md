# Phase 6: Profiles & Local Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 06-profiles-local-persistence
**Areas discussed:** Profile selection flow, Avatar system, Profile data shape, Profile management
**Mode:** Auto (all defaults selected automatically)

---

## Profile Selection Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated profile screen before menu | New state between boot and menu, app opens to profiles | Yes |
| Profiles embedded in menu | Add profile selector within MenuState | |
| Profile screen only on first launch | Skip profile selection after initial setup | |

**User's choice:** [auto] Dedicated profile screen before menu (recommended default)
**Notes:** Success criteria #1 explicitly states "app opens to a profile selection screen"

| Option | Description | Selected |
|--------|-------------|----------|
| Show creation flow directly (first-run) | Guide user to create first profile when none exist | Yes |
| Show empty state with "add" button | Display empty profile grid with add button | |

**User's choice:** [auto] Show creation flow directly (recommended default)
**Notes:** Reduces friction for first-time setup

## Avatar System

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-defined set of 6-8 avatars | Colorful cartoon SVG avatars to pick from | Yes |
| Initials-based auto-generated | Generate avatar from child's name initials | |
| Upload custom photo | Let parent upload a photo | |

**User's choice:** [auto] Pre-defined set of 6-8 avatars (recommended default)
**Notes:** Simple, visually appealing, consistent with Phase 8 visual identity plans

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar changeable from profile edit | Child can switch avatar later | Yes |
| Avatar locked after creation | One-time choice | |

**User's choice:** [auto] Avatar changeable (recommended default)
**Notes:** Low complexity, prevents regret

## Profile Data Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Full stats + difficulty + mode preference | Name, avatar, cumulative stats, last difficulty params, preferred mode, creation date | Yes |
| Minimal (name + avatar only) | Just identification, no stats | |
| Full + complete session history | Store every session ever played | |

**User's choice:** [auto] Full stats + difficulty + mode preference (recommended default)
**Notes:** Covers Phase 5 D-13 (restore difficulty) and Phase 4 D-15 (persist mode)

| Option | Description | Selected |
|--------|-------------|----------|
| Last 10 sessions summary | Bounded history for XP calculations | Yes |
| No session history | Only cumulative stats | |
| Unlimited session history | Store all sessions | |

**User's choice:** [auto] Last 10 sessions summary (recommended default)
**Notes:** Bounded growth, sufficient for Phase 7 XP

## Profile Management

| Option | Description | Selected |
|--------|-------------|----------|
| 4 profiles max | Clean selection screen for household use | Yes |
| Unlimited profiles | No cap | |
| 2 profiles max | Minimal | |

**User's choice:** [auto] 4 profiles max (recommended default)
**Notes:** Covers typical household, keeps UI manageable

| Option | Description | Selected |
|--------|-------------|----------|
| Delete with confirmation | Parent-facing action with safety step | Yes |
| No deletion | Profiles permanent | |
| Delete without confirmation | Quick delete | |

**User's choice:** [auto] Delete with confirmation (recommended default)
**Notes:** Prevents accidental deletion by young children

## Claude's Discretion

- LocalStorage key naming and serialization format
- Profile selection screen layout and animations
- Avatar placeholder designs
- Error handling for corrupted data
- Preferred mode auto-selection behavior in MenuState

## Deferred Ideas

None -- discussion stayed within phase scope
