import test from "node:test";
import assert from "node:assert/strict";
import { pickerResources } from "./resource-picker-options";
import { createSeed, profiles } from "./seed";

test("knowledge picker exposes only readable knowledge resources", () => {
  const s = createSeed();
  const resources = pickerResources("knowledge", s, profiles.researcher, "topic-a");

  assert.ok(resources.length > 0);
  assert.deepEqual(
    resources.map((resource) => resource.id).sort(),
    s.knowledge.map((resource) => resource.id).sort(),
  );
});

test("data picker exposes only invocable datasets and excludes sibling topic data", () => {
  const s = createSeed();
  const resources = pickerResources("data", s, profiles.researcher, "topic-a");

  assert.ok(resources.length > 0);
  assert.ok(resources.every((resource) => resource.type === "数据集"));
  assert.ok(resources.some((resource) => resource.id === "dataset-shale"));
  assert.ok(!resources.some((resource) => resource.id === "private-b"));
  assert.ok(!resources.some((resource) => resource.id === "shared-b"));
});
