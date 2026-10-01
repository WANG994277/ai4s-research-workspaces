import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "src/components/v1/research-space.tsx",
  "src/components/v1/research-space-domain.ts",
  "src/components/v1/research-overview.tsx",
  "src/components/v1/research-activities.tsx",
  "src/components/v1/research-task-workspace.tsx",
  "src/app/(app)/research-spaces/[contextId]/overview/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/tasks/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/activities/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/assets/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/assets/[assetKey]/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/manage/[view]/page.tsx",
  "src/app/(app)/research-spaces/builds/[requestId]/page.tsx",
];
for (const file of requiredFiles)
  if (!existsSync(file)) throw new Error(`Missing research-space file: ${file}`);

const source = readFileSync("src/components/v1/research-space.tsx", "utf8");
for (const label of [
  "科研资产",
  "智能体",
  "Skill",
  "模型",
  "数据集",
  "方案模板",
  "版本",
  "共享",
  "发布记录",
  "使用记录",
  "在科研任务中使用",
  "来源未接入",
  "内容不存在，或你没有访问权限",
]) {
  if (!source.includes(label)) throw new Error(`Missing PRD label: ${label}`);
}

const css = readFileSync("src/components/v1/v1.css", "utf8");
if (!css.includes(".v-research-space"))
  throw new Error("Missing research-space design-system scope");
if (!css.includes("var(--v-brand)"))
  throw new Error("Research space must reuse the current blue brand token");

const navigation = readFileSync("src/components/v1/navigation.ts", "utf8");
if (navigation.includes('name: "科研资产"'))
  throw new Error("Legacy first-level research asset navigation remains");
if (navigation.includes('name: "项目空间管理"'))
  throw new Error("Legacy first-level project-space navigation remains");
for (const label of ["课题概览", "科研任务", "科研活动", "科研资产"])
  if (!navigation.includes(`label: "${label}"`)) throw new Error(`Missing research-space navigation: ${label}`);
if (navigation.includes('label: "空间管理"'))
  throw new Error("Space management must not remain in visible navigation");

console.log("Research-space structure checks passed");
