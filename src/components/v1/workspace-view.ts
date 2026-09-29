import type { Artifact, Project, Session, Space, State, Task } from "./types";

export const DEFAULT_WORKBENCH_MODEL = "deepseekV4Pro";

export type AssistantLaunchMode = "读" | "算" | "做";

export function toggleAssistantLaunchMode(
  current: AssistantLaunchMode | "",
  next: AssistantLaunchMode,
): AssistantLaunchMode | "" {
  return current === next ? "" : next;
}

export interface WorkbenchRecommendation {
  id: string;
  kind: "decision" | "task" | "knowledge";
  category: "仅需知悉" | "需要决策" | "建议操作";
  title: string;
  description: string;
  time: string;
  action: string;
  targetId: string;
}

export interface WorkbenchActivity {
  id: string;
  category: "项目动态" | "实验动态" | "计算动态" | "成果动态";
  title: string;
  description: string;
  time: string;
  status: string;
  targetId: string;
}

export interface WorkbenchFrontierItem {
  id: string;
  type: "文献" | "专利" | "标准" | "科研资讯";
  discipline: string;
  name: string;
  organization: string;
  date: string;
  description: string;
}

export interface ResearchAssistantStage {
  id: string;
  label: string;
  status: "completed" | "running" | "pending" | "replaced";
  summary: string;
  events: {
    id: string;
    kind: "dispatch" | "agent" | "tool" | "result";
    title: string;
    detail: string;
    status: "completed" | "running" | "pending";
  }[];
}

export interface ResearchAssistantOutput {
  id: string;
  name: string;
  type: "报告" | "数据" | "图表" | "文件";
  version: string;
  status: "草稿" | "生成中" | "待确认" | "已确认" | "已发布" | "已废弃";
  source: string;
  references: string;
  core: boolean;
  artifactId?: string;
}

const frontierMocks: WorkbenchFrontierItem[] = [
  {
    id: "frontier-elastomer-design",
    type: "文献",
    discipline: "材料科学",
    name: "高性能弹性体结构设计的新方法",
    organization: "Nature Materials",
    date: "2026-09-22",
    description: "研究不同微观结构参数对耐磨、滚阻和湿滑性能的协同影响。",
  },
  {
    id: "frontier-sbr-patent",
    type: "专利",
    discipline: "化学化工",
    name: "一种高性能丁苯橡胶材料及其制备方法",
    organization: "国家知识产权局",
    date: "2026-09-21",
    description: "公开低滚阻丁苯橡胶配方、聚合工艺与关键性能指标。",
  },
  {
    id: "frontier-tire-standard",
    type: "标准",
    discipline: "材料科学",
    name: "新能源汽车轮胎性能测试技术规范",
    organization: "全国轮胎轮辋标准化技术委员会",
    date: "2026-09-20",
    description: "规定滚动阻力、湿地抓着与耐久性能的测试条件和评价方法。",
  },
  {
    id: "frontier-protein-news",
    type: "科研资讯",
    discipline: "合成生物",
    name: "生成式 AI 加速工业酶定向进化",
    organization: "合成生物产业观察",
    date: "2026-09-19",
    description: "多家研究团队发布蛋白质生成模型与自动化实验闭环的新进展。",
  },
  {
    id: "frontier-digital-core",
    type: "文献",
    discipline: "地球科学",
    name: "多尺度数字岩心驱动的储层渗流模拟",
    organization: "Journal of Petroleum Science",
    date: "2026-09-18",
    description: "融合微米 CT 与孔隙网络模型提升非常规储层预测精度。",
  },
  {
    id: "frontier-enzyme-patent",
    type: "专利",
    discipline: "合成生物",
    name: "耐高温聚酯降解酶及其突变体",
    organization: "欧洲专利局",
    date: "2026-09-17",
    description: "涉及 PET 降解酶关键位点、表达载体与工业应用方法。",
  },
];

