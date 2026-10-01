import test from "node:test";
import assert from "node:assert/strict";
import { createComputingSeed, filterComputingTasks, nextComputingStatus, validateComputeDraft } from "./scientific-computing-domain";

test("computing tasks filter by category, status, and search text", () => {
  const tasks = createComputingSeed("space-a");
  const rows = filterComputingTasks(tasks, { category: "compute", status: "运行中", query: "PtNi" });
  assert.equal(rows.length, 1);
  assert.match(rows[0].name, /PtNi/);
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
