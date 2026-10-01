import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

assert.match(read("src/app/page.tsx"), /PortalHome/);
assert.ok(existsSync("src/app/research-resources/page.tsx"));
assert.ok(existsSync("src/app/(app)/my-resources/page.tsx"));
assert.ok(existsSync("src/app/(app)/research-spaces/[contextId]/overview/page.tsx"));
assert.ok(existsSync("src/app/(app)/research-spaces/[contextId]/tasks/page.tsx"));
assert.ok(existsSync("src/app/(app)/research-spaces/[contextId]/activities/page.tsx"));

const overview = read("src/components/v1/research-overview.tsx");
for (const label of ["科研信息", "课题成员", "科研任务", "科研产出"])
  assert.match(overview, new RegExp(label));

const taskWorkspace = read("src/components/v1/research-task-workspace.tsx");
for (const label of [
  "新建任务",
  "对话",
  "轨迹",
  "目标规划",
  "沙盒文件",
  "任务产出视图",
  "成员与协作",
  "搜索轨迹",
  "导出",
  "@ 选择人或智能体",
]) assert.match(taskWorkspace, new RegExp(label));

const portal = read("src/components/portal/portal.tsx");
for (const label of ["科研全流程贯通", "热门科研资源", "AI 协同科研成果案例", "平台动态与 AI 科研活动"])
  assert.match(portal, new RegExp(label));

const standalone = "output/AI4S科研平台合并演示.html";
assert.ok(existsSync(standalone));
const html = read(standalone);
assert.match(html, /<!doctype html>/i);
assert.match(html, /集团科研资源中心/);
assert.match(html, /课题概览/);
assert.match(html, /科研活动/);

console.log("prototype merge structure: ok");
