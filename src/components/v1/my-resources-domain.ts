export const personalResourceTypes = ["科研应用", "智能体", "Skill", "模型", "工具", "数据集", "知识", "实验设施", "工作流"] as const;
export type PersonalResourceType = (typeof personalResourceTypes)[number];
export type ResourceRelation = "可用资源" | "我创建的" | "我的收藏" | "我的申请";
export type CreationStatus = "草稿" | "审核中" | "已发布" | "已驳回";
export type ApplicationStatus = "审批中" | "已通过" | "已驳回" | "已过期";

export interface PersonalResource {
  id: string;
  name: string;
  type: PersonalResourceType;
  description: string;
  scope: string;
  version: string;
  updatedAt: string;
  access: "available" | "request";
  tags: string[];
  creationStatus?: CreationStatus;
  application?: { status: ApplicationStatus; appliedAt: string; reason: string; userId: string };
  ownerId?: string;
}

type SeedRow = readonly [
  id: string, type: PersonalResourceType, name: string, description: string,
  scope: string, version: string, updatedAt: string, access: PersonalResource["access"],
  creationStatus?: CreationStatus, applicationStatus?: ApplicationStatus, tags?: string,
];

const rows: SeedRow[] = [
  ["r-app-rubber", "科研应用", "橡胶配方优化应用", "面向橡胶新材料的配方设计、性能预测与实验方案生成的组合应用。", "配方优化课题", "V1.6", "2026-09-30", "available", "已发布", undefined, "配方设计,性能预测"],
  ["r-agent-formula", "智能体", "配方优化科研智能体", "基于文献、数据和权限的配方优化智能体，支持任务拆解与证据追溯。", "配方优化课题", "V1.3", "2026-09-28", "available", undefined, "已通过", "智能问答,实验方案"],
  ["r-model-polymer", "模型", "高分子性能预测模型", "预测湿抓、滚阻和耐磨性能，包含适用域和版本说明。", "高性能合成橡胶", "V2.4", "2026-09-25", "available", undefined, "已通过", "性能预测,模型"],
  ["r-data-rubber", "数据集", "橡胶配方—性能数据集", "2,860 组配方及实验性能数据，含版本血缘和质量报告。", "合成生物橡胶课题", "V3.1", "2026-09-20", "available", "已发布", undefined, "实验数据,配方"],
  ["r-tool-molecule", "工具", "分子模拟科研软件", "集成分子动力学、机器学习势函数与常用结果分析工具。", "个人空间", "V1.0", "2026-09-18", "available", undefined, "已通过", "分子动力学,分析"],
  ["r-knowledge-tire", "知识", "轮胎材料专题知识库", "覆盖弹性体、填料、偶联剂与性能评价标准的专题资料。", "集团共享", "V2.1", "2026-09-16", "available", undefined, undefined, "轮胎材料,标准"],
  ["r-skill-literature", "Skill", "文献证据分析 Skill", "抽取研究问题、实验条件与证据链，供科研任务引用。", "集团共享", "V1.2", "2026-09-15", "available", undefined, undefined, "文献,证据"],
  ["r-workflow-evidence", "工作流", "科研证据判断模板", "串联业务目标、科学问题、证据整理和成果输出。", "集团共享", "V1.6", "2026-09-12", "available", "已发布", undefined, "证据,工作流"],
  ["r-facility-catalyst", "实验设施", "高通量催化剂评价装置", "支持候选催化剂并行评价，并记录实验条件和结果。", "催化材料课题", "V1.0", "2026-09-10", "request", undefined, "审批中", "催化剂,实验"],
  ["r-app-carbon", "科研应用", "碳捕集方案评估应用", "比较吸附材料、工艺参数及能耗结果。", "CCUS课题", "V2.0", "2026-09-08", "available", undefined, undefined, "碳捕集,工艺"],
  ["r-agent-reservoir", "智能体", "储层评价研究助手", "根据测井、地质报告和历史成果生成可追溯分析线索。", "页岩气储层评价", "V1.4", "2026-09-06", "available", "已发布", undefined, "储层,智能体"],
  ["r-skill-geology", "Skill", "储层证据抽取 Skill", "从地质报告、测井解释与历史成果中抽取结构化证据。", "页岩气储层评价", "V1.3", "2026-09-04", "available", undefined, undefined, "地质,证据"],
  ["r-model-catalyst", "模型", "催化活性预测模型", "结合组成和结构描述符预测催化剂活性区间。", "催化材料课题", "V1.9", "2026-09-02", "available", undefined, "已通过", "催化,预测"],
  ["r-data-polymer", "数据集", "聚合物结构表征数据集", "汇总谱图、分子量分布和性能测试结果。", "高性能合成橡胶", "V1.5", "2026-08-31", "available", undefined, undefined, "表征,数据"],
  ["r-tool-spectrum", "工具", "谱图智能解析工具", "辅助解析红外与核磁谱图，提供峰位标注。", "集团共享", "V2.2", "2026-08-28", "available", undefined, undefined, "谱图,解析"],
  ["r-knowledge-catalyst", "知识", "催化材料专题知识库", "整理催化剂制备、表征与评价的内部资料。", "催化材料课题", "V1.1", "2026-08-25", "available", "已发布", undefined, "催化,知识"],
  ["r-facility-microscope", "实验设施", "原位电子显微镜", "查看设备能力、预约要求及可用实验时段。", "材料表征平台", "V1.0", "2026-08-23", "available", undefined, "已通过", "显微,表征"],
  ["r-workflow-literature", "工作流", "文献综述协作流程", "从文献筛选到证据核验和团队评审的协作模板。", "个人空间", "V1.1", "2026-08-21", "request", "草稿", undefined, "文献,协作"],
  ["r-agent-paper", "智能体", "论文研读智能体", "提取论文方法、实验变量及结论边界。", "个人空间", "V0.8", "2026-08-18", "request", undefined, "审批中", "论文,研读"],
  ["r-model-oil", "模型", "油藏产能预测模型", "结合历史生产曲线和地质参数进行情景预测。", "油气开发课题", "V3.0", "2026-08-15", "request", undefined, "已驳回", "油藏,预测"],
  ["r-data-core", "数据集", "岩心实验数据集", "沉淀岩心孔渗、饱和度及压裂实验结果。", "页岩气储层评价", "V2.0", "2026-08-12", "request", undefined, "已过期", "岩心,实验"],
  ["r-app-experiment", "科研应用", "实验设计协同应用", "管理实验假设、变量设置和结果复盘。", "个人空间", "V0.9", "2026-08-10", "request", "审核中", undefined, "实验设计,协同"],
  ["r-skill-report", "Skill", "科研报告校核 Skill", "检查报告中的术语一致性和证据引用。", "个人空间", "V0.3", "2026-08-08", "request", "草稿", undefined, "报告,校核"],
  ["r-knowledge-carbon", "知识", "CCUS技术资料库", "收集碳捕集、利用与封存相关项目资料。", "CCUS课题", "V1.0", "2026-08-05", "available", undefined, "已通过", "CCUS,知识"],
  ["r-tool-simulation", "工具", "反应过程仿真工具", "对反应条件和产率进行可视化仿真。", "催化材料课题", "V1.7", "2026-08-02", "available", undefined, undefined, "仿真,反应"],
  ["r-facility-reactor", "实验设施", "微型反应器实验台", "支持小批量反应条件验证和数据记录。", "催化材料课题", "V1.0", "2026-07-30", "request", undefined, "审批中", "反应器,实验"],
  ["r-workflow-formula", "工作流", "配方实验闭环流程", "从候选配方生成到实验反馈和模型更新的标准流程。", "配方优化课题", "V1.2", "2026-07-28", "available", "已发布", undefined, "配方,实验"],
  ["r-data-carbon", "数据集", "碳吸附材料测试数据集", "包含等温吸附、循环稳定性及条件记录。", "CCUS课题", "V2.3", "2026-07-24", "available", undefined, "已通过", "碳吸附,测试"],
];

