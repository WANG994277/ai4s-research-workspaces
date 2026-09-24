import test from "node:test";
import assert from "node:assert/strict";
import { matchesToolView } from "./catalog-views";

test("toolbox second-level views are mutually exclusive", () => {
  assert.equal(matchesToolView("科研工具", "数据处理"), true);
  assert.equal(matchesToolView("科研工具", "科研软件"), false);
  assert.equal(matchesToolView("科研工具", "连接器"), false);
  assert.equal(matchesToolView("科研软件", "科研软件"), true);
  assert.equal(matchesToolView("MCP", "连接器"), true);
});