export function buildWorkbenchHome(
  state: State,
  spaceId: string,
  profileId: string,
) {
  const spaceTasks = state.tasks.filter(
    (task) => task.spaceId === spaceId && task.status !== "CANCELLED",
  );
  const pendingDecisions = state.decisions.filter(
    (decision) =>
      decision.assignee === profileId &&
      decision.status === "pending" &&
      spaceTasks.some((task) => task.id === decision.taskId),
  );
  const decisionId = pendingDecisions[0]?.id ?? "decision-plan";
  const primaryTaskId = spaceTasks[0]?.id ?? "task-shale";
  const secondaryTaskId = spaceTasks[1]?.id ?? primaryTaskId;
  const knowledgeId = state.knowledge[0]?.id ?? "k-paper";
  const experimentId = state.experiments.find((item) => item.spaceId === spaceId)?.id ?? "experiment-seed";
  const artifactId = state.artifacts.find((item) => item.spaceId === spaceId)?.id ?? "artifact-shale";

  const recommendations: WorkbenchRecommendation[] = [
    { id: "mock-experiment-alert", kind: "decision", category: "需要决策", title: "实验结果异动提醒", description: "实验 GB-2026-0915 的催化活性数据均值下降 35%，建议检查反应温度控制系统。", time: "今天 09:20", action: "查看详情", targetId: decisionId },
    { id: "mock-compute-complete", kind: "task", category: "仅需知悉", title: "计算任务已完成", description: "VASP 电子结构计算（任务 #1024）已完成，共生成 12 个结果文件。", time: "今天 08:50", action: "查看结果", targetId: primaryTaskId },
    { id: "mock-literature", kind: "knowledge", category: "仅需知悉", title: "相关文献推荐", description: "基于你的研究方向，发现 5 篇高度相关文献，已加入「待读」列表。", time: "今天 08:30", action: "查看文献", targetId: knowledgeId },
    { id: "mock-milestone", kind: "decision", category: "需要决策", title: "课题里程碑即将到期", description: "课题《CO₂ 加氢制甲醇催化剂研究》下一节点（中期评审材料）3 天后到期。", time: "昨天 18:40", action: "去处理", targetId: decisionId },
    { id: "mock-agent-suggestion", kind: "task", category: "建议操作", title: "智能体建议：优化实验方案", description: "基于历史数据分析，建议将反应温度从 200 ℃ 调整至 220 ℃，预计可提升转化率 12%。", time: "昨天 16:20", action: "查看建议", targetId: secondaryTaskId },
  ];

  const activities: WorkbenchActivity[] = [
    { id: "mock-data-sync", category: "项目动态", title: "实验数据已同步", description: "实验 GB-2026-0915 数据已同步至 ELN", time: "10:30", status: "成功", targetId: experimentId },
    { id: "mock-compute-start", category: "计算动态", title: "计算任务开始运行", description: "GROMACS 分子动力学模拟（任务 #1025）", time: "09:41", status: "运行中", targetId: primaryTaskId },
    { id: "mock-knowledge-added", category: "项目动态", title: "新文献已加入知识库", description: "《Nature Catalysis》最新文献已收录", time: "09:15", status: "成功", targetId: knowledgeId },
    { id: "mock-project-update", category: "项目动态", title: "课题进展更新", description: "《功能性 PE 配方优化》已更新周报", time: "昨天 18:20", status: "更新", targetId: secondaryTaskId },
    { id: "mock-reservation", category: "实验动态", title: "实验预约成功", description: "预约 9 月 17 日 10:00–12:00 普通仪器", time: "昨天 16:05", status: "成功", targetId: artifactId },
  ];

  const frontierTypes = ["文献", "专利", "标准"] as const;
  const sourceFrontier: WorkbenchFrontierItem[] = frontierTypes.flatMap((type) => {
    const item = state.knowledge.find(
      (knowledge) =>
        knowledge.type === type &&
        (knowledge.spaceId === spaceId || knowledge.visibility === "PUBLIC"),
    );
    return item
      ? [{
          id: item.id,
          type,
          discipline: item.discipline,
          name: item.name,
          organization: item.organization,
          date: item.date,
          description: item.description,
        }]
      : [];
  });
  const frontier = [...sourceFrontier, ...frontierMocks];

  return {
    recommendations,
    activities,
    recentTasks: spaceTasks.slice(0, 3),
    recentArtifacts: state.artifacts
      .filter((item) => item.spaceId === spaceId)
      .slice(0, 4),
    frontier,
  };
}

