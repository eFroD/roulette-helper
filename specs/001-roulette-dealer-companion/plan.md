# Implementation Plan: Roulette Dealer Companion

**Branch**: `001-roulette-dealer-companion` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-roulette-dealer-companion/spec.md`

## Summary

A zero-dependency static web app that computes roulette payouts for an amateur dealer at a private party. The dealer enters the winning number after the throw; the app derives the six (or one, for zero) winning fields, locks every losing field so a lost bet cannot be entered at all, and shows stake / win / total / **per-chip** win for each occupied field plus a round total.

**Technical approach**: Plain ES modules, no build step, no framework, no runtime dependencies. The domain logic (wheel geometry, odds, round state machine) lives in three pure modules with no DOM access, which makes every one of the seven reference scenarios directly executable under Node's built-in test runner without a browser, a bundler, or a single `npm install`. A thin imperative render layer redraws from round state on each action. Served as static files by nginx in a minimal Docker Compose stack.

**The decision that shapes the most code**: the app is served over plain HTTP on a LAN address, which is *not* a secure context. That rules out Service Workers and the native Screen Wake Lock API (see [research.md](./research.md) R-004/R-005). Offline resilience therefore comes from having no network dependency at all rather than from a service worker, and the no-sleep requirement uses a muted-looping-video fallback with native Wake Lock as a progressive upgrade.

## Technical Context

**Language/Version**: JavaScript ES2022 (native ES modules), HTML5, CSS3. No transpilation, no build step.

**Primary Dependencies**: None at runtime. Zero npm packages shipped. Node.js 20+ is a *development-only* prerequisite for running tests (uses the built-in `node:test` and `node:assert` — still no `npm install`).

**Storage**: N/A. Round state is in-memory only and intentionally lost on reload (FR-030). Host configuration lives in a plain-text `public/config.js` edited before the party.

**Testing**: `node --test` against the three pure domain modules. The seven reference scenarios from the spec map 1:1 onto test cases. Browser-level checks are a documented manual pass in [quickstart.md](./quickstart.md).

**Target Platform**: Evergreen mobile/desktop browsers (Chrome/Edge 111+, Safari 16.4+, Firefox 115+) on a tablet in landscape as the primary case and a laptop as secondary. Delivered by nginx (alpine) via Docker Compose over plain HTTP on the host LAN.

**Project Type**: Single static single-page web app. No backend, no API, no database.

**Performance Goals**: Interactive in under 3 s on tablet hardware over LAN (SC-008) — the whole payload is well under 100 KB uncompressed. Every recalculation after a tap completes within one animation frame (< 16 ms); the domain model is 49 fields, so this is not a real constraint, only a ceiling on render sloppiness.

**Constraints**:
- Fully functional with the network unplugged once loaded; no external hosts, no CDN, no web fonts, no analytics (FR-025, SC-006).
- No secure context available → no Service Worker, no native Wake Lock as the primary path.
- Touch targets: number cells ≥ 56 × 56 CSS px, outside-bet buttons ≥ 72 px tall, primary actions ≥ 64 px (FR-027).
- Payout figures ≥ 24 px, round total ≥ 40 px, contrast ratio ≥ 7:1 against the dark background (FR-028, FR-032, SC-007).
- No persistence of any kind, no player data (FR-030).

**Scale/Scope**: One device, one table, one dealer at a time. 49 bet fields (37 numbers + 12 outside bets), one screen, no navigation. Estimated ~900 lines of source across all files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: NO ACTIVE GATES — constitution not ratified.**

`.specify/memory/constitution.md` is still the unmodified scaffold: every principle is an unreplaced placeholder (`[PRINCIPLE_1_NAME]`, `[SECTION_2_CONTENT]`, `[GOVERNANCE_RULES]`). There are no project principles to check this design against, so the gate passes vacuously rather than on merit.

In the absence of ratified principles, this plan applies two conventional defaults and records them so a future constitution can confirm or overturn them:

| Applied default | How this design honours it |
|---|---|
| **Simplicity / YAGNI** | No framework, no build step, no bundler, no package manager, no state library. Three pure modules plus one render layer. Every dependency that was considered was rejected — see research.md. |
| **Testability** | All arithmetic and all state transitions sit in DOM-free modules. The seven reference scenarios are executable tests, not manual checks. |

**Recommendation (non-blocking)**: run `/speckit-constitution` if this project should carry real governance. Nothing in this plan depends on the outcome.

**Post-Phase 1 re-check**: Still passing. The Phase 1 design introduced no new projects, no new dependencies, and no patterns requiring justification. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-roulette-dealer-companion/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── config-contract.md    # Host-editable configuration schema
│   └── domain-api.md         # Public API of the pure domain modules
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
public/                        # nginx document root — everything here is served verbatim
├── index.html                 # Single page; whole UI skeleton
├── config.js                  # HOST-EDITABLE. Loaded before the app, defines window.ROULETTE_CONFIG
├── manifest.webmanifest       # Add-to-homescreen metadata
├── css/
│   └── style.css              # Dark casino theme, tableau grid, field states, typography scale
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── js/
    ├── domain/                # PURE. No DOM, no globals, no side effects. Directly unit-tested.
    │   ├── wheel.js           # Number colours, the 49-field catalogue, winner derivation
    │   ├── payout.js          # Odds table, per-field result, round totals
    │   └── round.js           # Immutable round state machine + undo log
    ├── ui/
    │   ├── tableau.js         # Builds the 0–36 grid and the outside-bet buttons once
    │   ├── render.js          # Applies round state to the DOM (field states, figures, total)
    │   ├── history.js         # Last-N winning numbers strip
    │   └── dialogs.js         # Confirmation prompts for number change and next round
    ├── platform/
    │   ├── nosleep.js         # Video-fallback wake lock with native upgrade (see research R-005)
    │   └── fullscreen.js      # Fullscreen toggle (works without a secure context)
    └── main.js                # Wiring: config load, event delegation, action dispatch

tests/                         # node --test; imports directly from public/js/domain/
├── wheel.test.js              # Colours, dozen/column/half/parity mapping, zero handling
├── payout.test.js             # Odds, per-chip figures, reference scenarios 3–5
├── round.test.js              # State machine, undo, clear field, number change, reset
└── reference-scenarios.test.js# The seven spec acceptance cases, named as in spec.md

docker-compose.yml             # Single nginx:alpine service, public/ mounted read-only
nginx.conf                     # Minimal: no caching of config.js, correct ES module MIME types
README.md                      # Host setup: edit config, bring up, open on tablet
```

**Structure Decision**: A single static project rooted at `public/`, with no backend tier and therefore none of the template's frontend/backend split. The load-bearing boundary is not client/server but **`public/js/domain/` (pure, tested) vs. `public/js/ui/` + `public/js/platform/` (DOM and browser APIs, manually verified)**. Everything the spec's reference scenarios assert lives on the pure side of that line, which is what lets the acceptance criteria run under `node --test` with no browser automation and no dependencies. `public/` is mounted read-only into the nginx container so the served tree and the source tree are the same files — editing `config.js` and reloading the tablet is the host's entire configuration workflow.

## Complexity Tracking

> No Constitution Check violations. No entries.

This design adds no projects, no dependencies, no build tooling, and no architectural patterns beyond plain modules and functions. Every candidate addition (framework, bundler, service worker, NoSleep.js package, localStorage persistence) was explicitly evaluated and rejected in [research.md](./research.md).
