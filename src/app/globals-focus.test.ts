import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const v1Css = readFileSync(
  new URL("../components/v1/v1.css", import.meta.url),
  "utf8",
);

test("global focus fallback does not override form-control focus styles", () => {
  const focusRule = css.match(/([^{}]+)\{\s*&:focus-visible\s*\{/);

  assert.ok(focusRule, "expected a global focus-visible fallback rule");
  const selector = focusRule[1].replace(/\s+/g, " ").trim();

  assert.equal(selector, "button, a");
  assert.doesNotMatch(selector, /\b(?:input|select|textarea)\b/);
});

test("v1 shell focus fallback targets buttons and links instead of every descendant", () => {
  assert.doesNotMatch(v1Css, /\.v-(?:app|modal)\s+:focus-visible/);
  assert.match(v1Css, /\.v-app\s+:is\(button,\s*a\):focus-visible/);
  assert.match(v1Css, /\.v-modal\s+:is\(button,\s*a\):focus-visible/);
});