export function buildResearchAssistantView(
  state: State,
  task: Task,
  session?: Session,
) {
  const taskArtifacts = state.artifacts.filter(
    (artifact) =>
      artifact.taskId === task.id ||
      (!!session && artifact.sessionId === session.id),
  );
  const firstArtifact = taskArtifacts[0];
  const stageEvents = (
    stageId: string,
    dispatch: string,
    agent: string,
    tool: string,
    result: string,
    running = false,
  ): ResearchAssistantStage["events"] => {
    const agents = agent.split(/\s*(?:→|、)\s*/).filter(Boolean);
    const tools = tool.split(/\s*(?:→|、)\s*/).filter(Boolean);
    return [
      { id: `${stageId}-dispatch`, kind: "dispatch", title: "Research Supervisor", detail: `派发任务：${dispatch}`, status: "completed" },
      ...agents.map((name, index) => ({
        id: `${stageId}-agent-${index}`,
        kind: "agent" as const,
        title: name,
        detail: `接收阶段任务，输入为上一步证据与当前约束；已返回可供后续工具使用的结构化中间结果。`,
        status: "completed" as const,
      })),
      ...tools.map((name, index) => ({
        id: `${stageId}-tool-${index}`,
        kind: "tool" as const,
        title: name,
        detail: `调用输入：阶段上下文与 Agent 中间结果；调用输出：已写入本阶段执行轨迹。`,
        status: (running && index === tools.length - 1 ? "running" : "completed") as "running" | "completed",
      })),
      { id: `${stageId}-result`, kind: "result", title: "阶段结果", detail: result, status: running ? "pending" : "completed" },
    ];
  };
  const result = (
    planVersion: string,
    updatedAt: string,
    stages: ResearchAssistantStage[],
    changes: string[],
    outputs: ResearchAssistantOutput[],
  ) => ({
    planVersion,
    updatedAt,
    stages,
    changes,
    outputFilters: ["全部", "报告", "数据", "图表", "文件"] as const,
    outputs,
  });

  if (task.id === "task-read") {
    const stages: ResearchAssistantStage[] = [
      { id: "read-plan", label: "检索规划", status: "completed", summary: "明确近五年范围、资源类型和证据标准", events: stageEvents("read-plan", "拆分论文、专利、标准三条并行检索链", "检索规划 Agent", "检索式生成器、术语扩展工具", "形成 8 组检索式和纳排标准") },
      { id: "read-search", label: "跨库检索", status: "completed", summary: "完成论文、专利和标准的多源检索", events: stageEvents("read-search", "并行执行三类资源检索", "文献检索 Agent、专利分析 Agent、标准对标 Agent", "知识中心、专利库、标准库", "论文 126 篇、专利 43 项、标准 4 项") },
      { id: "read-evidence", label: "证据筛选", status: "completed", summary: "去重、相关性排序并抽取关键证据", events: stageEvents("read-evidence", "按证据强度和研究相关性复核结果", "证据抽取 Agent、质量复核 Agent", "去重工具、全文解析、证据卡生成", "保留 26 篇论文和 8 项核心专利") },
      { id: "read-gap", label: "研究空白", status: "completed", summary: "形成可验证的研究空白和后续假设", events: stageEvents("read-gap", "聚合性能指标、冲突证据和未覆盖条件", "研究空白分析 Agent", "主题聚类、证据冲突检查", "识别 3 个研究空白和 2 个可验证假设") },
      { id: "read-output", label: "产出整理", status: "completed", summary: "生成调研报告、证据表和引用清单", events: stageEvents("read-output", "对阶段结果进行版本化和引用校验", "科研写作 Agent、成果整理 Agent", "报告生成器、引用校验工具", "调研报告 V2.0 已确认") },
    ];
    return result("V3", "09:36", stages, ["09:26 增加标准对标", "09:18 检索式 V1 → V2"], [
      { id: "read-report", name: "研究空白分析报告", type: "报告", version: "V2.0", status: "已确认", source: "研究空白阶段", references: "26篇论文 / 8项专利 / 4项标准", core: true },
      { id: "read-evidence-table", name: "论文证据表", type: "数据", version: "V1.2", status: "已确认", source: "证据筛选阶段", references: "26篇论文", core: false },
      { id: "read-patent-table", name: "专利与标准对标表", type: "数据", version: "V1.0", status: "已确认", source: "跨库检索阶段", references: "8项专利 / 4项标准", core: false },
      { id: "read-list", name: "文献检索清单", type: "文件", version: "V1.0", status: "已发布", source: "跨库检索阶段", references: "126条初检记录", core: false },
      { id: "read-map", name: "技术主题分布图", type: "图表", version: "V1.0", status: "待确认", source: "研究空白阶段", references: "主题聚类结果", core: false },
    ]);
  }

  if (task.id === "task-calculate") {
    const stages: ResearchAssistantStage[] = [
      { id: "calc-quality", label: "数据检查", status: "completed", summary: "完成历史配方的质量审计与异常隔离", events: stageEvents("calc-quality", "检查完整性、单位和异常值", "数据质量 Agent", "Python 数据检查、单位转换工具", "48 组配方中隔离 3 条缺失和 2 条异常记录") },
      { id: "calc-constraint", label: "变量约束", status: "completed", summary: "建立配方变量范围和多目标约束", events: stageEvents("calc-constraint", "将 6 项性能指标转化为计算约束", "配方建模 Agent", "约束建模器、变量相关性分析", "形成 11 个变量和 6 项目标约束") },
      { id: "calc-v1", label: "计算 V1", status: "completed", summary: "V1 因偶联剂范围冲突被替代", events: stageEvents("calc-v1", "运行首轮代理模型和候选生成", "计算任务 Agent", "代理模型、约束求解器", "生成 8 组候选，发现 2 组约束冲突") },
      { id: "calc-v2", label: "优化 V2", status: "running", summary: "贝叶斯优化正在计算第二轮候选配方", events: stageEvents("calc-v2", "修正约束后执行多目标优化", "参数优化 Agent", "贝叶斯优化、敏感性分析", "当前进度 72%，预计生成 12 组候选", true) },
      { id: "calc-validate", label: "候选验证", status: "pending", summary: "等待 V2 完成后筛选三组优先配方", events: stageEvents("calc-validate", "等待优化结果", "结果验证 Agent", "规则校验、历史相似实验比对", "待执行", true).map((event) => ({ ...event, status: "pending" as const })) },
    ];
    return result("V2", "10:42", stages, ["10:22 V1 因约束冲突被替代", "10:08 隔离异常数据"], [
      { id: "calc-quality-report", name: "数据质量检查报告", type: "报告", version: "V1.0", status: "已确认", source: "数据检查阶段", references: "48组历史配方", core: false },
      { id: "calc-constraint-table", name: "配方参数约束表", type: "数据", version: "V2.0", status: "已确认", source: "变量约束阶段", references: "6项核心指标", core: true },
      { id: "calc-candidates", name: "候选配方计算结果", type: "数据", version: "V2", status: "生成中", source: "优化 V2 阶段", references: "贝叶斯优化任务 #1025", core: false },
      { id: "calc-sensitivity", name: "参数敏感性分析", type: "图表", version: "V1.0", status: "生成中", source: "优化 V2 阶段", references: "代理模型输出", core: false },
      { id: "calc-recommendation", name: "推荐配方 V2", type: "报告", version: "草稿", status: "草稿", source: "候选验证阶段", references: "待生成", core: false },
    ]);
  }

  if (task.id === "task-experiment") {
    const completed = task.status === "COMPLETED";
    const confirmed = task.status !== "WAITING_HUMAN" || state.decisions.some(
      (item) => item.taskId === task.id && item.status === "decided",
    );
    const stages: ResearchAssistantStage[] = [
      { id: "exp-input", label: "方案输入", status: "completed", summary: "读取两组推荐配方和验证目标", events: stageEvents("exp-input", "核对配方版本、实验目标和本周完成约束", "实验任务解析 Agent", "科研资产、配方参数表", "确认两组配方与 4 项验收指标") },
      { id: "exp-doe", label: "DOE 设计", status: "completed", summary: "生成温度、时间和硫化条件实验矩阵", events: stageEvents("exp-doe", "构建两组配方的对照实验", "实验设计 Agent、DOE Agent", "DOE 设计工具、实验模板", "生成 8 个实验批次和随机化执行顺序") },
      { id: "exp-resource", label: "资源检查", status: confirmed ? "completed" : "running", summary: confirmed ? "已确认替代时段，仪器、人员、材料和安全条件均满足" : "发现仪器时段冲突，等待用户选择替代时段", events: stageEvents("exp-resource", "并行检查仪器、人员、材料和安全条件", "仪器资源 Agent、耗材 Agent、安全 Agent", "预约系统、库存系统、安全规则库", confirmed ? "用户已确认两个替代时段，资源检查完成" : "两个替代时段可用，需要人工确认", !confirmed) },
      { id: "exp-output", label: "方案生成", status: completed ? "completed" : confirmed ? "running" : "pending", summary: completed ? "实验方案、SOP 和 ELN 记录模板已生成" : confirmed ? "正在生成实验方案、SOP 和 ELN 记录模板" : "确认时段后生成实验方案、SOP 和记录模板", events: completed ? stageEvents("exp-output", "按已确认时段生成执行文件", "SOP 生成 Agent、成果整理 Agent", "SOP 模板、ELN 记录模板", "实验方案 V2、SOP 与 ELN 模板已完成") : confirmed ? stageEvents("exp-output", "按已确认时段生成执行文件", "SOP 生成 Agent、成果整理 Agent", "SOP 模板、ELN 记录模板", "实验方案 V2 已确认，SOP 与记录模板生成中", true) : stageEvents("exp-output", "等待人工确认", "SOP 生成 Agent、成果整理 Agent", "SOP 模板、ELN 记录模板", "待执行", true).map((event) => ({ ...event, status: "pending" as const })) },
    ];
    return result("V2", confirmed ? "11:24" : "11:20", stages, confirmed ? ["11:24 用户确认替代时段", "11:16 原定仪器时段冲突", "11:08 DOE 参数 V1 → V2"] : ["11:16 原定仪器时段冲突", "11:08 DOE 参数 V1 → V2"], [
      { id: "exp-plan", name: "实验验证方案 V2", type: "报告", version: "V2.0", status: confirmed ? "已确认" : "待确认", source: "DOE 设计阶段", references: "推荐配方 V2", core: true },
      { id: "exp-doe-table", name: "DOE 实验参数表", type: "数据", version: "V2.0", status: "已确认", source: "DOE 设计阶段", references: "8个实验批次", core: false },
      { id: "exp-sop", name: "实验标准操作规程 SOP", type: "文件", version: confirmed ? "V1.0" : "草稿", status: completed ? "已确认" : confirmed ? "生成中" : "草稿", source: "方案生成阶段", references: confirmed ? "已确认时段" : "待确认时段", core: false },
      { id: "exp-materials", name: "试剂耗材清单", type: "数据", version: "V1.0", status: "已确认", source: "资源检查阶段", references: "库存系统", core: false },
      { id: "exp-eln", name: "ELN 实验记录模板", type: "文件", version: "V1.0", status: completed ? "已确认" : "生成中", source: "方案生成阶段", references: "ELN 模板库", core: false },
    ]);
  }
  const stages: ResearchAssistantStage[] = [
    {
      id: "research",
      label: "文献调研",
      status: "completed",
      summary: "完成跨库检索与证据筛选，形成可追溯调研集",
      events: stageEvents(
        "research",
        "并行检索近五年论文、专利和测试标准",
        "文献检索 Agent、专利分析 Agent、标准对标 Agent",
        "知识中心智能检索 → 专利库 → 标准库",
        "文献 126 → 26篇；专利 43 → 8项；标准 4项",
      ),
    },
    {
      id: "metrics",
      label: "指标分析",
      status: "completed",
      summary: "从证据中提取核心指标并识别研究空白",
      events: stageEvents(
        "metrics",
        "综合论文、专利与标准证据，统一指标口径",
        "证据综合 Agent、研究空白分析 Agent",
        "指标抽取 → 证据聚合 → 冲突检查",
        "提取 12 项指标，确认 6 项核心指标与 3 个研究空白",
      ),
    },
    {
      id: "simulation",
      label: "计算模拟",
      status: task.status === "COMPLETED" ? "completed" : "running",
      summary: "基于历史数据运行配方参数优化 V2",
      events: stageEvents(
        "simulation",
        "检查 48 组历史配方并按 6 项核心指标建立约束",
        "数据质量 Agent → 配方建模 Agent → 参数优化 Agent",
        "Python 分析环境 → 约束求解器 → 贝叶斯优化模型",
        "V1 因约束冲突被替代；V2 运行至 72%",
        task.status !== "COMPLETED",
      ),
    },
    {
      id: "design",
      label: "方案设计",
      status: "pending",
      summary: "等待候选配方确认后生成实验验证方案",
      events: stageEvents(
        "design",
        "等待用户确认两组候选配方",
        "实验设计 Agent、DOE Agent、安全检查 Agent",
        "实验模板 → 设备目录 → 耗材库存 → ELN 模板",
        "预期形成实验方案、SOP、耗材清单与验收模板",
        true,
      ).map((event) => ({ ...event, status: "pending" as const })),
    },
  ];
  const outputs: ResearchAssistantOutput[] = [
    {
      id: "output-core-report",
      name: "核心性能指标汇总",
      type: "报告",
      version: "V2.0",
      status: "已确认",
      source: "指标分析阶段",
      references: "26篇论文 / 4项标准",
      core: true,
      artifactId: firstArtifact?.id,
    },
    {
      id: "output-metrics-table",
      name: "性能指标对比表",
      type: "数据",
      version: "V1.2",
      status: "已确认",
      source: "指标分析阶段",
      references: "12项候选指标",
      core: false,
    },
    {
      id: "output-literature-list",
      name: "新能源轮胎论文清单",
      type: "文件",
      version: "26篇",
      status: "已确认",
      source: "前期调研阶段",
      references: "文献检索结果",
      core: false,
    },
    {
      id: "output-simulation-v2",
      name: "分子模拟结果 V2",
      type: "数据",
      version: "V2",
      status: "生成中",
      source: "计算模拟阶段",
      references: "Simulation-v2",
      core: false,
    },
    {
      id: "output-energy-chart",
      name: "能量变化曲线",
      type: "图表",
      version: "V2",
      status: "待确认",
      source: "计算模拟阶段",
      references: "模拟轨迹数据",
      core: false,
    },
    {
      id: "output-formula-draft",
      name: "配方设计建议",
      type: "报告",
      version: "草稿",
      status: "草稿",
      source: "方案设计阶段",
      references: "6项核心指标",
      core: false,
    },
  ];

  return {
    planVersion: "V4",
    updatedAt: "10:42",
    stages,
    changes: ["10:42 新增专利分析", "10:18 模拟参数 V1 → V2"],
    outputFilters: ["全部", "报告", "数据", "图表", "文件"] as const,
    outputs,
  };
}

