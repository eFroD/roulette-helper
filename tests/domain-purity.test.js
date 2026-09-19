// Structural guard, not a behaviour test.
//
// The entire test strategy rests on public/js/domain/ being free of browser
// APIs: that is what lets these same files run under `node --test` with no
// browser, no bundler and no installed dependencies. Retrofitting that purity
// once the UI has grown into the logic is the one refactor that would really
// hurt, so it is enforced here rather than left to discipline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "js", "domain");
const FORBIDDEN = [
  "document", "window", "navigator", "localStorage", "sessionStorage",
  "fetch", "setTimeout", "setInterval", "requestAnimationFrame", "alert", "confirm",
];

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const files = readdirSync(DOMAIN).filter((f) => f.endsWith(".js"));

test("the domain folder is not empty (guard would pass vacuously)", () => {
  assert.ok(files.length >= 5, `expected the domain modules, found ${files.length}`);
});

for (const file of files) {
  test(`domain/${file} references no browser API`, () => {
    const code = stripComments(readFileSync(join(DOMAIN, file), "utf8"));
    for (const name of FORBIDDEN) {
      const hit = new RegExp(`\\b${name}\\b`).exec(code);
      assert.equal(hit, null, `domain/${file} must not reference "${name}"`);
    }
  });
}

test("domain modules import only from within domain/", () => {
  for (const file of files) {
    const code = readFileSync(join(DOMAIN, file), "utf8");
    for (const [, spec] of code.matchAll(/from\s+"([^"]+)"/g)) {
      assert.ok(
        spec.startsWith("./") && !spec.includes(".."),
        `domain/${file} imports "${spec}" from outside domain/`,
      );
    }
  }
});
