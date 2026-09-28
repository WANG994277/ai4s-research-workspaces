import { existsSync, readFileSync } from "node:fs";

const component = readFileSync("src/components/v1/knowledge.tsx", "utf8");
const css = readFileSync("src/components/v1/knowledge-home.css", "utf8");

for (const marker of [
  "v-knowledge-home-tabs",
  "v-knowledge-home-hero",
  "发现和理解科研知识",
  "v-knowledge-mode-switch",
  "v-knowledge-quick-types",
  "v-knowledge-home-grid",
  "最近搜索",
  "推荐知识",
]) {
  if (!component.includes(marker)) {
    throw new Error(`Knowledge home is missing component marker: ${marker}`);
  }
}

for (const obsolete of [
  'import { knowledgeView } from "./knowledge-view"',
  "v-knowledge-results-layout",
  "v-knowledge-home-section",
]) {
  if (component.includes(obsolete)) {
    throw new Error(`Legacy 3000 knowledge implementation remains: ${obsolete}`);
  }
}

for (const marker of [
  ".v-knowledge-home-hero",
  ".v-knowledge-mode-switch",
  ".v-knowledge-quick-types",
  ".v-knowledge-home-grid",
  "knowledge-home-hero.png",
]) {
  if (!css.includes(marker)) {
    throw new Error(`Knowledge home is missing CSS marker: ${marker}`);
  }
}

if (!existsSync("public/v1/knowledge-home-hero.png")) {
  throw new Error("Knowledge home hero asset is missing");
}

console.log("Merged knowledge home checks passed");
