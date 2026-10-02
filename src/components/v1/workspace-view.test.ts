import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed";

test("assistant launch mode can be selected, switched, and cleared", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    toggleAssistantLaunchMode?: (
      current: "读" | "算" | "做" | "",
      next: "读" | "算" | "做",
    ) => "读" | "算" | "做" | "";
  };

  assert.equal(typeof view.toggleAssistantLaunchMode, "function");
  assert.equal(view.toggleAssistantLaunchMode!("", "读"), "读");
  assert.equal(view.toggleAssistantLaunchMode!("读", "算"), "算");
  assert.equal(view.toggleAssistantLaunchMode!("读", "读"), "");
});

test("space switcher groups project and topic spaces under their project", async () => {
  const view = await import("./workspace-view").catch(() => ({
    groupResearchSpaces: undefined,
  }));
  assert.equal(typeof view.groupResearchSpaces, "function");

  const state = createSeed();
  const spaces = state.spaces.filter((space) =>
    ["personal-lin", "project-p1", "topic-a", "topic-b"].includes(space.id),
  );
  const result = view.groupResearchSpaces!(spaces, state.projects);
  const projectGroup = result.projects.find(
    (group) => group.project.id === "p1",
  );

  assert.deepEqual(result.personal.map((space) => space.id), ["personal-lin"]);
  assert.equal(projectGroup?.project.name, "非常规油气前沿研究");
  assert.equal(projectGroup?.projectSpace?.id, "project-p1");
  assert.deepEqual(
    projectGroup?.topics.map((space) => space.id),
    ["topic-a", "topic-b"],
  );
});

test("chat file panel keeps task outputs and deduplicated references together", async () => {
  const view = await import("./workspace-view").catch(() => ({
    collectChatFiles: undefined,
  }));
  assert.equal(typeof view.collectChatFiles, "function");

  const state = createSeed();
  const task = state.tasks.find((item) => item.id === "task-shale")!;
  const session = state.sessions.find((item) => item.id === "task-shale-session")!;
  session.contextIds = ["k-paper", "k-paper"];
  task.contextIds = ["k-paper", "dataset-shale"];

  const result = view.collectChatFiles!(state.artifacts, task, session);

  assert.ok(result.outputs.every((artifact) => artifact.taskId === task.id));
  assert.deepEqual(result.referenceIds, ["k-paper", "dataset-shale"]);
});

test("task navigation keeps the explicitly requested session", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    resolveWorkspaceSession?: typeof import("./workspace-view")["resolveWorkspaceSession"];
  };
  assert.equal(typeof view.resolveWorkspaceSession, "function");

  const state = createSeed();
  const task = state.tasks.find((item) => item.id === "task-shale")!;
  const first = state.sessions.find((item) => item.id === "task-shale-session")!;
  const second = { ...structuredClone(first), id: "task-shale-session-2" };
  task.sessionIds.push(second.id);
  state.sessions.push(second);

  assert.equal(
    view.resolveWorkspaceSession!(state.sessions, second.id, task)?.id,
    second.id,
  );
});

test("chat file references exclude resources that are no longer readable", async () => {
  const state = createSeed();
  const task = state.tasks.find((item) => item.id === "task-shale")!;
  const session = state.sessions.find((item) => item.id === "task-shale-session")!;
  session.contextIds = ["k-paper", "private-revoked"];

  const { collectChatFiles } = await import("./workspace-view");
  const result = collectChatFiles(
    state.artifacts,
    task,
    session,
    (id) => id !== "private-revoked",
  );

  assert.deepEqual(result.referenceIds, ["k-paper", "dataset-shale"]);
});

test("only active spaces can be selected as the current workspace", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    isSpaceSwitchable?: typeof import("./workspace-view")["isSpaceSwitchable"];
  };
  assert.equal(typeof view.isSpaceSwitchable, "function");

  const state = createSeed();
  const active = state.spaces.find((space) => space.id === "topic-a")!;
  const suspended = { ...active, status: "SUSPENDED" as const };

  assert.equal(view.isSpaceSwitchable!(active), true);
  assert.equal(view.isSpaceSwitchable!(suspended), false);
});

