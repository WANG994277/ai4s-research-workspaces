import test from "node:test";
import assert from "node:assert/strict";
import { createModulePreloader } from "./module-loaders";

test("module preloader reuses one promise for repeated and aliased modules", async () => {
  let workspaceCalls = 0;
  let catalogCalls = 0;
  const workspaceLoader = () => {
    workspaceCalls += 1;
    return Promise.resolve("workspace");
  };
  const catalogLoader = () => {
    catalogCalls += 1;
    return Promise.resolve("catalog");
  };
  const preload = createModulePreloader({
    workspace: workspaceLoader,
    skills: catalogLoader,
    models: catalogLoader,
    tools: catalogLoader,
  });

  const first = preload("workspace");
  const second = preload("workspace");
  const skills = preload("skills");
  const models = preload("models");
  const tools = preload("tools");

  assert.equal(first, second);
  assert.equal(skills, models);
  assert.equal(models, tools);
  assert.equal(await first, "workspace");
  assert.equal(await skills, "catalog");
  assert.equal(workspaceCalls, 1);
  assert.equal(catalogCalls, 1);
});

test("module preloader safely ignores unknown module ids", async () => {
  const preload = createModulePreloader({ workspace: () => Promise.resolve("ok") });
  assert.equal(await preload("not-a-module"), undefined);
});
