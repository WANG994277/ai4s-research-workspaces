import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Tailwind scans application source only", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /@import ['"]tailwindcss['"] source\(none\);/);
  assert.match(css, /@source ['"]\.\.['"];/);
});
