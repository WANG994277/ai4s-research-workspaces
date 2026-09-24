import { readFileSync, existsSync } from "node:fs";

const cssPath = "src/components/v1/v1.css";
const css = readFileSync(cssPath, "utf8");

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing CSS token --${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

for (const name of ["v-brand", "v-ink", "v-muted"]) {
  const color = token(name);
  const ratio = contrast(color, "#ffffff");
  console.log(`${name}: ${color}, contrast ${ratio.toFixed(2)}:1`);
  if (ratio < 4.5) throw new Error(`${name} fails WCAG AA contrast on white`);
}

for (const required of [
  ".v-nav-children",
  ".v-workbench-panel",
  ".v-data-table",
  "prefers-reduced-motion",
  "@media (max-width: 1350px)",
  "@media (min-width: 1600px)",
]) {
  if (!css.includes(required)) throw new Error(`Missing UI rule: ${required}`);
}

for (const asset of [
  "public/v1/ai4s-logo.png",
  "public/v1/research-agent-banner.png",
  "docs/ui-design/workbench/workbench-direction-a.png",
]) {
  if (!existsSync(asset)) throw new Error(`Missing visual asset: ${asset}`);
  console.log(`asset: ${asset}`);
}

console.log("UI design-system checks passed");