test("workspace home prefers the shale gas topic before project and global fallbacks", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    chooseDefaultWorkspaceTopic?: (
      topics: ReturnType<typeof createSeed>["spaces"],
      projectId: string,
    ) => ReturnType<typeof createSeed>["spaces"][number] | undefined;
  };
  assert.equal(typeof view.chooseDefaultWorkspaceTopic, "function");

  const state = createSeed();
  const topics = state.spaces.filter((space) => space.type === "TOPIC");
  assert.equal(
    view.chooseDefaultWorkspaceTopic!(topics, "p-rubber")?.name,
    "页岩气储层评价课题",
  );

  const withoutShale = topics.filter((space) => space.name !== "页岩气储层评价课题");
  assert.equal(
    view.chooseDefaultWorkspaceTopic!(withoutShale, "p-rubber")?.projectId,
    "p-rubber",
  );
  assert.equal(
    view.chooseDefaultWorkspaceTopic!(withoutShale, "missing-project")?.id,
    withoutShale[0]?.id,
  );
});

test("workspace task examples match the shale gas read calculate and design brief", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    WORKSPACE_TASK_EXAMPLES?: Record<string, { title: string; suggestions: string[] }>;
  };
  assert.deepEqual(view.WORKSPACE_TASK_EXAMPLES, {
    读: {
      title: "研读文献，洞察前沿",
      suggestions: [
        "梳理页岩气储层评价指标与技术路线",
        "总结储层甜点评价方法与研究进展",
      ],
    },
    算: {
      title: "计算模拟，分析验证",
      suggestions: [
        "分析页岩气储层关键参数及主控因素",
        "构建储层综合评价模型并识别有利区",
      ],
    },
    做: {
      title: "设计方案，开展研究",
      suggestions: [
        "生成页岩气储层综合评价与测试方案",
        "制定甜点区优选及下一步研究方案",
      ],
    },
  });
});

test("workspace output trend runs from January through December", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    REFERENCE_OUTPUT_TREND?: { month: string; value: number }[];
  };
  assert.deepEqual(
    view.REFERENCE_OUTPUT_TREND?.map((item) => item.month),
    ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  );
});

test("recent research task actions open the rubber-formula task conversation", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    RECENT_TASKS_HREF?: string;
  };
  assert.equal(
    view.RECENT_TASKS_HREF,
    "/research-spaces/current/tasks?session=rubber-formula",
  );
});

test("workbench home model combines recommendations, activity, recent work and frontier knowledge", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    buildWorkbenchHome?: typeof import("./workspace-view")["buildWorkbenchHome"];
  };
  assert.equal(typeof view.buildWorkbenchHome, "function");

  const state = createSeed();
  const model = view.buildWorkbenchHome!(state, "topic-a", "lin");

  assert.equal(model.recommendations[0]?.kind, "decision");
  assert.equal(model.recommendations[0]?.action, "查看详情");
  assert.ok(model.activities.some((item) => item.category === "实验动态"));
  assert.ok(model.activities.some((item) => item.category === "计算动态"));
  assert.equal(model.recentTasks.length, 3);
  assert.equal(model.recentArtifacts[0]?.id, "artifact-shale");
  assert.ok(model.frontier.length >= 9);
  assert.deepEqual(
    [...new Set(model.frontier.map((item) => item.type))],
    ["文献", "专利", "标准", "科研资讯"],
  );
  assert.ok(model.frontier.some((item) => item.discipline === "材料科学"));
  assert.ok(model.frontier.some((item) => item.discipline === "合成生物"));
  assert.ok(model.frontier.some((item) => item.discipline === "化学化工"));
});

test("workbench uses the previous project mock density and default model", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    DEFAULT_WORKBENCH_MODEL?: string;
    buildWorkbenchHome?: typeof import("./workspace-view")["buildWorkbenchHome"];
  };

  assert.equal(view.DEFAULT_WORKBENCH_MODEL, "deepseekV4Pro");
  const model = view.buildWorkbenchHome!(createSeed(), "topic-a", "lin");
  assert.equal(model.recommendations.length, 5);
  assert.deepEqual(
    model.recommendations.map((item) => item.title),
    [
      "实验结果异动提醒",
      "计算任务已完成",
      "相关文献推荐",
      "课题里程碑即将到期",
      "智能体建议：优化实验方案",
    ],
  );
  assert.equal(model.activities.length, 5);
  assert.deepEqual(
    model.activities.map((item) => item.title),
    [
      "实验数据已同步",
      "计算任务开始运行",
      "新文献已加入知识库",
      "课题进展更新",
      "实验预约成功",
    ],
  );
});

