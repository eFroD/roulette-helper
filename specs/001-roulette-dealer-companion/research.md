# Phase 0 Research: Roulette Dealer Companion

**Date**: 2026-09-19 | **Plan**: [plan.md](./plan.md)

The spec carried no `[NEEDS CLARIFICATION]` markers, so this phase resolved the *technical* unknowns implied by the host's stated constraints (static delivery, no backend, no external assets, offline tolerance, tablet kiosk use) rather than open product questions.

Two findings changed the design materially: **R-004** (no service worker) and **R-005** (native Wake Lock unavailable). Both stem from the same root cause — the app is served over plain HTTP on a LAN address and is therefore not a secure context.

---

## R-001: Application architecture — framework vs. plain modules

**Decision**: Native ES modules, no framework, no build step. Three DOM-free domain modules plus an imperative render layer that redraws from state after each action.

**Rationale**: The entire application state is one small object — a winning number, a map of at most 49 tap counts, and an undo log. Rendering is a pure function of that state over a fixed set of 49 DOM nodes created once at startup. Full redraw on every action costs well under a frame at this size, which removes any need for reactivity, diffing, or a component model. Native modules load directly from nginx with no transpilation, so the source tree and the served tree are identical — the host can open `config.js` in a text editor and see what actually runs.

**Alternatives considered**:
- **Preact / Alpine / lit, vendored locally** — rejected. Adds a vendored artifact that no longer matches readable source, plus a framework's update semantics, to save perhaps 40 lines of DOM code. Nothing in the spec needs it.
- **A bundler (Vite, esbuild)** — rejected. Introduces a build step between the host's edit of `config.js` and what the tablet serves, which is precisely the workflow the "leicht auffindbare Config" requirement (FR-023) protects.
- **Single-file `index.html` with inline script** — rejected. Keeps zero-build simplicity but makes the domain logic unimportable, which kills the `node --test` strategy in R-002.

---

## R-002: Testing without a dependency budget

**Decision**: Node's built-in test runner (`node --test`, `node:test` + `node:assert`) executed directly against `public/js/domain/*.js`. No `package.json` dependencies, no `npm install`.

**Rationale**: Node has shipped a stable built-in test runner and native ES module support since Node 20, so the seven reference scenarios in the spec become executable assertions at a cost of zero installed packages. This is only possible because the domain modules never touch `document` or `window` — the same files import cleanly into Node and into the browser. That constraint is worth enforcing for its own sake: it keeps the arithmetic that must be provably correct isolated from the layout that only has to look right.

**Alternatives considered**:
- **Vitest / Jest** — rejected. Either brings a node_modules tree and a config file to a project whose defining constraint is having no dependencies.
- **Playwright end-to-end tests** — rejected for this scope. It would cover the UI layer the unit tests deliberately exclude, but installing browser binaries dwarfs the entire application. The UI-level checks are a documented manual pass in [quickstart.md](./quickstart.md) instead, which suits a one-evening party tool.
- **A hand-rolled browser test page** — rejected. Runs the real environment but cannot be executed headlessly in CI or from a terminal, and needs its own assertion harness.

---

## R-003: Configuration delivery

**Decision**: `public/config.js` assigns a plain object to `window.ROULETTE_CONFIG`, loaded by a classic `<script>` tag *before* the module entry point. The app deep-merges it over built-in defaults and validates it, falling back to defaults (with a visible warning) on any invalid value.

**Rationale**: A `.js` file loads from `file://` and from nginx with no fetch, no MIME configuration, and no async timing to reason about — the config is simply present before `main.js` runs. A `config.json` would need a `fetch()` and an await before first render, and would fail silently under stricter local-file testing. The file sits at the document root with three commented lines, satisfying "leicht auffindbar" literally.

**Alternatives considered**:
- **`config.json` + `fetch()`** — rejected. Adds an async gate before first paint and a failure mode (404 / wrong MIME type) that shows a blank table.
- **Query-string or `localStorage` config** — rejected. Invisible to the host, and `localStorage` conflicts with FR-030's no-persistence rule.
- **Hardcoded constants in `main.js`** — rejected. Buries the one thing the host must change inside application code.

