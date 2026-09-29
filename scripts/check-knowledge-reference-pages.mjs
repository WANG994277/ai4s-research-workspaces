import { existsSync, readFileSync } from "node:fs";

const knowledge = readFileSync("src/components/v1/knowledge.tsx", "utf8");
const views = existsSync("src/components/v1/knowledge-reference-views.tsx")
  ? readFileSync("src/components/v1/knowledge-reference-views.tsx", "utf8")
  : "";
const styles = existsSync("src/components/v1/knowledge-reference.css")
  ? readFileSync("src/components/v1/knowledge-reference.css", "utf8")
  : "";
const assetViews = existsSync("src/components/v1/knowledge-asset-views.tsx")
  ? readFileSync("src/components/v1/knowledge-asset-views.tsx", "utf8")
  : "";

for (const marker of [
  "v-knowledge-home-prompts",
  "v-knowledge-category-cards",
  "v-knowledge-home-three-col",
  "v-hot-topics",
]) {
  if (!knowledge.includes(marker)) {
    throw new Error(`Knowledge discovery home is missing: ${marker}`);
  }
}

for (const marker of [
  "KnowledgeLiteratureDetail",
  "KnowledgeGraphDetail",
  "v-literature-detail-layout",
  "v-literature-ai-panel",
  "v-literature-tabs",
  "v-literature-bottom-actions",
  "v-graph-detail-page",
  "v-graph-filter-panel",
  "v-graph-canvas",
  "v-graph-entity-panel",
  "v-literature-ai-chat",
  "v-literature-ai-composer",
  "v-literature-capability-dialog",
]) {
  if (!views.includes(marker)) {
    throw new Error(`Knowledge reference view is missing: ${marker}`);
  }
}

for (const marker of [
  "KnowledgeAssetTabs",
  "KnowledgeLibraryView",
  "KnowledgeGraphCatalog",
  "v-knowledge-asset-tabs",
  "v-knowledge-library-grid",
  "v-knowledge-library-detail",
  "v-knowledge-graph-catalog",
  "v-knowledge-graph-table",
  "新建知识图谱",
]) {
  if (!assetViews.includes(marker)) {
    throw new Error(`Knowledge asset experience is missing: ${marker}`);
  }
}

if (views.includes("v-literature-ai-capabilities")) {
  throw new Error("Literature AI capabilities must live in a dialog, not a persistent side grid");
}

for (const assetName of ["knowledge-graph-oilfield.png"]) {
  if (!styles.includes(assetName)) {
    throw new Error(`Knowledge reference stylesheet is missing: ${assetName}`);
  }
}

if (knowledge.includes("v-knowledge-local-sidebar")) {
  throw new Error("Reference-specific sidebar must not replace current navigation");
}

for (const removedControl of ["图谱设置", "导出图谱", "全屏查看图谱"]) {
  if (views.includes(removedControl)) {
    throw new Error(`Knowledge graph toolbar must not expose: ${removedControl}`);
  }
}

for (const asset of [
  "public/v1/knowledge-graph-oilfield.png",
]) {
  if (!existsSync(asset)) throw new Error(`Missing knowledge asset: ${asset}`);
}

console.log("Knowledge reference page checks passed");
