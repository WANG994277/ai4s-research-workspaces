import test from "node:test";
import assert from "node:assert/strict";
import { matchesToolView } from "./catalog-views";
import { createSeed } from "./seed";

test("toolbox second-level views are mutually exclusive", () => {
  assert.equal(matchesToolView("科研工具", "数据处理"), true);
  assert.equal(matchesToolView("科研工具", "科研软件"), false);
  assert.equal(matchesToolView("科研工具", "连接器"), false);
  assert.equal(matchesToolView("科研软件", "科研软件"), true);
  assert.equal(matchesToolView("MCP", "连接器"), true);
});

test("reused asset catalogs provide rich skills, models, tools, software and MCP data", () => {
  const state = createSeed();
  assert.ok(state.assets.filter((item) => item.type === "Skill").length >= 10);
  assert.ok(state.assets.filter((item) => item.type === "模型").length >= 9);
  assert.ok(state.tools.filter((item) => matchesToolView("科研工具", item.type)).length >= 4);
  assert.ok(state.tools.filter((item) => matchesToolView("科研软件", item.type)).length >= 4);
  assert.ok(state.tools.filter((item) => matchesToolView("MCP", item.type)).length >= 4);
});
