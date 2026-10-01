import { existsSync, readFileSync } from "node:fs";

const component = readFileSync("src/components/v1/knowledge.tsx", "utf8");
const css = readFileSync("src/components/v1/v1.css", "utf8");

for (const marker of [
  "v-knowledge-home-tabs",
  "知识发现",
  "知识资产",
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

for (const marker of [
  ".v-knowledge-home-tabs",
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

if (!component.includes('const modes = ["智能检索", "关键词检索", "高级检索", "结构式检索"]')) {
  throw new Error("Existing knowledge search modes must remain available");
}

console.log("Knowledge home structure checks passed");