export const personalResourceSeed: PersonalResource[] = rows.map((row) => ({
  id: row[0], type: row[1], name: row[2], description: row[3], scope: row[4],
  version: row[5], updatedAt: row[6], access: row[7],
  ...(row[8] ? { creationStatus: row[8], ownerId: "lin" } : {}),
  ...(row[9] ? { application: { status: row[9], appliedAt: row[6], reason: row[9] === "已驳回" ? "当前课题不在授权范围内" : "科研任务使用", userId: "lin" } } : {}),
  tags: row[10]?.split(",") ?? [],
}));

export const initialFavoriteIds = ["r-app-rubber", "r-model-polymer", "r-tool-molecule", "r-knowledge-tire", "r-skill-geology", "r-workflow-evidence", "r-data-polymer", "r-agent-reservoir", "r-app-carbon", "r-knowledge-catalyst"];

export function personalizeResources(resources: PersonalResource[], profileId: string): PersonalResource[] {
  return resources.flatMap((item) => {
    if (item.ownerId && item.ownerId !== profileId && item.creationStatus && item.creationStatus !== "已发布") return [];
    return [{
      ...item,
      creationStatus: item.ownerId === profileId ? item.creationStatus : undefined,
      application: item.application?.userId === profileId ? item.application : undefined,
    }];
  });
}

