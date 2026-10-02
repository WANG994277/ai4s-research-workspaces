import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./research-activities.tsx", import.meta.url),
  "utf8",
);
const computingSource = readFileSync(
  new URL("./scientific-computing.tsx", import.meta.url),
  "utf8",
);
let agentBuilderSource = "";
try {
  agentBuilderSource = readFileSync(new URL("./research-agent-builder.tsx", import.meta.url), "utf8");
} catch {
  // The red phase intentionally starts before the builder exists.
}

test("research activities exposes the eight approved peer tabs", () => {
  for (const label of ["智能体", "技能", "模型开发", "模型训练", "模型推理", "数据集", "科研工具", "科学计算"]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
});

test("capability tables use the approved columns and row actions", () => {
  assert.doesNotMatch(source, />关联能力</);
  assert.doesNotMatch(source, />创建方式</);
  assert.match(source, />创建人</);
  assert.match(source, />操作</);
  assert.match(source, />查看</);
  assert.match(source, />添加使用</);
  assert.match(source, /已添加到科研超级中枢/);
  assert.doesNotMatch(source, /前往 AI 中台创建/);
  assert.doesNotMatch(source, /模块使用说明/);
});

test("ready status is removed from capability data and filters", () => {
  assert.doesNotMatch(source, /已就绪/);
});

test("agent creation opens the dedicated legacy-style builder", () => {
  assert.match(source, /activities\/agents\/new/);
  for (const field of ["调试预览", "提示词编辑", "欢迎语", "推荐问题", "能力扩展", "高级设置", "权限设置", "发布"]) assert.match(agentBuilderSource, new RegExp(field));
});

test("skill and model-development dialogs migrate the exact prototype fields", () => {
  for (const field of ["技能名称", "学科领域", "应用场景", "技能形态", "何时使用", "任务步骤"]) assert.match(source, new RegExp(field));
  for (const field of ["模型名称", "模型类型", "任务类型", "模型架构", "基础模型", "模型来源"]) assert.match(source, new RegExp(field));
  assert.doesNotMatch(source, /tab === "agents" &&/);
});

test("compute training and inference use the shared research-activity list shell", () => {
  assert.match(source, /tab === "computing" \? "compute"/);
  assert.match(source, /tab === "training" \? "training"/);
  assert.match(source, /tab === "inference" \? "inference"/);
  assert.doesNotMatch(source, /<ScientificComputing embedded \/>/);
  assert.doesNotMatch(source, /计算任务列表/);
});

test("embedded computing list does not rewrite itself to a nonexistent nested route", () => {
  assert.match(computingSource, /if \(embedded && !taskId\) return/);
  assert.match(computingSource, /const listBase = embedded/);
  assert.match(computingSource, /href=\{listBase\}/);
});
