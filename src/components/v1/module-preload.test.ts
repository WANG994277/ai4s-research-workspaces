import test from "node:test";
import assert from "node:assert/strict";

test("module preloader deduplicates aliases that share the same bundle", async () => {
  const preloadModule = await import("./module-preload").catch(() => ({
    createModulePreloader: undefined,
  }));
  assert.equal(typeof preloadModule.createModulePreloader, "function");

  let catalogLoads = 0;
  const preload = preloadModule.createModulePreloader!(
    {
      catalog: async () => {
        catalogLoads += 1;
      },
    },
    {
      skills: "catalog",
      models: "catalog",
      tools: "catalog",
    },
  );

  await Promise.all([
    preload("skills"),
    preload("models"),
    preload("tools"),
  ]);
  await preload("unknown");

  assert.equal(catalogLoads, 1);
});

test("navigation modules resolve to their actual dynamic bundles", async () => {
  const preloadModule = await import("./module-preload").catch(() => ({
    resolveBaselineModuleKey: undefined,
  }));
  assert.equal(typeof preloadModule.resolveBaselineModuleKey, "function");
  assert.equal(preloadModule.resolveBaselineModuleKey!("workspace"), "workspace");
  assert.equal(preloadModule.resolveBaselineModuleKey!("skills"), "catalog");
  assert.equal(preloadModule.resolveBaselineModuleKey!("models"), "catalog");
  assert.equal(preloadModule.resolveBaselineModuleKey!("tools"), "catalog");
  assert.equal(preloadModule.resolveBaselineModuleKey!("assistant"), undefined);
});

test("navigation warmup targets keep query routes and expose a deduplicated path", async () => {
  const preloadModule = await import("./module-preload") as unknown as {
    collectNavigationWarmupTargets?: (
      modules: Array<{
        id: string;
        href: string;
        children: Array<{ href: string }>;
      }>,
    ) => Array<{ moduleId: string; href: string; path: string }>;
  };
  assert.equal(typeof preloadModule.collectNavigationWarmupTargets, "function");

  assert.deepEqual(
    preloadModule.collectNavigationWarmupTargets!([
      { id: "skills", href: "/skills", children: [] },
      {
        id: "tools",
        href: "/tools?view=科研工具",
        children: [
          { href: "/tools?view=科研工具" },
          { href: "/tools?view=科研软件" },
        ],
      },
    ]),
    [
      { moduleId: "skills", href: "/skills", path: "/skills" },
      {
        moduleId: "tools",
        href: "/tools?view=科研工具",
        path: "/tools",
      },
      {
        moduleId: "tools",
        href: "/tools?view=科研软件",
        path: "/tools",
      },
    ],
  );
});
