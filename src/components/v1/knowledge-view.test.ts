import test from "node:test";
import assert from "node:assert/strict";

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
