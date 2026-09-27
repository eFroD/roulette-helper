# Quickstart: Französisches Tableau — validation guide

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Run instructions are unchanged from [001](../001-roulette-dealer-companion/quickstart.md) and [002](../002-line-bets/quickstart.md). This guide adds what the French layout needs: the automated checks, the **felt check** against the host's table, and the height measurements.

## Run

```bash
docker compose up -d        # http://localhost:8080  or  http://<host-LAN-IP>:8080
node --test                 # full suite, Node 20+; baseline before this feature: 100/100
```

Toggle `lineBets` in `public/config.js` and reload to check both modes.

---

## A. Automated (must be green before any manual step)

| Check | Proves | Spec |
|---|---|---|
| `winningFieldIds(n)` for all n = 0..36 equals the snapshot taken before the change | rules and winners untouched | FR-011, FR-015, SC-002 |
| All 001 and 002 reference scenarios pass unchanged; on 0 every outside bet is a loser with a result of 0 (no half stake back) | no La Partage / En Prison | FR-011, FR-015 |
| The 9 outside fields have the `label` / `feltLabel` pairs of [data-model § 2](./data-model.md); ids unchanged | labels | FR-006, FR-007 |
| lines off: 49 ids / 52 elements; lines on: 157 ids / 268 elements | dozens twice, nothing else doubled | FR-003, FR-004 |
| No two tableau elements share a grid cell (spans expanded), in both modes | no overlap | FR-009 |
| Placements for 0, 1, 3, 34, 36, all side items and all columns match [data-model § 4](./data-model.md) | vertical order, sides | FR-001, FR-002, FR-005 |
| Every split / corner zone touches exactly its numbers; streets and sixlines sit in the edge column on the right rows; the 6 zero-line zones sit on row 2 | line geometry | FR-009, SC-003 |
| After 5: both `dozen1` elements are winners; one tap on each → both show `2x`, one result card "P12 (1. Dutzend)" | one bet, two positions | FR-004, US2 AC1–2 |
| After 0: both positions of all three dozens and all columns are disabled | zero rule on both sides | US2 AC3 |
| Long press on the right `dozen1` clears the id; both positions are empty | clear via either position | US2 AC4 |

## B. Felt check (manual, at the host's table; decides SC-001 / SC-003)

| Step | Do | Pass when |
|---|---|---|
| M1 | Put the app next to the felt, 0 at the far end on both | For each of the 52 positions: same relative place and same text (numbers, Manque/Pair/Rouge, Passe/Impair/Noir, P12/M12/D12 both sides, columns under their column). Record any difference; if Manque etc. sit on the other side of the host's felt, swap the side lists (one place in `tableau.js`). |
| M2 | Lines on: place a chip on the felt street 16-17-18, sixline 13–18, split 0/2, trio 0-2-3, basket | The app zone for each is at the same spot. If streets are on the other edge on the felt, mirror the E column. |
| M3 | Colours | Numbers keep red/black/green; Rouge and Noir show their diamonds; the words stay readable. |

## C. Height and size (manual, decides FR-014 / SC-006)

Measure the number-cell height and width in DevTools (Elements → computed size) with ⛶ fullscreen.

| Viewport | Lines | Pass when |
|---|---|---|
| 1366×768 | off | no page scroll; cells ≥ 36 px tall (expected ≈ 44) |
| 1366×768 | on | no page scroll; cells ≥ 36 px tall (expected ≈ 37); list beside the board shows up to 11 entries for 17 without scrolling |
| 1920×1080 | on | no page scroll; cells ≥ 56 px tall |
| 1180×820, touch | off | no page scroll; cells ≥ 36 px tall (expected ≈ 48) |
| 1180×820, touch | on | cells ≥ 36 px tall; if it scrolls, note it (spec SC-006 only requires lines-off on the tablet) |
| M5: any portrait window | either | the panel stacks below; nothing overlaps |

### Measured 2026-09-27 (headless Chromium, number cell n17 width × height)

| Viewport | Lines | Cell | Page scroll | Note |
|---|---|---|---|---|
| 1366×768 | off | 201 × 44 | no | |
| 1366×768 | on | 153 × 37 | no | list shows all 11 lines for 17; the tableau fits exactly after cutting the stage's vertical padding with lines on |
| 1366×698 (browser window) | off | 201 × 39 | no | |
| 1366×698 (browser window) | on | 153 × 36 | **yes, 35 px** | expected: use ⛶ |
| 1920×1080 | on | 274 × 58 | no | |
| 1180×820, touch | off | 160 × 48 | no | |
| 1180×820, touch | on | 107 × 38 | no | zones are 32 px wide on the vertical lines |
| 1024×768, touch | off | 126 × 44 | no | |
| 1024×768, touch | on | 55 × 36 | no | the tableau overflows its box by 6 px; SC-006 does not require this case |

Also note the non-fullscreen result at 1366×768 with lines (expected ≈ 31 px, below the limit). This confirms the README advice to use ⛶.

## D. Speed comparison (SC-004 / SC-005)

1. **Before shipping**, on the current build: 2 people × 20 called numbers/outside bets; time from call to correct tap.
2. Same on the French build.
3. Pass: mean time lower on the French build; in a 50-tap run at the real table at most 1 wrong-place tap.