**Validation rule**: base stakes must be finite numbers > 0; currency symbol must be a non-empty string; history length must be an integer ≥ 0. See [contracts/config-contract.md](./contracts/config-contract.md).

---

## R-004: Offline capability — service worker or not

**Decision**: **No service worker.** Offline resilience comes from the app having no network dependency after load: all assets are local, and every calculation is client-side.

**Rationale**: Service worker registration requires a secure context. MDN's own guidance gates registration behind an explicit check:

```javascript
if (window.isSecureContext) {
  navigator.serviceWorker.register("/offline-worker.js")…
}
```

The deployment target is nginx on the host's LAN, reached as `http://192.168.x.x` — HTTP on a private IP is **not** a secure context (only `localhost` / `127.0.0.1` are exempt). A service worker written for this app would therefore never register on the tablet. Obtaining a secure context would mean provisioning TLS for a LAN address, which means either a real domain and certificate or a self-signed certificate that greets every guest with a browser warning — disproportionate for a party tool.

What this costs is narrow and acceptable: once loaded, the app survives any WLAN outage indefinitely (satisfying FR-025 and SC-006 in full). The only uncovered case is *reloading the page while the LAN is down*, which is already adjacent to the spec's accepted behaviour that a reload discards the round anyway.

**Alternatives considered**:
- **Self-signed TLS to unlock secure-context APIs** — rejected. Certificate warnings on every guest device, for two progressive enhancements.
- **Ship a service worker anyway "in case"** — rejected. Dead code on the actual target, plus stale-cache debugging during the party.
- **AppCache** — long removed from browsers.

**Consequence**: `nginx.conf` must send `Cache-Control: no-store` for `config.js` and `index.html` so an edited configuration takes effect on a plain reload without any cache layer to fight.

---

## R-005: Keeping the tablet awake (FR-033)

**Decision**: Two-tier strategy, implemented in ~30 lines in `public/js/platform/nosleep.js`, activated on the first user tap:
1. **If `navigator.wakeLock` exists** — request a `'screen'` sentinel and re-acquire it on `visibilitychange`.
2. **Otherwise** (the expected case on plain HTTP) — play a muted, looping, inline, near-empty video embedded as a data URI, which keeps mobile browsers from sleeping.

**Rationale**: The native Screen Wake Lock API is a secure-context API, so on `http://192.168.x.x` `navigator.wakeLock` is simply `undefined` — the same root cause as R-004. The muted-looping-video trick is the long-established fallback for exactly this situation and carries no secure-context requirement. NoSleep.js, the reference implementation of this pattern, ships precisely this two-implementation split (`NoSleepNative` vs. `NoSleepVideo`, selected automatically).

Two behaviours confirmed from the documentation and designed for:
- **A user gesture is required.** Both the native request and video playback must be initiated synchronously inside a user-initiated handler. The lock is therefore acquired on the dealer's first tap, not at page load.
- **The lock auto-releases when the document is hidden.** Requesting on a hidden document throws `NotAllowedError`, so the implementation re-acquires on `visibilitychange` when the page becomes visible and never requests while hidden.

Because FR-033 is a SOLLTE, failure degrades silently — the app logs and carries on rather than blocking. As a backstop the host should also raise the tablet's own screen timeout, which `README.md` will say.

**Alternatives considered**:
- **The NoSleep.js npm package, vendored** — rejected. It is a TypeScript package requiring a build; vendoring its output breaks the "source equals served" property. The ~30-line pattern it implements is reproduced directly, with the package credited as the reference.
- **Native Wake Lock only** — rejected. Silently does nothing on the actual deployment target.
- **A periodic no-op timer** — rejected. Does not affect screen sleep on any current mobile OS.

---

## R-006: Fullscreen and add-to-homescreen (FR-034)

**Decision**: An explicit fullscreen toggle button using the Fullscreen API, plus `manifest.webmanifest` and Apple-specific meta tags, plus instructions in `README.md`.

