import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "src/components/v1/research-space.tsx",
  "src/components/v1/research-space-domain.ts",
  "src/app/(app)/research-spaces/[contextId]/assets/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/assets/[assetKey]/page.tsx",
  "src/app/(app)/research-spaces/[contextId]/manage/[view]/page.tsx",
  "src/app/(app)/research-spaces/builds/[requestId]/page.tsx",
];
for (const file of requiredFiles)
  if (!existsSync(file)) throw new Error(`Missing research-space file: ${file}`);

const source = [
  "src/components/v1/research-space.tsx",
  "src/components/v1/research-space-list.tsx",
  "src/components/v1/research-space-management.tsx",
  "src/components/v1/research-space-domain.ts",
].map((file) => readFileSync(file, "utf8")).join("\n");
for (const label of [
  "科研资产",
  "空间管理",
  "基本信息",
  "成员",
  "角色与权限",
  "课题空间",
  "共享规则",
  "操作记录",
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
  "项目资产",
  "我的资产",
  "实际归属",
  "发布情况",
  "发布资产",
  "发布内容",
  "确认提交",
  "版本管理",
  "共享权限",
  "适用领域",
  "关键词",
  "来源未接入",
  "内容不存在，或你没有访问权限",
]) {
  if (!source.includes(label)) throw new Error(`Missing PRD label: ${label}`);
}

for (const marker of [
  "rs-assets-controlbar",
  "rs-category-tab",
  "rs-type-icon",
  "rs-status-pill",
  "rs-assets-table",
  "rs-create-dropdown",
  "rs-asset-scope-tabs",
  "rs-publish-steps",
  "rs-detail-hero",
  "rs-basic-info-card",
]) {
  if (!source.includes(marker)) throw new Error(`Missing reference-layout marker: ${marker}`);
}

for (const marker of [
  "rs-space-directory",
  "rs-space-create",
  "rs-space-members",
  "成员初始化",
  "协作与共享设置",
]) {
  if (!source.includes(marker)) throw new Error(`Missing space-management reference marker: ${marker}`);
}
if (!source.includes('<div className="rs-space-directory">\n      <Breadcrumb current="空间管理" />\n      <header className="rs-space-page-title"><h1>空间管理</h1>'))
  throw new Error("Space directory page must identify itself as 空间管理");
const memberPageSource = source.split("function SpaceMembers")[1]?.split("function GovernanceNav")[0] ?? "";
if (!memberPageSource.includes("添加成员") || memberPageSource.includes("新建空间"))
  throw new Error("Space member page primary action must be 添加成员, not 新建空间");
const assetDetailSource = source.split("function AssetDetail")[1]?.split("function SpaceManagement")[0] ?? "";
for (const removedDetailAction of ["编辑基本信息", "类型与来源详情", "复制到科研空间", "归档资产"]) {
  if (assetDetailSource.includes(removedDetailAction))
    throw new Error(`Removed asset-detail action remains: ${removedDetailAction}`);
}
if (assetDetailSource.includes('setPanel("continue-build")'))
  throw new Error("Removed continue-build action remains in asset detail");

const css = readFileSync("src/components/v1/v1.css", "utf8");
if (!css.includes(".v-research-space"))
  throw new Error("Missing research-space design-system scope");
if (!css.includes("var(--v-brand)"))
  throw new Error("Research space must reuse the current blue brand token");
if (!css.includes("--rs-accent: #0969f6"))
  throw new Error("Research-space blue reference accent is missing");
if (css.includes("--rs-accent: #c8102e"))
  throw new Error("Legacy dark-red research-space accent remains");
if (source.includes("chooseCreate("))
  throw new Error("Create dropdown items must not navigate or open creation flows");

const navigation = readFileSync("src/components/v1/navigation.ts", "utf8");
if (navigation.includes('name: "科研资产"'))
  throw new Error("Legacy first-level research asset navigation remains");
if (navigation.includes('name: "项目空间管理"'))
  throw new Error("Legacy first-level project-space navigation remains");

console.log("Research-space structure checks passed");