export function canSaveResourceForProfile(profileId: string, hydratedProfileId: string, resource: PersonalResource): boolean {
  return profileId === hydratedProfileId && (!resource.creationStatus || resource.ownerId === profileId);
}

export interface ResourceFilters {
  relation: ResourceRelation;
  type: PersonalResourceType | "全部";
  query: string;
  scope: string;
  status: string;
}

export function statusForRelation(item: PersonalResource, relation: ResourceRelation) {
  if (relation === "我创建的") return item.creationStatus ?? "—";
  if (relation === "我的申请") return item.application?.status ?? "—";
  return item.access === "available" ? "可使用" : item.application?.status ?? "需申请";
}

export function filterPersonalResources(resources: PersonalResource[], favorites: ReadonlySet<string>, filters: ResourceFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return resources.filter((item) => {
    const inRelation = filters.relation === "可用资源" ? item.access === "available"
      : filters.relation === "我创建的" ? Boolean(item.creationStatus)
      : filters.relation === "我的收藏" ? favorites.has(item.id)
      : Boolean(item.application);
    return inRelation
      && (filters.type === "全部" || item.type === filters.type)
      && (filters.scope === "全部空间" || item.scope === filters.scope)
      && (filters.status === "全部状态" || statusForRelation(item, filters.relation) === filters.status)
      && (!query || `${item.name} ${item.description} ${item.scope} ${item.tags.join(" ")}`.toLocaleLowerCase().includes(query));
  });
}

export function getPersonalResourceStats(resources: PersonalResource[], favorites: ReadonlySet<string>) {
  return {
    available: resources.filter((item) => item.access === "available").length,
    created: resources.filter((item) => Boolean(item.creationStatus)).length,
    favorites: resources.filter((item) => favorites.has(item.id)).length,
    applications: resources.filter((item) => Boolean(item.application)).length,
  };
}

export interface ResourceDraftInput { name: string; type: PersonalResourceType | ""; scope: string; description: string; }

export function createResourceDraft(input: ResourceDraftInput, ownerId: string, id: string):
  | { ok: false; error: string }
  | { ok: true; resource: PersonalResource } {
  if (!input.name.trim() || !input.type || !input.scope.trim() || !input.description.trim()) {
    return { ok: false, error: "请填写资源名称、类型、所属空间和资源描述。" };
  }
  if (input.name.trim().length > 50 || input.description.trim().length > 200) {
    return { ok: false, error: "资源名称不能超过50字，描述不能超过200字。" };
  }
  return { ok: true, resource: {
    id, ownerId, name: input.name.trim(), type: input.type, scope: input.scope.trim(),
    description: input.description.trim(), version: "V0.1", updatedAt: new Date().toISOString().slice(0, 10),
    access: "request", creationStatus: "草稿", tags: [],
  } };
}

export function submitResourceForReview(resource: PersonalResource): PersonalResource {
  if (resource.creationStatus !== "草稿" && resource.creationStatus !== "已驳回") return resource;
  return { ...resource, creationStatus: "审核中", updatedAt: new Date().toISOString().slice(0, 10) };
}
