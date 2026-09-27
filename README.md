# roulette-helper

A small web app that does the arithmetic for an amateur dealer at a private roulette party (play money, real chips). The dealer enters the winning number **after** the throw; the app highlights exactly the fields that win, locks every losing field so a lost bet cannot be entered at all, and shows stake, win, total and **win per chip** for each occupied field plus the round total. Line bets (split, street, corner, sixline, and the trios and basket at zero) are included: tap them on the line between the numbers, or pick them from a list of only the winning lines.

The board is drawn as the **French felt** on the host's table, upright as the dealer sees it: 0 on top, twelve rows of three below, Manque / Pair / Rouge on the left, Passe / Impair / Noir on the right, P12 / M12 / D12 on both sides (each dozen is one bet, whichever side is tapped), the columns at the bottom. The result list names each outside bet in French with its German meaning, e.g. "Manque (1–18)".

No backend, no database, no accounts, no persistence. Nothing leaves the browser.

## Run it

```bash
docker compose up -d
```

Then open `http://localhost:8080` on the host, or `http://<host-LAN-IP>:8080` on the tablet.

```bash
docker compose down
```

## Configure it

Edit [`public/config.js`](public/config.js) and reload the page. No rebuild, no restart — `public/` is bind-mounted read-only and the file is served with `Cache-Control: no-store`, so a plain reload always picks up the change.

```javascript
window.ROULETTE_CONFIG = {
  baseStakeOutside: 10, // one tap on an outside bet
  baseStakeNumber: 5,   // one tap on an inside bet: a single number or a line
  currencySymbol: "€",
  historyLength: 10,    // 0 hides the history strip
  lineBets: true,       // false = the French felt without line bets
};
```

`lineBets` must be a real `true` or `false`. The string `"false"` is treated as a typo: the app warns and keeps line bets on.

Every key is optional and each is validated independently. An invalid value falls back to its default and the app shows a warning naming the key — a typo can never leave a dealer facing a blank screen mid-party.

## Test it

```bash
node --test
```

Requires Node 20+ and **installs nothing** — the runner is built into Node. All arithmetic and state logic lives in `public/js/domain/`, which is free of any DOM reference, so it runs directly under Node with no browser, bundler, or shims.

```bash
node --test tests/reference-scenarios.test.js   # the spec acceptance cases (specs 001 and 002)
node --test tests/lines.test.js                 # line-bet catalogue, geometry, exhaustive winner check
```

Bare `node --test` auto-discovers the suite. Passing the directory (`node --test tests/`) works on Node 20 but not on Node 22+, which treats the argument as a module to execute.

### The domain purity boundary

Nothing under `public/js/domain/` may reference `document`, `window`, `navigator`, or timers. That single rule is what keeps the whole test strategy dependency-free. To check it:

That rule is enforced by `tests/domain-purity.test.js`, which strips comments before scanning, so it runs as part of the normal suite rather than relying on discipline.

## On the tablet and the laptop

- **Fullscreen**: use the ⛶ button in the app. Browsers require a tap for this, so it cannot happen automatically. The upright board is limited by screen height: on a 1366×768 laptop with line bets on it only fits in fullscreen (rows of 37 px); in a normal browser window the page scrolls a little.
- **Home screen**: on iPad, Share → "Add to Home Screen" gives a chrome-less launch. Chrome's install prompt needs HTTPS and will not appear over plain LAN HTTP — see below.
- **Screen sleep**: the app keeps the screen awake from the first tap onward. Please also raise the tablet's own screen-timeout setting as a backstop.

### Why there is no service worker

The app is served over plain HTTP on a LAN address, which browsers do not treat as a secure context. Service workers and the native Screen Wake Lock API both require one, so neither is available here. Consequences:

- **Offline is still fine.** Once loaded, the app has no network dependency at all — every asset is local and every calculation is client-side. Pull the plug mid-round and nothing changes.
- **Reloading while the LAN is down will not work.** Accepted: a reload already discards the round by design.
- **Screen wake** uses a muted looping video instead of the native API, with the native API used automatically if the app is ever served over HTTPS.

## Layout

```text
public/                 # served verbatim by nginx
├── config.js           # the only file a host edits
├── js/domain/          # pure: wheel, payout, round, config, history — unit-tested
├── js/ui/              # DOM rendering
└── js/platform/        # wake lock, fullscreen
tests/                  # node --test
```

## Rules of the house

Single-zero roulette on a French felt, 37 fields. The felt is French, the rules are not: only the layout follows the French table. Single numbers pay 35:1, splits 17:1, streets and trios (0-1-2, 0-2-3) 11:1, corners and the basket (0-1-2-3) 8:1, sixlines 5:1, red/black/even/odd/halves 1:1, dozens and columns 2:1. Line bets use the single-number base stake. On zero **all** outside bets lose in full (no La Partage, no En Prison), while the six lines touching zero win normally.
