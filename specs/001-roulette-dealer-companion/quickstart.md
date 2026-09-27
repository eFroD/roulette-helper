# Quickstart & Validation: Roulette Dealer Companion

**Date**: 2026-09-19 | **Plan**: [plan.md](./plan.md)

How to run the app, run the tests, and prove the feature works end to end. This is a validation guide — implementation belongs in `tasks.md`.

## Prerequisites

| For | Needs |
|---|---|
| Running the app | Docker + Docker Compose. Nothing else. |
| Running the tests | Node.js 20 or newer. **No `npm install`** — the runner is built in. |
| Manual validation | A tablet (landscape) or any browser on the same LAN. |

---

## Run the app

```bash
docker compose up -d
```

Open `http://localhost:8080` on the host, or `http://<host-LAN-IP>:8080` on the tablet.

To change base stakes: edit `public/config.js`, reload the page. No rebuild, no restart — `public/` is bind-mounted read-only and `config.js` is served `no-store`.

```bash
docker compose down     # stop
```

---

## Run the automated tests

```bash
node --test
```

Expect all suites to pass with zero dependencies installed. These cover everything in `public/js/domain/`: wheel geometry, payout arithmetic, and the round state machine — including all seven reference scenarios from the spec.

```bash
node --test tests/reference-scenarios.test.js   # just the seven spec acceptance cases
```

---

## Validation scenarios

### A. Automated — the seven reference scenarios

Each case in [spec.md § Reference Scenarios](./spec.md) has a matching named test in `tests/reference-scenarios.test.js`. Pinned expected values live in [contracts/domain-api.md](./contracts/domain-api.md).

| # | Assertion | Verifies |
|---|---|---|
| 1 | `winningFieldIds(17)` = exactly `n17`, `black`, `odd`, `low`, `dozen2`, `col2` — 6 ids | FR-004 |
| 2 | `winningFieldIds(0)` = exactly `["n0"]`; no outside bet wins | FR-005 |
| 3 | Number, 2 taps @ 5 → stake 10, win 350, total 360, perChip 175 | FR-011, FR-013 |
| 4 | Red, 4 taps @ 10 → stake 40, win 40, total 80, perChip 10 | FR-011, FR-013 |
| 5 | Dozen, 3 taps @ 10 → stake 30, win 60, total 90, perChip 20 | FR-011, FR-013 |
| 6 | 3 taps on red, then `undo()` → 2 taps; stake 20, win 20, total 40 | FR-017 |
| 7 | `needsConfirmation` true with stakes; after `changeWinningNumber` stakes are empty and winners match the new number | FR-019, FR-020 |

Beyond the seven, the suites also assert the structural invariants: exactly 6 winners for **all** 37 numbers, 18 red / 18 black / 1 green, no-op behaviour on every guard violation, and non-mutation of the input round on every transition.

`tests/render.integration.test.js` additionally drives `tableau.js` and `render.js` against a minimal DOM stand-in, covering the mechanical half of B2, B4, B5 and B6: which field lands in which state, that all 43 losers on 17 are genuinely `disabled`, and that the panel figures and round total are correct. It does **not** cover layout, contrast, touch-target size or gestures — those stay in list B below.

### B. Manual — UI and device behaviour

Not covered by `node --test` by design (research R-002). Walk these on the actual tablet before the party.

| # | Steps | Expected | Verifies |
|---|---|---|---|
| B1 | Load the app, before entering a number tap several fields | Nothing is enterable; no figures appear | FR-007 |
| B2 | Tap 17 | Exactly 6 fields highlighted; all others visibly greyed and inert | FR-004, FR-006, FR-029 |
| B3 | Tap a greyed field repeatedly | No change, no error, no flicker | Edge case |
| B4 | Tap 0 on a fresh round | Only field 0 active; every outside bet locked | FR-005 |
| B5 | Enter 17, tap Black 4× | Field shows tap count, stake, win, total and the per-chip line | FR-010, FR-012, FR-013 |
| B6 | Occupy several fields | Round total equals the sum of the field totals | FR-014 |
| B7 | Long-press (or ×) one occupied field | Only that field clears; others unchanged | FR-018 |
| B8 | Undo with an empty round | Nothing happens; no error state | Edge case |
| B9 | Change the winning number with stakes present | Confirmation appears; cancel keeps everything, confirm clears stakes and re-derives winners | FR-019, FR-020 |
| B10 | Trigger "Nächste Runde" | Requires confirmation or a deliberate reach; then a clean neutral board | FR-021, FR-022 |
| B11 | Play several rounds | History strip shows the last numbers in order, in field colours, capped at `historyLength` | FR-031 |
| B12 | Set `baseStakeOutside: 20` in `config.js`, reload | One tap on an outside bet reads 20 | FR-023, contract |
| B13 | Put a deliberate error in `config.js` (e.g. `baseStakeNumber: -1`), reload | App still starts on defaults and warns, naming the key | Contract guarantee 2 |
| B14 | Stand ~50 cm back at party lighting | All figures legible; round total clearly dominant | FR-028, SC-007 |
| B15 | Tap once, then leave the tablet idle 10+ minutes | Screen stays on; round state intact on return | FR-033 |
| B16 | Tap the fullscreen button | Enters fullscreen; app remains fully usable | FR-034 |

### C. Offline resilience

| # | Steps | Expected | Verifies |
|---|---|---|---|
| C1 | Load the app, then disconnect the host from the network (or disable its WLAN) | Every function continues to work — number entry, stakes, undo, totals, next round | FR-025, SC-006 |
| C2 | With DevTools open, inspect the Network tab across a full round | Zero requests to any external host; no CDN, no fonts, no analytics | FR-025 |
| C3 | Reload the page while the LAN is down | **App does not load.** Known and accepted — no service worker, since LAN HTTP is not a secure context | research R-004 |

> C3 is the documented limit of offline support, not a bug. A reload already discards the round by design (FR-030), so the practical loss is confined to reloading during an outage.

---

## Definition of done

- [ ] `node --test` passes with zero installed dependencies
- [ ] All seven reference scenarios pass as named tests
- [ ] B1–B16 walked on the actual tablet in landscape
- [ ] C1 and C2 confirmed; C3 understood as accepted
- [ ] `docker compose up -d` serves a working app on a clean machine with no build step
- [ ] Editing `public/config.js` + reload changes behaviour with no rebuild
- [ ] No `document`/`window`/`navigator` reference anywhere in `public/js/domain/` (enforced by `tests/domain-purity.test.js`, which strips comments before scanning)