test("workbench research frontier is hidden until explicitly enabled", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    WORKBENCH_FRONTIER_VISIBLE?: boolean;
  };
  assert.equal(view.WORKBENCH_FRONTIER_VISIBLE, false);
});

test("research assistant view exposes plan trace changes and categorized outputs", async () => {
  const view = (await import("./workspace-view")) as unknown as {
    buildResearchAssistantView?: typeof import("./workspace-view")["buildResearchAssistantView"];
  };
  assert.equal(typeof view.buildResearchAssistantView, "function");

  const state = createSeed();
  const task = state.tasks.find((item) => item.id === "task-shale")!;
  const session = state.sessions.find((item) => item.id === "task-shale-session")!;
  const model = view.buildResearchAssistantView!(state, task, session);

  assert.equal(model.planVersion, "V4");
  assert.deepEqual(model.stages.map((stage) => stage.label), [
    "文献调研",
    "指标分析",
    "计算模拟",
    "方案设计",
  ]);
  assert.ok(model.stages.every((stage) => stage.summary.length > 0));
  assert.deepEqual(
    [...new Set(model.stages.flatMap((stage) => stage.events.map((event) => event.kind)))],
    ["dispatch", "agent", "tool", "result"],
  );
  assert.ok(model.stages.some((stage) => stage.events.filter((event) => event.kind === "agent").length > 1));
  assert.ok(model.stages.some((stage) => stage.events.filter((event) => event.kind === "tool").length > 1));
  assert.ok(model.changes.length >= 2);
  assert.deepEqual(model.outputFilters, ["全部", "报告", "数据", "图表", "文件"]);
  assert.ok(model.outputs.some((output) => output.type === "报告" && output.core));
  assert.ok(model.outputs.some((output) => output.status === "生成中"));
});

test("seed provides realistic read calculate and experiment assistant tasks", () => {
  const state = createSeed();
  const assistantTasks = ["task-read", "task-calculate", "task-experiment"].map(
    (id) => state.tasks.find((task) => task.id === id),
  );
  assert.ok(assistantTasks.every(Boolean));
  assert.deepEqual(
    assistantTasks.map((task) => task?.name),
    [
      "新能源汽车轮胎用柔性丁苯橡胶文献调研",
      "柔性丁苯橡胶配方参数计算",
      "推荐配方实验验证方案",
    ],
  );
  assert.equal(state.projects.find((project) => project.id === "p-rubber")?.name, "高性能合成橡胶项目");
  assert.equal(state.spaces.find((space) => space.id === "topic-rubber")?.name, "配方优化课题");
  assert.ok(assistantTasks.every((task) => task?.spaceId === "topic-rubber"));
  assert.ok(assistantTasks[1]?.contextIds.includes("artifact-read-report"));
  assert.ok(assistantTasks[2]?.contextIds.includes("artifact-calc-recommendation"));
  assert.ok(state.artifacts.some((artifact) => artifact.id === "artifact-read-report"));
  assert.ok(state.artifacts.some((artifact) => artifact.id === "artifact-calc-recommendation"));
  for (const task of assistantTasks) {
    const session = state.sessions.find((item) => item.taskId === task?.id);
    assert.ok(session && session.messages.length >= 4);
    assert.equal(session?.messages[0]?.role, "user");
    assert.ok(session?.messages.some((message) => message.text.includes("Agent")));
    assert.ok(session?.messages.some((message) => message.text.includes("工具")));
  }
});

test("assistant demo migration repairs legacy task context without losing decisions", async () => {
  const { ensureAssistantDemoState } = await import("./seed");
  const state = createSeed();
  const task = state.tasks.find((item) => item.id === "task-experiment")!;
  task.spaceId = "topic-a";
  task.projectId = "p1";
  task.contextIds = ["dataset-shale"];
  task.steps[0].resources = ["template"];
  const decision = state.decisions.find((item) => item.id === "decision-experiment-slot")!;
  decision.status = "decided";
  decision.choice = "采用两个推荐时段";

  ensureAssistantDemoState(state);

  assert.equal(task.spaceId, "topic-rubber");
  assert.equal(task.projectId, "p-rubber");
  assert.ok(task.contextIds.includes("artifact-calc-recommendation"));
  assert.deepEqual(task.steps[0].resources, ["template-rubber-experiment"]);
  assert.equal(decision.status, "decided");
  assert.equal(decision.choice, "采用两个推荐时段");
});
