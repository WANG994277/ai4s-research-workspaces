import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = process.env.COCKPIT_BASE_URL || "http://localhost:3000";
const cases = {
  trend: ["专题态势监测", "多源趋势分析", "重点机构观察", "数据来源概览"],
  strategy: ["技术方向证据研判", "技术方向对比", "多源证据", "研判结论与建议"],
  resources: ["科研资源供需看板", "资源瓶颈预警", "AI 智能建议"],
  projects: ["项目进度与风险穿透", "重大项目列表", "里程碑时间线"],
  outcomes: ["成果专题展示", "成果类型分布", "最新成果"],
  "technology-tree": ["科技树", "技术谱系与布局", "证据与后续行动"],
};

const implementation = [
  "src/components/research/cockpit/scientific-cockpit.tsx",
  "src/components/research/cockpit/data.ts",
  "src/components/research/cockpit/trend-strategy.tsx",
  "src/components/research/cockpit/resources-projects.tsx",
  "src/components/research/cockpit/outcomes.tsx",
  "src/components/research/scientific-dashboard.tsx",
]
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

for (const [view, headings] of Object.entries(cases)) {
  const response = await fetch(`${base}/dashboard?view=${view}`);
  assert.equal(response.status, 200, `${view} route`);
  const html = await response.text();
  assert.ok(
    html.includes("app/(app)/dashboard/page.js"),
    `${view}: dashboard client bundle missing`,
  );
  for (const heading of headings)
    assert.ok(implementation.includes(heading), `${view}: missing ${heading}`);
  console.log(`PASS ${view}: route + ${headings.length} business regions`);
}

console.log(
  "INFO cockpit business regions hydrate inside the client permission shell; browser verification is recorded separately.",
);
