import { readFileSync } from "node:fs";

const component = readFileSync("src/components/v1/workspace.tsx", "utf8");
const css = readFileSync("src/components/v1/v1.css", "utf8");
const homeCss = readFileSync("src/components/v1/workspace-home.css", "utf8");
const combinedCss = `${css}\n${homeCss}`;
const normalizedComponent = component.replace(/\s+/g, " ");

for (const marker of [
  "v-workbench-dashboard",
  "v-workbench-examples",
  "v-workbench-metrics",
  "v-workbench-recommendations",
  "v-workbench-activity",
  "v-workbench-output-summary",
  "参与科研项目",
  "参与课题",
  "进行中任务",
  "最近科研产出",
  "科研资讯",
  "实验结果异动提醒",
  "实验 GB-2026-0915 的催化活性数据均值下降 35%，建议检查反应温度控制系统。",
  "VASP 电子结构计算（任务 #1024）已完成，共生成 12 个结果文件。",
  "课题《CO₂ 加氢制甲醇催化剂研究》下一节点（中期评审材料）3 天后到期。",
  "实验数据已同步",
  "实验 GB-2026-0915 数据已同步至 ELN",
  "GROMACS 分子动力学模拟（任务 #1025）",
  "《Nature Catalysis》最新文献已收录",
  "高效催化剂配方优化",
  "分子模拟计算 (7/12)",
  "CO₂驱油机理文献综述",
  "页岩油燃烧实验方案设计",
  "研究报告",
  "近一年科研产出趋势",
  "v-workbench-example-row",
  "梳理当前课题的关键技术路线",
  "分析实验数据中的关键影响因素",
  "生成下一轮对比实验方案",
]) {
  if (!component.includes(marker)) {
    throw new Error(`Workbench home is missing component marker: ${marker}`);
  }
}

for (const marker of [
  "计算任务已完成",
  "相关文献推荐",
  "课题里程碑即将到期",
  "智能体建议：优化实验方案",
  "今天 09:20",
  "今天 08:50",
  "今天 08:30",
  "昨天 18:40",
  "昨天 16:20",
  "计算任务开始运行",
  "新文献已加入知识库",
  "课题进展更新",
  "实验预约成功",
  "《功能性 PE 配方优化》已更新周报",
  "预约 9 月 17 日 10:00–12:00 普通仪器",
  "催化剂优化课题",
  "提高采收率课题",
  "非常规油气开发课题",
  'name: "研究报告", count: 10, percentage: 38',
  'name: "数据集", count: 6, percentage: 23',
  'name: "图表", count: 6, percentage: 23',
  'name: "模型", count: 4, percentage: 15',
  'name: "其他", count: 0, percentage: 4',
  '{ month: "11月", value: 1 }',
  '{ month: "12月", value: 2 }',
  '{ month: "1月", value: 1 }',
  '{ month: "2月", value: 3 }',
  '{ month: "3月", value: 2 }',
  '{ month: "4月", value: 2 }',
  '{ month: "5月", value: 1 }',
  '{ month: "6月", value: 3 }',
  '{ month: "7月", value: 2 }',
  '{ month: "8月", value: 3 }',
  '{ month: "9月", value: 2 }',
  '{ month: "10月", value: 4 }',
]) {
  if (!normalizedComponent.includes(marker)) {
    throw new Error(`Workbench reference data changed or is missing: ${marker}`);
  }
}

for (const marker of [
  ".v-workspace.home-dashboard",
  ".v-workbench-dashboard",
  ".v-workbench-examples",
  ".v-workbench-metrics",
  ".v-workbench-dual-grid",
  ".v-workbench-output-summary",
  ".v-workbench-recommendations.reference-panel",
  ".v-workbench-activity.reference-panel",
  ".v-reference-task-table",
  ".v-reference-output-layout",
]) {
  if (!combinedCss.includes(marker)) {
    throw new Error(`Workbench home is missing CSS marker: ${marker}`);
  }
}

if (!component.includes('view === "home"')) {
  throw new Error("Workbench home must remain isolated from focused conversations");
}

console.log("Workbench home structure checks passed");