export interface ResearchSpaceGroup {
  project: Project;
  projectSpace?: Space;
  topics: Space[];
}

export function groupResearchSpaces(spaces: Space[], projects: Project[]) {
  const personal = spaces.filter((space) => space.type === "PERSONAL");
  const projectSpaces = spaces.filter((space) => space.type === "PROJECT");
  const topics = spaces.filter((space) => space.type === "TOPIC");
  const projectIds = new Set(
    [...projectSpaces, ...topics].map((space) => space.projectId),
  );

  return {
    personal,
    projects: projects
      .filter((project) => projectIds.has(project.id))
      .map((project) => ({
        project,
        projectSpace: projectSpaces.find(
          (space) => space.projectId === project.id,
        ),
        topics: topics.filter((space) => space.projectId === project.id),
      })),
  };
}

export function collectChatFiles(
  artifacts: Artifact[],
  task?: Task,
  session?: Session,
  canReadReference: (id: string) => boolean = () => true,
) {
  const outputs = artifacts.filter((artifact) =>
    task
      ? artifact.taskId === task.id
      : !!session && artifact.sessionId === session.id,
  );
  const referenceIds = [
    ...(session?.contextIds ?? []),
    ...(task?.contextIds ?? []),
    ...outputs.flatMap((artifact) => artifact.references),
  ].filter(
    (id, index, values) =>
      values.indexOf(id) === index && canReadReference(id),
  );

  return { outputs, referenceIds };
}

export function resolveWorkspaceSession(
  sessions: Session[],
  requestedSessionId: string | null,
  task?: Task,
) {
  if (requestedSessionId) {
    const requested = sessions.find(
      (session) =>
        session.id === requestedSessionId &&
        (!task || task.sessionIds.includes(session.id)),
    );
    if (requested) return requested;
  }
  return task
    ? sessions.find((session) => task.sessionIds.includes(session.id))
    : undefined;
}

export function isSpaceSwitchable(space: Space) {
  return space.status === "ACTIVE";
}
