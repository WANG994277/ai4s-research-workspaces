import assert from "node:assert/strict";
import capabilityData from "../src/lib/capabilities.ts";
const { getCapability } = capabilityData;
import cockpitData from "../src/components/research/cockpit/data.ts";
const { defaults, evidence, inScope, outcomes, sumEvidence, projectRecords } =
  cockpitData;
// 链接保留课题上下文时，面包屑必须仍然指向所选驾驶舱视角。
assert.equal(
  getCapability("/dashboard?view=strategy&projectId=PROJ-CCUS-01")?.label,
  "战略方向研判",
);
assert.equal(
  getCapability("/dashboard?record=p3&view=projects")?.label,
  "重大项目监管",
);
const patents = evidence.filter((r) =>
  inScope(r, { ...defaults, source: "中国专利数据库" }),
);
assert.equal(sumEvidence(patents, "论文"), 0);
assert.ok(sumEvidence(patents, "专利") > 0);
const year = evidence.filter((r) =>
  inScope(r, { ...defaults, period: "2023" }),
);
assert.ok(year.length > 0);
assert.ok(year.every((r) => r.year === 2023));
assert.equal(
  evidence.filter((r) => inScope(r, { ...defaults, period: "2025" })).length,
  0,
);
const byOrg = evidence.filter((r) =>
  inScope(r, { ...defaults, org: "勘探开发研究院", field: "油气勘探开发" }),
);
assert.ok(byOrg.length > 0);
assert.ok(
  byOrg.every((r) => r.org === "勘探开发研究院" && r.field === "油气勘探开发"),
);
const allTotal = sumEvidence(evidence);
assert.equal(
  ["论文", "专利", "标准", "项目"].reduce(
    (n, t) => n + sumEvidence(evidence, t),
    0,
  ),
  allTotal,
);
assert.equal(
  outcomes.filter((r) => inScope(r, { ...defaults, period: "2023" })).length,
  1,
);
console.log(
  "PASS cockpit context routing, source/year/organization/field filters, empty state, aggregate reconciliation",
);

for (const p of projectRecords) {
  const [completed, total] = p.milestone.split("/").map(Number);
  assert.equal(
    p.milestones?.length,
    total,
    `${p.id}: milestone total reconciles`,
  );
  assert.equal(
    p.milestones.filter((m) => m.status === "已完成").length,
    completed,
    `${p.id}: completed milestones reconcile`,
  );
}

console.log(
  "PASS project milestone details reconcile with all 8 project summaries",
);
