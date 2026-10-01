import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
for (const path of [
  "src/app/(app)/datasets/page.tsx",
  "src/components/v1/datasets.tsx",
  "src/components/v1/dataset-marketplace.ts",
  "src/components/v1/dataset-marketplace.module.css",
  "src/components/v1/knowledge-reference-views.tsx",
  "src/components/v1/knowledge-asset-views.tsx",
  "src/components/v1/research-space-list.tsx",
]) assert.ok(existsSync(path), `missing online-synced file: ${path}`);

const knowledge = read("src/components/v1/knowledge.tsx");
for (const marker of ["KnowledgeAssetTabs", "KnowledgeGraphCatalog", "KnowledgeLibraryView", "knowledge-home.css", "knowledge-results.css"])
  assert.match(knowledge, new RegExp(marker));

const datasets = read("src/components/v1/datasets.tsx");
for (const marker of ["全部数据", "我可使用的", "最近使用", "我的收藏", "我发布的"])
  assert.match(datasets, new RegExp(marker));

const assets = read("src/components/v1/research-space-list.tsx");
for (const marker of ["项目资产", "我的资产", "全部状态", "全部归属", "rs-assets-table"])
  assert.match(assets, new RegExp(marker));

const researchSpace = read("src/components/v1/research-space.tsx");
assert.match(researchSpace, /ResearchAssetList/);
console.log("online module sync markers: ok");
