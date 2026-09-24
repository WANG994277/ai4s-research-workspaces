import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed";

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

  assert.deepEqual(result.personal.map((space) => space.id), ["personal-lin"]);
  assert.equal(result.projects[0]?.project.name, "非常规油气前沿研究");
  assert.equal(result.projects[0]?.projectSpace?.id, "project-p1");
  assert.deepEqual(
    result.projects[0]?.topics.map((space) => space.id),
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
