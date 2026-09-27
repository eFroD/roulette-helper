# Quickstart: Wetten auf den Linien — validation guide

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Run instructions, prerequisites and the 001 manual pass are unchanged. See [001 quickstart](../001-roulette-dealer-companion/quickstart.md). This guide adds what the line bets need and the **trial protocol** that decides whether they stay (SC-009).

## Run

```bash
docker compose up -d          # http://localhost:8080  or  http://<host-LAN-IP>:8080 on the tablet
node --test                   # full suite, Node 20+, installs nothing
node --test tests/lines.test.js tests/reference-scenarios.test.js   # only the line + reference cases
```

The switch lives in `public/config.js`: `lineBets: true | false`. Reload after changing it.

---

## A. Automated (must be green before any manual step)

| Check | Proves | Spec |
|---|---|---|
| Catalogue has 157 fields: 60 / 12 / 2 / 22 / 1 / 11 lines with ratios 17 / 11 / 11 / 8 / 8 / 5 | complete and correct set | FR-001, FR-002, FR-011 |
| Every split and corner passes the adjacency rule; no 3/4, no 36/37 | no phantom lines | FR-003 |
| Winning set for **every** n from 0 to 36 equals the brute-force set "fields containing n" | SC-001 over all 157 × 37 | FR-005, FR-006, SC-001 |
| n = 17 → 17 winners; n = 1 → 14; n = 0 → 7, zero outside | spec reference 1–2, US1 AC1–3 | SC-001 |
| Reference scenarios 3–6 and basket (US2 AC5) with the exact figures | payout maths | SC-002 |
| Mixed number / outside / line taps undo in reverse order; clear, change and next drop line stakes | correction paths | FR-016–FR-019 |
| Render with `lineBets: false`: 49 cells, pre-feature grid, all 7 reference scenarios from 001 unchanged | the way back | FR-028, SC-007 |
| Render with `lineBets: true`: no two zones share a grid cell; list shows exactly the winning lines for 17 (11 entries), in list order | no overlap, list content | FR-020a–c, FR-021 |
| Zone and list entry of one field always carry the same state and tap count | two routes, one stake | FR-020a |

## B. Manual: on each device (laptop, then tablet, both landscape)

1. Enter **17**. Four splits, one street, four corners and two sixlines light up at their real positions. The list shows the same 11. Nothing else is tappable.
2. Tap the line 16/17 on the tableau once and the list entry "Split 16/17" once. Both show `2x`, and one result card shows 10 € → 170 € → 180 €, 85 € per chip. Both elements pulsed on each tap.
3. Undo once. Both show `1x`. Long-press the list entry: the split clears. Undo: it returns at `1x`.
4. Enter **0** via "Zahl ändern". The confirmation appears. After confirming, only 0, the three zero splits, the two trios and the basket are active. Every outside bet is locked.
5. Before entering a number, tap a few zones. Nothing happens, and no number is set.
6. With 17 set and any 6 or more fields occupied, results switch to compact rows. The total stays visible without scrolling.
7. Set `lineBets: false` and reload. The board looks and behaves exactly like the pre-feature build: no thin tracks, no list row.

## C. Trial protocol (SC-003, SC-005, SC-006, SC-008 → SC-009)

Run **once per device**. The dealer stands, and one helper calls targets and keeps time. Record the results in the table below and keep it with this spec.

1. **Baseline, before switching on** (SC-006). Use `lineBets: false`. Time 5 rounds, each with 4 occupied number or outside fields, from number entry to reading the total. Take the median.
2. **Same rounds, lines on** (SC-006). Use `lineBets: true` and the same 5 rounds without line stakes. Take the median. Pass if it is at most 1.10 × baseline.
3. **Mixed rounds** (SC-003). Play 5 rounds with 4 occupied fields, at least 2 of them lines. Pass if the median is under 30 s.
4. **Hit rate** (SC-005). The helper calls 50 random winning lines. The dealer taps **zones only**, then repeats with **list only**. Count first-try hits. Target: list ≥ 99 %, zones ≥ 95 % on the laptop. Record the tablet zone rate without a pass mark.
5. **Space** (SC-008). With 17 active fields, check that nothing scrolls except, at most, the results list. Read every figure from about 50 cm away.
6. If zones miss often, widen `--line-track-v` (and `--line-track-h`) for that device and repeat step 4 **once**. Note the value used.

| Device | Baseline s | Lines-on s (≤ 1.10×) | Mixed s (< 30) | Zone hits /50 | List hits /50 | `--line-track-v/h` | Scrolling? |
|---|---|---|---|---|---|---|---|
| Laptop | | | | | | | |
| Tablet | | | | | | | |

**Decision (SC-009)**, one line per device: *keep lines: yes/no · preferred route: zones / list*.

## Definition of done

- Section A is fully green, and the 61 pre-existing tests still pass or have been amended only where [contracts/domain-api.md](./contracts/domain-api.md) says so.
- Section B passes on the laptop and on the tablet.
- The section C table is filled in and the decision line is written.
