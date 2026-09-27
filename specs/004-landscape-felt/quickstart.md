# Quickstart: Französisches Tableau quer — validation guide

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Run instructions are unchanged ([003 quickstart](../003-french-layout/quickstart.md)). Switch the orientation in `public/config.js` (`orientation: "horizontal" | "vertical"`) and reload.

```bash
node --test          # baseline before this feature: 109/109
```

Note: the container serves `./public` live, so an edit to `config.js` reaches every device on the next reload.

## A. Automated (must be green before any manual step)

| Check | Proves | Spec |
|---|---|---|
| `resolveConfig`: absent → `horizontal` without a warning; `vertical` / `" Horizontal "` are normalised; `"quer"`, `true`, `""` → `horizontal` plus one warning naming `orientation`; siblings are unaffected | the setting | FR-001–FR-004, SC-005 |
| `rotate` reproduces the reference tables in [data-model § 3b](./data-model.md) | CCW rotation, 0 on the left | FR-005–FR-007 |
| Both orientations: 49/52 and 157/268 ids/elements; no shared grid cell | nothing lost or doubled | FR-009 |
| Both orientations: every line zone has exactly its numbers as neighbours; streets and sixlines on the street edge | line geometry | FR-008, SC-004 |
| Vertical placements are identical to the 003 literals (existing tests, now with `orientation: "vertical"`) | vertical unchanged | FR-011, SC-006 |
| Winners snapshot 0–36 and all reference scenarios unchanged; `round.js`, `payout.js`, `wheel.js`, `render.js` unchanged vs. `003-french-layout` | rules untouched | FR-010, SC-003 |

## B. On screen (headless or real browser)

| Viewport | Lines | Orientation | Pass when |
|---|---|---|---|
| 1366×698 (normal window) | on | horizontal | no page scroll; number cells ≥ 55 px tall (≥ +50 % vs. 37 px); list shows all 11 lines for 17 |
| 1366×698 | off | horizontal | no page scroll; cells ≥ 66 px tall (≥ +50 % vs. 44 px) |
| 1366×768 fullscreen | on / off | vertical | same sizes as the 003 measurements (37 / 44 px) |
| 1920×1080 | on | horizontal | no page scroll |
| 1180×820, touch | on / off | horizontal | cells ≥ 36 px on the shorter edge; note if it scrolls |
| any | on | horizontal | after 17: top bar Passe…D12, bottom bar Manque…D12, 0 on the left, 1 at bottom-left, columns on the right; both M12 lit |
| any | — | `orientation: "quer"` | horizontal board plus a yellow warning naming `orientation` |

### Measured 2026-09-27 (headless Chromium, number cell n17 width × height)

| Viewport | Lines | Orientation | Cell | Page scroll | Note |
|---|---|---|---|---|---|
| 1366×698 (window) | off | horizontal | 63 × 147 | no | +234 % height vs. 44 px |
| 1366×768 | off | horizontal | 63 × 164 | no | |
| 1366×698 (window) | on | horizontal | 57 × 100 | no | +170 % vs. 37 px; list shows all 11 for 17 in 2 rows |
| 1366×768 | on | horizontal | 57 × 120 | no | |
| 1920×1080 | on | horizontal | 98 × 198 | no | |
| 1180×820, touch | on | horizontal | 41 × 127 | no | street tracks 14 px, inner tracks 32 px |
| 1366×768 | on / off | vertical | 153 × 37 / 201 × 44 | no | identical to 003 (SC-006) |
| 1366×698 | on | `"quer"` | 57 × 78 | no | horizontal board + warning naming `orientation`; the warning bar takes height |
| 1366×698 | on | key absent | 57 × 100 | no | horizontal, no warning |

The column-bet track was widened to `minmax(5rem, 1fr)` after the first screenshot showed "Kolonne" clipped at 56 px.

## C. At the table

Repeat 003 quickstart § B (felt check) once in horizontal. Turn the felt a quarter turn in your head: the 0 is on the left, Manque/Pair/Rouge at the bottom. A side swap found in 003 T033 applies to both orientations.