**Rationale**: FR-034 is satisfied by fullscreen **or** instructions; this delivers both cheaply. Unlike Wake Lock and service workers, the Fullscreen API is not secure-context-gated, so the button works on the real deployment. It does require a user gesture, hence an explicit button rather than an automatic call.

Chrome's installable-PWA prompt does require HTTPS plus a service worker and so will not appear (R-004), but iOS Safari's manual "Add to Home Screen" works over plain HTTP and honours `apple-mobile-web-app-capable` for a chrome-less launch. The manifest is cheap and correct to ship regardless; the README sets expectations about which devices show an install prompt.

**Alternatives considered**:
- **Skip the manifest entirely** — rejected. It is a few lines and materially improves the iPad case, the most likely tablet.
- **Rely on automatic fullscreen at load** — rejected. Browsers require a gesture; it would fail every time.

---

## R-007: Rounding and money representation

**Decision**: Integer arithmetic throughout. Base stakes are validated as positive numbers; all payouts are computed as `taps × unit × ratio`, multiplication only, with no division in the money path. Formatting appends the configured symbol with no locale machinery.

**Rationale**: The spec's Assumptions already fix chips to whole multiples of a base stake, and all three odds (35, 1, 2) are integers. So every displayed figure is an exact integer product and floating-point error cannot arise. Critically, the **per-chip** figure is computed as `unit × ratio` — a direct product — and never as `win ÷ taps`, which would reintroduce division and a rounding question for no benefit. This is the single most important arithmetic decision in the app and is asserted directly in the reference-scenario tests.

**Alternatives considered**:
- **`Intl.NumberFormat`** — rejected. Pulls locale behaviour (thousands separators, currency placement) into figures that must be scanned at a glance from 50 cm, and the host's symbol is already explicit in config.
- **Decimal/cents integer representation** — unnecessary given whole-number base stakes; if a host ever configures a fractional stake, config validation accepts it and the products stay exact for one decimal place.

---

## R-008: Deployment shape

**Decision**: One `nginx:alpine` service in `docker-compose.yml`, with `./public` bind-mounted read-only at `/usr/share/nginx/html`, plus a small `nginx.conf` for MIME types and cache headers.

**Rationale**: A bind mount rather than a `COPY`-based image means no rebuild after editing `config.js` — the host edits the file and reloads the tablet. Read-only mounting makes it structurally impossible for the container to alter the source tree. The custom `nginx.conf` covers two real requirements: serving `.js` as `text/javascript` so ES module imports are not blocked, and `no-store` on `index.html` and `config.js` so configuration edits take effect immediately (R-004).

**Alternatives considered**:
- **`COPY` into a custom image** — rejected. Requires a rebuild for every config change.
- **`python -m http.server` or similar** — rejected. The spec explicitly asks for a minimal Compose deployment, and ad-hoc servers get MIME types for ES modules wrong.
- **Default nginx config** — rejected. Aggressive default caching of `config.js` would make host edits appear not to work.

---

## Summary of decisions

| ID | Decision | Primary driver |
|---|---|---|
| R-001 | Plain ES modules, no framework, no build | 49 fields; redraw is trivially cheap |
| R-002 | `node --test` on DOM-free domain modules | Zero dependencies; reference scenarios executable |
| R-003 | `config.js` setting `window.ROULETTE_CONFIG` | Synchronous, editable, no fetch |
| R-004 | **No service worker** | LAN HTTP is not a secure context |
| R-005 | Video-fallback no-sleep, native as upgrade | Same secure-context limit; gesture + visibility rules |
| R-006 | Fullscreen button + manifest + README | Fullscreen is not secure-context-gated |
| R-007 | Integer products only; per-chip = `unit × ratio` | Exactness; no division in the money path |
| R-008 | nginx:alpine + read-only bind mount | Edit config, reload, no rebuild |

**All Technical Context unknowns are resolved. No `NEEDS CLARIFICATION` remain.**
