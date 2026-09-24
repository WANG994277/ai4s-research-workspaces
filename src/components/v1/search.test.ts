import test from "node:test";
import assert from "node:assert/strict";
import { advancedMatch, parseConditions } from "./search";
import { createSeed } from "./seed";
test("advanced search respects selected field rather than all metadata", () => {
  const o = createSeed().knowledge[0];
  assert.equal(
    advancedMatch(o, [{ field: "作者", operator: "AND", value: "页岩" }]),
    false,
  );
  assert.equal(
    advancedMatch(o, [{ field: "标题", operator: "AND", value: "页岩" }]),
    true,
  );
});
test("AND/OR/NOT form explicit condition groups", () => {
  const o = createSeed().knowledge[0];
  assert.equal(
    advancedMatch(o, [
      { field: "标题", operator: "AND", value: "不存在" },
      { field: "机构", operator: "OR", value: "能源" },
      { field: "标题", operator: "NOT", value: "专利" },
    ]),
    true,
  );
  assert.equal(
    advancedMatch(o, [
      { field: "标题", operator: "AND", value: "页岩" },
      { field: "标题", operator: "NOT", value: "页岩" },
    ]),
    false,
  );
});
test("invalid URL query cannot crash search", () =>
  assert.deepEqual(parseConditions("{"), []));
