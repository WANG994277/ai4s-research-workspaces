import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPUTING_DETAIL_TABS,
  createComputingSeed,
  filterComputingTasks,
  getComputingScenario,
  getModelTaskScenario,
  nextComputingStatus,
  normalizeComputingDetailTab,
  validateComputeDraft,
} from "./scientific-computing-domain";

test("computing tasks filter by category, status, and search text", () => {
  const tasks = createComputingSeed("space-a");
  const rows = filterComputingTasks(tasks, { category: "compute", status: "运行中", query: "常减压" });
  assert.equal(rows.length, 1);
  assert.match(rows[0].name, /常减压/);
  assert.equal(rows[0].spaceId, "space-a");
});

test("simulated task transitions respect running and queued states", () => {
  assert.equal(nextComputingStatus("排队中", "start"), "运行中");
  assert.equal(nextComputingStatus("运行中", "stop"), "已停止");
  assert.equal(nextComputingStatus("运行中", "complete"), "已完成");
  assert.equal(nextComputingStatus("已完成", "stop"), null);
});

test("compute submission requires task name and structural file", () => {
  assert.deepEqual(validateComputeDraft({ name: "", fileName: "" }), ["请输入任务名称", "请选择输入结构文件"]);
  assert.deepEqual(validateComputeDraft({ name: "PtNi 测试", fileName: "POSCAR" }), []);
});

test("computing detail uses four non-overlapping information areas", () => {
  assert.deepEqual(COMPUTING_DETAIL_TABS, ["概览", "配置与运行", "结果分析", "文件与日志"]);
});

test("legacy computing detail tabs map to the new information architecture", () => {
  assert.equal(normalizeComputingDetailTab("运行过程"), "配置与运行");
  assert.equal(normalizeComputingDetailTab("计算结果"), "结果分析");
  assert.equal(normalizeComputingDetailTab("结果文件"), "文件与日志");
  assert.equal(normalizeComputingDetailTab("运行日志"), "文件与日志");
  assert.equal(normalizeComputingDetailTab("未知页签"), "概览");
});

test("all seeded computing tasks use oil refining domain scenarios", () => {
  const tasks = createComputingSeed("space-a").filter(task => task.category === "compute");
  assert.equal(tasks.length, 8);
  assert.ok(tasks.every(task => task.domain === "油气炼化"));
  assert.deepEqual(tasks.slice(0, 3).map(task => task.templateId), ["cdu-steady-state", "fcc-reactor-regenerator", "fired-heater-cfd"]);
});

test("the first three computing tasks have distinct parameters, stages, results, and files", () => {
  const tasks = createComputingSeed("space-a").filter(task => task.category === "compute").slice(0, 3);
  const scenarios = tasks.map(getComputingScenario);
  assert.equal(new Set(scenarios.map(item => item.parameters[0].label)).size, 3);
  assert.equal(new Set(scenarios.map(item => item.stages[0].name)).size, 3);
  assert.equal(new Set(scenarios.map(item => item.metrics[0].label)).size, 3);
  assert.equal(new Set(scenarios.map(item => item.files[0].name)).size, 3);
});

test("remaining computing tasks reuse only refinery process or reactor templates", () => {
  const tasks = createComputingSeed("space-a").filter(task => task.category === "compute").slice(3);
  assert.ok(tasks.every(task => ["generic-refinery-process", "generic-refinery-reactor"].includes(task.templateId ?? "")));
});

test("training and inference tasks keep distinct configuration snapshots", () => {
  const tasks = createComputingSeed("space-a");
  const training = tasks.find(task => task.category === "training")!;
  const inference = tasks.find(task => task.category === "inference")!;
  assert.equal(training.parameters?.["训练轮次"], "120");
  assert.equal(training.parameters?.["学习率"], "0.001");
  assert.equal(inference.parameters?.["推理模式"], "批量预测");
  assert.equal(inference.parameters?.["置信度阈值"], "0.75");
});

test("training and inference details expose different stages, charts, and result files", () => {
  const tasks = createComputingSeed("space-a");
  const training = getModelTaskScenario(tasks.find(task => task.category === "training")!);
  const inference = getModelTaskScenario(tasks.find(task => task.category === "inference")!);
  assert.notEqual(training.stages[0].name, inference.stages[0].name);
  assert.notEqual(training.chartTitle, inference.chartTitle);
  assert.notEqual(training.files[0].name, inference.files[0].name);
});
