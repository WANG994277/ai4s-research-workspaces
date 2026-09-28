import test from "node:test";
import assert from "node:assert/strict";
import { modules, visibleModules } from "./navigation";
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
    "knowledge",
    "skills",
    "models",
    "tools",
    "lab",
    "assets",
    "task-history",
  ],
  analyst: ["workspace", "assistant", "knowledge", "tools", "lab", "assets", "task-history"],
  leader: [
    "workspace",
    "assistant",
    "knowledge",
    "skills",
    "models",
    "tools",
    "lab",
    "assets",
    "task-history",
    "project-management-external",
  ],
  manager: [
    "knowledge",
    "skills",
    "models",
    "lab",
    "assets",
    "space-management",
    "research-management",
    "research-decision",
    "project-management-external",
  ],
  decision: ["research-decision", "project-management-external"],
  admin: [
    "skills",
    "models",
    "tools",
    "lab",
    "assets",
    "space-management",
    "admin",
  ],
} as const;

test("workspace and knowledge have no second-level navigation", () => {
  assert.deepEqual(labels("workspace"), []);
  assert.deepEqual(labels("assistant"), []);
  assert.deepEqual(labels("knowledge"), []);
});

test("research assistant is an independent first-level module", () => {
  const assistant = modules.find((module) => module.id === "assistant");
  assert.equal(assistant?.name, "科研超级中枢");
  assert.equal(assistant?.href, "/assistant");
});

test("researcher navigation matches the confirmed sidebar grouping and order", () => {
  const researcherModules = visibleModules(profiles.researcher);
  assert.deepEqual(
    researcherModules.map((module) => [module.name, module.group]),
    [
      ["科研工作台", "核心入口"],
      ["科研超级中枢", "超级中枢"],
      ["知识中心", "科研广场"],
      ["科研技能", "科研广场"],
      ["科研模型", "科研广场"],
      ["科研工具箱", "科研广场"],
      ["云上实验室", "实验空间"],
      ["科研资产", "资产空间"],
      ["历史任务", "历史任务入口"],
    ],
  );
  assert.equal(modules.find((module) => module.id === "task-history")?.href, "/task-history");
});

test("research toolbox exposes tools, software and MCP", () => {
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
