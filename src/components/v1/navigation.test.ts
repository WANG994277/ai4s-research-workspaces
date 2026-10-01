import test from "node:test";
import assert from "node:assert/strict";
import { moduleForPath, modules, visibleChildren, visibleModules } from "./navigation";
import { createSeed, normalizeLegacyRoleState, profiles } from "./seed";

const labels = (id: string) =>
  modules
    .find((module) => module.id === id)
    ?.children.map((item) => item.label) ?? [];

const moduleIds = (profile: keyof typeof profiles) =>
  visibleModules(profiles[profile]).map((module) => module.id);

const expectedModules = {
  researcher: [
    "workspace",
    "assistant",
    "my-resources",
    "lab",
    "research-spaces",
  ],
  analyst: ["workspace", "assistant", "my-resources", "lab", "research-spaces"],
  leader: [
    "workspace",
    "assistant",
    "my-resources",
    "lab",
    "research-spaces",
    "project-management-external",
  ],
  manager: [
    "my-resources",
    "lab",
    "research-spaces",
    "research-management",
    "research-decision",
    "project-management-external",
  ],
  decision: ["research-decision", "project-management-external"],
  admin: [
    "my-resources",
    "lab",
    "research-spaces",
    "admin",
  ],
} as const;

test("workspace and knowledge have no second-level navigation", () => {
  assert.deepEqual(labels("workspace"), []);
  assert.deepEqual(labels("knowledge"), []);
});

test("research space replaces the old asset and project-space modules", () => {
  const item = modules.find((module) => module.id === "research-spaces");
  assert.equal(item?.name, "科研空间");
  assert.equal(item?.href, "/research-spaces/current/overview");
  assert.deepEqual(labels("research-spaces"), [
    "课题概览",
    "科研任务",
    "科学计算",
    "科研活动",
    "科研资产",
  ]);
  assert.equal(modules.some((module) => module.id === "assets"), false);
  assert.equal(
    modules.some((module) => module.id === "space-management"),
    false,
  );
});

test("research resources center contains the five requested second-level routes", () => {
  const item = modules.find((module) => module.id === "my-resources");
  assert.equal(item?.name, "科研资源中心");
  assert.equal(item?.href, "/my-resources");
  assert.deepEqual(item?.children, [
    { label: "知识中心", href: "/knowledge" },
    { label: "科研数据集", href: "/datasets" },
    { label: "科研技能", href: "/skills" },
    { label: "科研模型", href: "/models" },
    { label: "科研工具箱", href: "/tools?view=" + encodeURIComponent("科研工具") },
  ]);
  assert.equal(moduleForPath("/datasets")?.parentId, "my-resources");
});

test("research data keeps its online-synced route and becomes a child module", () => {
  const item = modules.find((module) => module.id === "datasets");
  assert.equal(item?.name, "科研数据集");
  assert.equal(item?.href, "/datasets");
  assert.equal(item?.parentId, "my-resources");
  assert.deepEqual(item?.children, []);
});

test("resource center only shows children available to the current role", () => {
  const center = modules.find((module) => module.id === "my-resources")!;
  assert.deepEqual(visibleChildren(center, profiles.analyst).map((item) => item.label), [
    "知识中心", "科研数据集", "科研工具箱",
  ]);
  assert.deepEqual(visibleChildren(center, profiles.admin).map((item) => item.label), [
    "科研数据集", "科研技能", "科研模型", "科研工具箱",
  ]);
});

test("research super hub remains a first-level module", () => {
  const item = modules.find((module) => module.id === "assistant");
  assert.equal(item?.name, "科研超级中枢");
  assert.equal(item?.href, "/assistant");
});

test("research toolbox has the user-confirmed three second-level functions", () => {
  assert.deepEqual(labels("tools"), ["科研工具", "科研软件", "MCP"]);
});

test("project management has the seven user-confirmed second-level functions", () => {
  assert.deepEqual(labels("project-management-external"), [
    "立项管理",
    "过程管理",
    "外协管理",
    "成果管理",
    "人才管理",
    "考核管理",
    "日常管理",
  ]);
});

test("research cockpit continues to use the deployed dashboard route", () => {
  const cockpit = modules.find((module) => module.id === "research-decision");
  assert.equal(cockpit?.href, "/dashboard?view=trend");
  assert.deepEqual(
    cockpit?.children.map((item) => item.label),
    [
      "科技态势分析",
      "战略方向研判",
      "资源统筹配置",
      "重大项目监管",
      "科技成果展示",
      "科技树",
    ],
  );
});

test("the role switcher exposes the user-confirmed six roles", () => {
  assert.deepEqual(Object.keys(profiles), [
    "researcher",
    "analyst",
    "leader",
    "manager",
    "decision",
    "admin",
  ]);
});

test("each role sees exactly the confirmed first-level modules", () => {
  for (const [profile, expected] of Object.entries(expectedModules)) {
    assert.deepEqual(
      moduleIds(profile as keyof typeof profiles),
      [...expected],
      profile,
    );
  }
});

test("saved project-manager sessions migrate to research manager", () => {
  const state = createSeed();
  const legacy = state as unknown as {
    profileKey: string;
    extraRoles: string[];
    userRoles: Record<string, string[]>;
  };
  legacy.profileKey = "projectManager";
  legacy.extraRoles = ["projectManager"];
  legacy.userRoles = { wang: ["projectManager", "researcher"] };
  state.spaces.push({
    ...state.spaces.find((space) => space.id === "personal-lin")!,
    id: "personal-zhou",
    ownerId: "zhou",
  });
  state.spaceId = "personal-zhou";

  normalizeLegacyRoleState(state);

  assert.equal(state.profileKey, "manager");
  assert.deepEqual(state.extraRoles, ["manager"]);
  assert.deepEqual(state.userRoles, { wang: ["manager", "researcher"] });
  assert.equal(state.spaceId, "personal-wang");
});

test("legacy demo labels are removed from persisted mock content", async () => {
  const seed = (await import("./seed")) as unknown as {
    normalizeLegacyDemoState?: (state: ReturnType<typeof createSeed>) => void;
  };
  assert.equal(typeof seed.normalizeLegacyDemoState, "function");

  const state = createSeed();
  state.sessions[0].name = "睡前验收：调研储层敏感性";
  state.sessions[0].messages[0].text = "睡前验收：生成研究报告";
  state.tasks[0].name = "睡前验收：调研储层敏感性";
  state.artifacts[0].name = "睡前验收：研究产出";
  state.assets[0].name = "睡前验收：方案模板";

  seed.normalizeLegacyDemoState!(state);

  assert.equal(state.sessions[0].name, "调研储层敏感性");
  assert.equal(state.sessions[0].messages[0].text, "生成研究报告");
  assert.equal(state.tasks[0].name, "调研储层敏感性");
  assert.equal(state.artifacts[0].name, "研究产出");
  assert.equal(state.assets[0].name, "方案模板");
});
