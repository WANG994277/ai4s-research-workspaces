import { existsSync, readFileSync } from "node:fs";

const component = readFileSync("src/components/v1/knowledge.tsx", "utf8");

for (const marker of [
  'import "./knowledge-results.css"',
  "v-knowledge-results-page",
  "v-knowledge-results-tabs",
  "v-knowledge-results-layout",
  "v-ai-summary",
  "v-ai-summary-copy",
  "v-knowledge-result-list",
  "v-search-overview",
  "v-related-topics",
]) {
  if (!component.includes(marker)) {
    throw new Error(`Knowledge results page is missing: ${marker}`);
  }
}

for (const obsolete of ["检索摘要 · 本地示例", "328 条相关结果"]) {
  if (component.includes(obsolete)) {
    throw new Error(`Knowledge results page still contains obsolete copy: ${obsolete}`);
  }
}

if (!existsSync("src/components/v1/knowledge-results.css")) {
  throw new Error("Knowledge results stylesheet is missing");
}

const css = readFileSync("src/components/v1/knowledge-results.css", "utf8");
for (const marker of [
  ".v-knowledge-results-page",
  ".v-knowledge-results-layout",
  ".v-search-overview",
  "@media (max-width: 1350px)",
  "prefers-reduced-motion",
]) {
  if (!css.includes(marker)) {
    throw new Error(`Knowledge results CSS is missing: ${marker}`);
  }
}

console.log("Knowledge results page checks passed");
