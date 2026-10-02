import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test("knowledge center view model covers discovery, libraries and graph catalog", async () => {
  const view = await import("./knowledge-view").catch(() => ({
    knowledgeView: undefined,
  }));
  assert.ok(view.knowledgeView);
  assert.deepEqual(view.knowledgeView!.primaryTabs, ["知识发现", "知识资产"]);
  assert.equal(view.knowledgeView!.recentSearches.length, 3);
  assert.deepEqual(
    view.knowledgeView!.recommendations.map((item) => item.type),
    ["文献", "专利"],
  );
  assert.equal(view.knowledgeView!.libraries.length, 4);
  assert.deepEqual(
    [...new Set(view.knowledgeView!.libraries.map((item) => item.scope))],
    ["公共知识库", "项目知识库", "课题知识库", "我的知识库"],
  );
  assert.equal(view.knowledgeView!.graphs.length, 4);
  assert.ok(view.knowledgeView!.graphs.every((item) => item.entities > 0 && item.relations > 0));
});

test("knowledge result controls do not show native blue focus rings", () => {
  const cssPath = fileURLToPath(new URL("./knowledge-results.css", import.meta.url));
  const css = readFileSync(cssPath, "utf8");

  assert.match(css, /v-knowledge-results-filters[\s\S]*select:focus/);
  assert.match(css, /v-knowledge-results-filters[\s\S]*input\[type="checkbox"\]:focus/);
  assert.match(css, /v-knowledge-results-search[\s\S]*focus-within/);
  assert.match(css, /outline:\s*none/);
  assert.match(css, /box-shadow:\s*none/);
  assert.match(css, /v-knowledge-results-filters \.v-select[\s\S]*border:\s*0/);
  assert.match(css, /v-knowledge-results-filters \.v-select select[\s\S]*border:\s*1px/);
});

test("knowledge result action adds an item to the knowledge base", () => {
  const sourcePath = fileURLToPath(new URL("./knowledge.tsx", import.meta.url));
  const source = readFileSync(sourcePath, "utf8");

  assert.match(source, /function addToKnowledgeBase/);
  assert.match(source, /加入知识库/);
  assert.match(source, /已加入知识库/);
});
