import type {
  Asset,
  AssetType,
  DatasetMetadata,
  Profile,
  Knowledge,
  Role,
  Scoped,
  State,
  Task,
  TaskStatus,
} from "./types";
export const stamp = "2026-09-24T09:30:00";
export const roleNames = {
  researcher: "科研人员",
  analyst: "分析化验人员",
  leader: "项目/课题负责人",
  manager: "科研管理人员",
  decision: "科研决策人员",
  admin: "平台管理员",
};
export const disciplines = [
  "全部",
  "通用",
  "地球科学",
  "合成生物科学",
  "材料科学",
  "其他",
];
export const assetTypes: AssetType[] = [
  "智能体",
  "Skill",
  "模型",
  "数据集",
  "方案模板",
];
export const profiles: Record<string, Profile> = {
  researcher: {
    id: "lin",
    name: "林夏",
    roles: ["researcher"],
    projects: ["p1", "p-rubber"],
    managementProjects: [],
    grants: [],
  },
  analyst: {
    id: "chen",
    name: "陈明",
    roles: ["analyst"],
    projects: ["p1", "p-rubber"],
    managementProjects: [],
    grants: [],
  },
  leader: {
    id: "zhao",
    name: "赵岩",
    roles: ["leader"],
    projects: ["p1", "p-rubber"],
    managementProjects: [],
    grants: [],
  },
  manager: {
    id: "wang",
    name: "王敏",
    roles: ["manager"],
    projects: ["p1", "p2", "p3"],
    managementProjects: ["p1", "p2", "p3"],
    grants: [],
  },
  decision: {
    id: "sun",
    name: "孙华",
    roles: ["decision"],
    projects: ["p1", "p2"],
    managementProjects: ["p1", "p2"],
    grants: [],
  },
  admin: {
    id: "admin",
    name: "平台管理员",
    roles: ["admin"],
    projects: ["p1", "p2", "p3", "p-rubber"],
    managementProjects: ["p1", "p2", "p3", "p-rubber"],
    grants: [],
  },
};

const normalizeRole = (role: unknown): Role | null => {
  if (role === "projectManager") return "manager";
  return typeof role === "string" && role in roleNames ? (role as Role) : null;
};

export function normalizeLegacyRoleState(state: State) {
  if (state.profileKey === "projectManager") state.profileKey = "manager";
  state.extraRoles = state.extraRoles
    .map(normalizeRole)
    .filter((role): role is Role => role !== null);
  if (state.userRoles)
    state.userRoles = Object.fromEntries(
      Object.entries(state.userRoles).map(([userId, roles]) => [
        userId,
        [...new Set(roles.map(normalizeRole).filter((role): role is Role => role !== null))],
      ]),
    );
  const profile = profiles[state.profileKey] ?? profiles.researcher;
  const currentSpace = state.spaces.find((space) => space.id === state.spaceId);
  const hasSpaceView = (spaceId: string, projectId: string) => {
    const membership = state.members.find(
      (item) =>
        item.userId === profile.id &&
        item.spaceId === spaceId &&
        item.status === "active",
    );
    return (
      profile.projects.includes(projectId) &&
      !!membership &&
      (
        state.rolePermissions[`${spaceId}:${membership.role}`] ??
        state.rolePermissions[membership.role] ??
        []
      ).includes("view")
    );
  };
  const keepsCurrentSpace =
    !!currentSpace &&
    (currentSpace.type === "PERSONAL"
      ? currentSpace.ownerId === profile.id
      : hasSpaceView(currentSpace.id, currentSpace.projectId));
  if (!keepsCurrentSpace) {
    const personalSpace = state.spaces.find(
      (space) => space.type === "PERSONAL" && space.ownerId === profile.id,
    );
    const projectSpace = state.spaces.find(
      (space) =>
        space.type !== "PERSONAL" &&
        hasSpaceView(space.id, space.projectId),
    );
    state.spaceId = personalSpace?.id ?? projectSpace?.id ?? state.spaceId;
  }
  return state;
}

const normalizeDemoText = (value: string) =>
  value.replace(/睡前验收[：:]?\s*/g, "").trim();

export function normalizeLegacyDemoState(state: State) {
  for (const session of state.sessions) {
    session.name = normalizeDemoText(session.name);
    for (const message of session.messages)
      message.text = normalizeDemoText(message.text);
  }
  for (const task of state.tasks) {
    task.name = normalizeDemoText(task.name);
    task.next = normalizeDemoText(task.next);
    task.reason = normalizeDemoText(task.reason);
    task.constraint = normalizeDemoText(task.constraint);
  }
  for (const artifact of state.artifacts) {
    artifact.name = normalizeDemoText(artifact.name);
    artifact.content = normalizeDemoText(artifact.content);
  }
  for (const asset of state.assets) {
    asset.name = normalizeDemoText(asset.name);
    asset.description = normalizeDemoText(asset.description);
  }
  return state;
}
export const scoped = (
  id: string,
  name: string,
  spaceId = "topic-a",
  visibility: Scoped["visibility"] = "SPACE",
  ownerId = "lin",
): Scoped => ({
  id,
  name,
  ownerId,
  spaceId,
  projectId: spaceId.startsWith("personal")
    ? ""
    : spaceId.includes("rubber")
      ? "p-rubber"
    : spaceId.includes("ccus")
      ? "p2"
      : "p1",
  visibility,
  shares: [],
  updatedAt: stamp,
});
function asset(
  id: string,
  name: string,
  type: AssetType,
  discipline: string,
  description: string,
  spaceId = "topic-a",
  visibility: Scoped["visibility"] = "SPACE",
  ownerId = "lin",
): Asset {
  return {
    ...scoped(id, name, spaceId, visibility, ownerId),
    type,
    discipline,
    description,
    source: "AI 中台",
    version: "V1.0",
    versions: [
      {
        id: id + "-v1",
        number: "V1.0",
        description: "初始验证版本",
        at: stamp,
        by: ownerId,
        status: "有效",
      },
    ],
    publishStatus: "未发布",
    lifecycle: "有效",
    availability: "可用",
    provider: "能源研究院",
    tags: [discipline, type],
    input:
      type === "Skill"
        ? "文献 PDF、DOI 或科研文本"
        : type === "模型"
          ? "储层参数表、测井数据或已授权数据集"
          : "科研问题与已有研究资料",
    output:
      type === "模型"
        ? "预测结果、关键影响因素及适用范围"
        : "结构化结果与来源引用",
    limitations: "仅适用于已说明的输入范围；结果需由科研人员复核。",
    validation: "项目示例验证；非真实模型性能评估",
    dependencies: [],
    schema: [
      { name: "input", label: "输入内容", type: "text", required: true },
    ],
  };
}
function datasetAsset(
  id: string,
  name: string,
  discipline: string,
  description: string,
  metadata: Omit<DatasetMetadata, "version">,
  availability = "可用",
): Asset {
  const item = asset(
    id,
    name,
    "数据集",
    discipline,
    description,
    "project-p1",
    "PUBLIC",
    "zhao",
  );
  item.availability = availability;
  item.tags = [
    discipline,
    metadata.modality,
    ...metadata.purposes,
    ...metadata.formats,
  ];
  item.dataset = { ...metadata, version: item.version };
  item.input = "选择数据集版本与授权用途";
  item.output = "可追溯的数据引用或数据文件";
  return item;
}
function catalogTool(
  id: string,
  name: string,
  type: string,
  discipline: string,
  description: string,
  method: string,
): State["tools"][number] {
  return {
    ...scoped(id, name, "project-p1", "PUBLIC", "admin"),
    type,
    discipline,
    description,
    source: "AI4S 工具目录",
    version: "V1.0",
    provider: "科研计算中心",
    tags: [discipline, type],
    availability: "可用",
    authorization: "已连接",
    method,
    input: "科研数据、文件或任务参数",
    output: "结构化处理结果与运行记录",
    limitations: "演示目录；真实能力需连接正式运行环境。",
    dependencies: [],
    longRunning: type === "科研软件" || type === "科学计算",
  };
}
function task(
  id: string,
  name: string,
  status: TaskStatus,
  spaceId = "topic-a",
): Task {
  return {
    ...scoped(id, name, spaceId),
    type: "综合研究",
    status,
    steps: [
      {
        id: id + "-1",
        name: "整理研究依据",
        status: "completed",
        resources: ["skill-evidence"],
        outputIds: [],
        startedAt: stamp,
        completedAt: stamp,
      },
      {
        id: id + "-2",
        name: "分析关键影响因素",
        status:
          status === "FAILED"
            ? "failed"
            : status === "WAITING_HUMAN"
              ? "waiting"
              : "running",
        resources: ["model-reservoir"],
        outputIds: [],
        reason: status === "FAILED" ? "当前计算资源不足。" : "",
      },
      {
        id: id + "-3",
        name: "形成研究产出",
        status: "pending",
        resources: [],
        outputIds: [],
      },
    ],
    sessionIds: [id + "-session"],
    contextIds: ["dataset-shale"],
    capabilityIds: ["model-reservoir"],
    participants: ["lin", "zhao"],
    next: "完成敏感性分析，形成结果",
    reason:
      status === "FAILED"
        ? "当前计算资源不足。"
        : status === "WAITING_RESOURCE"
          ? "计算资源等待中。"
          : "",
    constraint: "仅使用当前课题授权数据",
    createdAt: stamp,
  };
}
export function createSeed(): State {
  const assets = [
    asset(
      "skill-evidence",
      "文献证据抽取 Skill",
      "Skill",
      "通用",
      "从论文提取实验条件、关键结论与证据引用。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "skill-geology",
      "储层参数整理 Skill",
      "Skill",
      "地球科学",
      "将测井记录整理为可分析的储层参数表。",
    ),
    asset(
      "skill-bio",
      "序列特征提取 Skill",
      "Skill",
      "合成生物科学",
      "提取序列基础特征与标注信息。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "skill-material",
      "催化实验条件抽取 Skill",
      "Skill",
      "材料科学",
      "整理催化实验条件及来源。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "model-reservoir",
      "页岩储层甜点预测模型",
      "模型",
      "地球科学",
      "融合测井与地质属性，识别有利储层区间。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "model-material",
      "吸附性能预测模型",
      "模型",
      "材料科学",
      "根据材料结构与实验条件估计吸附性能。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "model-sequence",
      "蛋白质功能分类模型",
      "模型",
      "合成生物科学",
      "辅助序列功能分类与候选筛选。",
      "project-p1",
      "PUBLIC",
      "zhao",
    ),
    asset(
      "dataset-shale",
      "页岩气实验数据集",
      "数据集",
      "地球科学",
      "储层参数与高压吸附实验记录。",
    ),
    asset(
      "template",
      "储层敏感性分析方案",
      "方案模板",
      "地球科学",
      "输入检查、参数分析和结果复核的研究结构。",
    ),
    asset(
      "agent",
      "储层评价专业智能体",
      "智能体",
      "地球科学",
      "综合整理储层研究依据和参数。",
    ),
    asset(
      "private-b",
      "压裂机理未共享数据集",
      "数据集",
      "地球科学",
      "未共享内容不可跨课题访问。",
      "topic-b",
      "PRIVATE",
      "chen",
    ),
    asset(
      "shared-b",
      "压裂实验参数数据集",
      "数据集",
      "地球科学",
      "已授权给储层课题查看的实验参数。",
      "topic-b",
      "PRIVATE",
      "chen",
    ),
    asset(
      "ccus-dataset",
      "CO₂吸附实验数据集",
      "数据集",
      "材料科学",
      "材料吸附记录。",
      "topic-ccus",
      "SPACE",
      "wang",
    ),
  ];
  assets.push(
    datasetAsset(
      "dataset-adsorption-benchmark",
      "CO₂ 吸附等温线基准数据集",
      "材料科学",
      "包含多种吸附材料在不同压力与温度下的 CO₂ 吸附量，可用于性能预测与模型评估。",
      {
        modality: "表格数据",
        purposes: ["模型训练", "预测验证"],
        formats: ["CSV", "Parquet"],
        recordCount: 12840,
        fileCount: 6,
        size: "18.6 MB",
        fields: [
          { name: "material_id", label: "材料编号", type: "string", description: "脱敏后的材料唯一标识" },
          { name: "pressure_mpa", label: "压力", type: "number", unit: "MPa", description: "平衡压力" },
          { name: "temperature_k", label: "温度", type: "number", unit: "K", description: "测试温度" },
          { name: "uptake_mmol_g", label: "CO₂ 吸附量", type: "number", unit: "mmol/g", description: "平衡吸附容量" },
          { name: "method", label: "测试方法", type: "category", description: "容量法或重量法" },
        ],
        license: "平台科研使用许可",
        accessLevel: "平台公开",
        qualitySummary: "已完成单位、范围与异常值检查；科研结论需复核",
        provenance: "能源研究院吸附实验平台与已授权公开数据汇编",
        citation: "能源研究院. CO₂ 吸附等温线基准数据集 V1.0 (2026).",
        doi: "10.0000/ai4s.demo.adsorption.v1",
        previewRows: [
          { material_id: "MAT-021", pressure_mpa: 0.5, temperature_k: 298, uptake_mmol_g: 1.82, method: "容量法" },
          { material_id: "MAT-021", pressure_mpa: 1, temperature_k: 298, uptake_mmol_g: 2.67, method: "容量法" },
          { material_id: "MAT-044", pressure_mpa: 1, temperature_k: 313, uptake_mmol_g: 2.14, method: "重量法" },
        ],
      },
    ),
    datasetAsset(
      "dataset-shale-public",
      "页岩气储层参数数据集",
      "地球科学",
      "集成孔隙度、渗透率、有机碳与压裂评价参数，支持储层分析和甜点预测。",
      {
        modality: "表格数据",
        purposes: ["地学解释", "模型训练"],
        formats: ["CSV", "Parquet"],
        recordCount: 8640,
        fileCount: 4,
        size: "11.2 MB",
        fields: [
          { name: "sample_id", label: "岩样编号", type: "string", description: "脱敏样品标识" },
          { name: "porosity", label: "孔隙度", type: "number", unit: "%", description: "氦气法孔隙度" },
          { name: "permeability", label: "渗透率", type: "number", unit: "mD", description: "脉冲衰减法结果" },
          { name: "toc", label: "TOC", type: "number", unit: "%", description: "总有机碳" },
        ],
        license: "项目内可引用",
        accessLevel: "平台公开",
        qualitySummary: "已校验字段完整性与单位一致性",
        provenance: "页岩气储层评价项目已脱敏实验与测井数据",
        citation: "AI4S 地球科学数据组. 页岩气储层参数数据集 V1.0.",
        previewRows: [
          { sample_id: "SH-001", porosity: 5.8, permeability: 0.014, toc: 3.2 },
          { sample_id: "SH-002", porosity: 6.1, permeability: 0.021, toc: 3.8 },
          { sample_id: "SH-003", porosity: 4.9, permeability: 0.009, toc: 2.7 },
        ],
      },
    ),
    datasetAsset(
      "dataset-catalyst-spectra",
      "催化材料多模态谱图数据集",
      "材料科学",
      "联合 XRD、XPS、红外谱图与催化活性标注，用于材料结构表征和活性建模。",
      {
        modality: "光谱数据",
        purposes: ["材料设计", "预测验证"],
        formats: ["HDF5", "CSV"],
        recordCount: 4260,
        fileCount: 128,
        size: "2.4 GB",
        fields: [
          { name: "sample_id", label: "样品编号", type: "string", description: "催化剂样品标识" },
          { name: "spectrum_type", label: "谱图类型", type: "category", description: "XRD/XPS/FTIR" },
          { name: "x_axis", label: "横坐标", type: "array", description: "角度或波数" },
          { name: "intensity", label: "强度", type: "array", description: "归一化强度" },
        ],
        license: "平台科研使用许可",
        accessLevel: "需要授权",
        qualitySummary: "已完成基线校正与重复样检查",
        provenance: "材料表征中心的已脱敏设备数据",
        citation: "材料表征中心. 催化材料多模态谱图数据集 V1.0.",
        previewRows: [
          { sample_id: "CAT-014", spectrum_type: "XRD", x_axis: "10°–80°", intensity: "2,801 点" },
          { sample_id: "CAT-027", spectrum_type: "XPS", x_axis: "0–1,200 eV", intensity: "4,096 点" },
          { sample_id: "CAT-031", spectrum_type: "FTIR", x_axis: "400–4,000 cm⁻¹", intensity: "3,601 点" },
        ],
      },
      "需要授权",
    ),
    datasetAsset(
      "dataset-protein-sequence",
      "工业酶序列与功能标注数据集",
      "合成生物科学",
      "包含脱敏氨基酸序列、功能分类、稳定性与反应条件标注。",
      {
        modality: "序列数据",
        purposes: ["模型训练", "预测验证"],
        formats: ["FASTA", "CSV"],
        recordCount: 32400,
        fileCount: 12,
        size: "84.7 MB",
        fields: [
          { name: "sequence_id", label: "序列编号", type: "string", description: "脱敏序列标识" },
          { name: "sequence", label: "氨基酸序列", type: "sequence", description: "标准单字母序列" },
          { name: "function", label: "功能类别", type: "category", description: "酶功能家族" },
          { name: "temperature", label: "最适温度", type: "number", unit: "℃", description: "实验标注温度" },
        ],
        license: "平台科研使用许可",
        accessLevel: "平台公开",
        qualitySummary: "已去重并标记低置信度功能标签",
        provenance: "合成生物研究中心实验与公开序列整理",
        citation: "合成生物研究中心. 工业酶序列与功能标注数据集 V1.0.",
        previewRows: [
          { sequence_id: "ENZ-0012", sequence: "MSTK…VAI", function: "氧化还原酶", temperature: 42 },
          { sequence_id: "ENZ-0198", sequence: "MRAA…LGL", function: "水解酶", temperature: 55 },
          { sequence_id: "ENZ-1024", sequence: "MTPE…KVA", function: "转移酶", temperature: 37 },
        ],
      },
    ),
    datasetAsset(
      "dataset-microscopy-defect",
      "材料显微结构缺陷图像数据集",
      "材料科学",
      "SEM/TEM 显微图像及裂纹、孔洞和界面缺陷标注，支持图像检测与定量分析。",
      {
        modality: "图像数据",
        purposes: ["材料设计", "模型训练"],
        formats: ["PNG", "JSON"],
        recordCount: 5680,
        fileCount: 11360,
        size: "18.9 GB",
        fields: [
          { name: "image_id", label: "图像编号", type: "string", description: "脱敏图像标识" },
          { name: "instrument", label: "仪器类型", type: "category", description: "SEM 或 TEM" },
          { name: "magnification", label: "放大倍数", type: "number", description: "采集放大倍数" },
          { name: "annotations", label: "缺陷标注", type: "json", description: "边界框与类别" },
        ],
        license: "项目内可引用",
        accessLevel: "需要授权",
        qualitySummary: "已完成分辨率、重复图像与标注完整性检查",
        provenance: "材料表征中心已脱敏显微图像",
        citation: "材料表征中心. 材料显微结构缺陷图像数据集 V1.0.",
        previewRows: [
          { image_id: "SEM-0081", instrument: "SEM", magnification: 5000, annotations: "裂纹 3 / 孔洞 8" },
          { image_id: "TEM-0114", instrument: "TEM", magnification: 20000, annotations: "界面缺陷 4" },
          { image_id: "SEM-0218", instrument: "SEM", magnification: 10000, annotations: "孔洞 12" },
        ],
      },
      "需要授权",
    ),
    datasetAsset(
      "dataset-sensor-timeseries",
      "科研设备运行时序数据集",
      "通用",
      "采集温度、压力、振动与运行状态时序，用于异常检测和实验过程对齐。",
      {
        modality: "时序数据",
        purposes: ["实验分析", "预测验证"],
        formats: ["Parquet", "CSV"],
        recordCount: 2480000,
        fileCount: 48,
        size: "1.8 GB",
        fields: [
          { name: "timestamp", label: "时间戳", type: "datetime", description: "设备采样时间" },
          { name: "device_id", label: "设备编号", type: "string", description: "脱敏设备标识" },
          { name: "temperature", label: "温度", type: "number", unit: "℃", description: "环境温度" },
          { name: "pressure", label: "压力", type: "number", unit: "MPa", description: "管路压力" },
        ],
        license: "平台科研使用许可",
        accessLevel: "平台公开",
        qualitySummary: "已标记缺失时段与仪器校准窗口",
        provenance: "云上实验室已脱敏设备运行记录",
        citation: "AI4S 云上实验室. 科研设备运行时序数据集 V1.0.",
        previewRows: [
          { timestamp: "2026-09-20 08:00:00", device_id: "DEV-014", temperature: 24.6, pressure: 1.02 },
          { timestamp: "2026-09-20 08:00:10", device_id: "DEV-014", temperature: 24.7, pressure: 1.01 },
          { timestamp: "2026-09-20 08:00:20", device_id: "DEV-014", temperature: 24.7, pressure: 1.03 },
        ],
      },
    ),
    datasetAsset(
      "dataset-literature-evidence",
      "科研文献实验参数抽取数据集",
      "通用",
      "从已授权文献中抽取的实验对象、条件、结果和来源引用。",
      {
        modality: "文本数据",
        purposes: ["文献研究", "模型训练"],
        formats: ["JSONL", "CSV"],
        recordCount: 18650,
        fileCount: 18,
        size: "96.4 MB",
        fields: [
          { name: "source_id", label: "来源编号", type: "string", description: "文献或专利标识" },
          { name: "entity", label: "研究对象", type: "string", description: "材料、分子或地质对象" },
          { name: "condition", label: "实验条件", type: "text", description: "结构化条件摘要" },
          { name: "evidence", label: "证据原文", type: "text", description: "可回溯的证据片段" },
        ],
        license: "仅限已授权文献研究使用",
        accessLevel: "需要授权",
        qualitySummary: "已人工复核样本字段与来源定位",
        provenance: "知识中心已授权文献及抽取任务记录",
        citation: "AI4S 知识中心. 科研文献实验参数抽取数据集 V1.0.",
        previewRows: [
          { source_id: "DOC-1021", entity: "MOF-74", condition: "298 K / 1 MPa", evidence: "Figure 4, p.8" },
          { source_id: "DOC-1188", entity: "ZIF-8", condition: "313 K / 2 MPa", evidence: "Table 2, p.5" },
          { source_id: "PAT-0331", entity: "Ni/Al₂O₃", condition: "450 ℃ / H₂", evidence: "实施例 6" },
        ],
      },
      "需要授权",
    ),
    datasetAsset(
      "dataset-molecular-structure",
      "能源材料分子结构与性质数据集",
      "材料科学",
      "包含分子二维/三维结构、计算性质与实验标注，支持分子生成和性能预测。",
      {
        modality: "分子结构",
        purposes: ["材料设计", "模型训练"],
        formats: ["SDF", "CSV"],
        recordCount: 74200,
        fileCount: 24,
        size: "3.2 GB",
        fields: [
          { name: "molecule_id", label: "分子编号", type: "string", description: "分子唯一标识" },
          { name: "smiles", label: "SMILES", type: "string", description: "分子线性表示" },
          { name: "structure_3d", label: "三维结构", type: "sdf", description: "优化后构象" },
          { name: "target_property", label: "目标性质", type: "number", description: "实验或计算性质" },
        ],
        license: "平台科研使用许可",
        accessLevel: "平台公开",
        qualitySummary: "已执行价态、构象与重复结构检查",
        provenance: "科研计算中心与已授权实验数据汇编",
        citation: "科研计算中心. 能源材料分子结构与性质数据集 V1.0.",
        previewRows: [
          { molecule_id: "MOL-001", smiles: "CCO", structure_3d: "已优化", target_property: -5.21 },
          { molecule_id: "MOL-002", smiles: "CC(=O)O", structure_3d: "已优化", target_property: -6.08 },
          { molecule_id: "MOL-003", smiles: "c1ccccc1", structure_3d: "已优化", target_property: -5.72 },
        ],
      },
    ),
    datasetAsset(
      "dataset-geology-seismic",
      "深层储层地震属性数据集",
      "地球科学",
      "脱敏地震道集、层位和储层属性体，支持地质结构解释与属性反演。",
      {
        modality: "多模态数据",
        purposes: ["地学解释", "预测验证"],
        formats: ["SEG-Y", "Zarr"],
        recordCount: 960000,
        fileCount: 32,
        size: "48.6 GB",
        fields: [
          { name: "inline", label: "Inline", type: "integer", description: "主测线编号" },
          { name: "crossline", label: "Crossline", type: "integer", description: "联络测线编号" },
          { name: "twt", label: "双程时", type: "number", unit: "ms", description: "地震双程时" },
          { name: "amplitude", label: "振幅", type: "number", description: "归一化振幅" },
        ],
        license: "项目内可引用",
        accessLevel: "权限受限",
        qualitySummary: "已完成道头、坐标和缺失道检查",
        provenance: "深层储层项目已脱敏地震处理成果",
        citation: "深层储层项目组. 深层储层地震属性数据集 V1.0.",
        previewRows: [
          { inline: 1201, crossline: 880, twt: 2450, amplitude: 0.42 },
          { inline: 1201, crossline: 881, twt: 2452, amplitude: 0.38 },
          { inline: 1202, crossline: 880, twt: 2448, amplitude: 0.47 },
        ],
      },
      "权限受限",
    ),
    asset(
      "dataset-rubber-history",
      "柔性丁苯橡胶历史配方数据集",
      "数据集",
      "材料科学",
      "48 组配方、工艺参数与滚阻、湿滑、耐磨实验结果。",
      "topic-rubber",
    ),
    asset(
      "model-rubber-formula",
      "橡胶配方多目标优化模型",
      "模型",
      "材料科学",
      "根据配方变量与性能约束生成候选配方并进行敏感性分析。",
      "topic-rubber",
    ),
    asset(
      "template-rubber-experiment",
      "轮胎材料配方验证实验模板",
      "方案模板",
      "材料科学",
      "包含 DOE 因素、混炼、硫化、性能测试与 ELN 记录结构。",
      "topic-rubber",
    ),
    asset(
      "skill-rubber-evidence",
      "轮胎材料证据抽取 Skill",
      "Skill",
      "材料科学",
      "从论文、专利和标准中提取配方、工艺与性能证据。",
      "topic-rubber",
    ),
    asset(
      "agent-rubber-research",
      "高分子材料研究助手",
      "智能体",
      "材料科学",
      "面向轮胎材料研究的文献证据整理、配方分析与任务协同智能体。",
      "topic-rubber",
    ),
    asset(
      "skill-rubber-analysis",
      "实验数据分析 Skill",
      "Skill",
      "材料科学",
      "用于实验数据清洗、统计分析、趋势识别和可视化的科研技能。",
      "topic-rubber",
    ),
    asset(
      "dataset-rubber-property",
      "橡胶物性实验数据集",
      "数据集",
      "材料科学",
      "包含力学性能、动态力学、耐磨和老化测试记录。",
      "topic-rubber",
    ),
    asset(
      "template-rubber-process",
      "混炼工艺方案模板",
      "方案模板",
      "材料科学",
      "用于混炼阶段、加料顺序、温度与时间约束的方案模板。",
      "topic-rubber",
    ),
  );
  assets.push(
    asset("skill-patent-route", "专利技术路线分析", "Skill", "通用", "提取核心专利、技术路线和差异点，形成对比分析。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-data-clean", "科研数据清洗", "Skill", "通用", "执行缺失值、异常值、单位和数据质量检查。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-report", "科研报告生成", "Skill", "通用", "基于任务过程、引用和科研产出组织研究报告。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-chart-extract", "论文图表提取", "Skill", "通用", "从论文中提取图表、标题、单位和结构化数据。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-research-gap", "研究空白识别", "Skill", "通用", "聚合多来源证据，识别争议、缺口和可验证研究假设。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-molecular-simulation", "分子动力学模拟编排", "Skill", "材料科学", "生成模拟参数、调用计算软件并整理轨迹分析结果。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-doe-design", "DOE 实验方案设计", "Skill", "材料科学", "根据目标、因素和约束生成实验矩阵与随机执行顺序。", "project-p1", "PUBLIC", "zhao"),
    asset("skill-citation-audit", "科研引用核验", "Skill", "通用", "核对报告引用、证据编号与原始知识资源的一致性。", "project-p1", "PUBLIC", "zhao"),
    asset("model-molecule-generate", "分子生成模型", "模型", "材料科学", "生成满足目标性质约束的候选分子结构。", "project-p1", "PUBLIC", "zhao"),
    asset("model-science-llm", "科研大语言模型", "模型", "通用", "支持文献理解、科研问答与任务规划。", "project-p1", "PUBLIC", "zhao"),
    asset("model-image-analysis", "科研图像分析模型", "模型", "通用", "识别显微、谱图和实验图像中的结构特征。", "project-p1", "PUBLIC", "zhao"),
    asset("model-protein-structure", "蛋白质结构预测模型", "模型", "合成生物科学", "根据氨基酸序列预测蛋白质三维结构与功能位点。", "project-p1", "PUBLIC", "zhao"),
    asset("model-rubber-performance", "橡胶配方性能预测模型", "模型", "材料科学", "预测配方的滚阻、湿滑、耐磨和动态力学性能。", "project-p1", "PUBLIC", "zhao"),
    asset("model-catalyst-activity", "催化剂活性预测模型", "模型", "材料科学", "根据组成、制备条件和表征数据预测催化活性。", "project-p1", "PUBLIC", "zhao"),
    asset("model-spectra-multimodal", "多模态谱图理解模型", "模型", "通用", "联合理解 XRD、XPS、红外和实验文本，提取结构证据。", "project-p1", "PUBLIC", "zhao"),
  );
  for (const a of assets)
    if (a.visibility === "PUBLIC") a.publishStatus = "已发布";
  for (const id of ["model-rubber-formula", "skill-rubber-evidence", "agent-rubber-research"])
    assets.find((a) => a.id === id)!.publishStatus = "已发布";
  assets.find((a) => a.id === "dataset-rubber-history")!.shares = [{ id: "share-rubber-history", targetSpace: "project-rubber", level: "可引用", validTo: "", by: "lin", at: stamp }];
  assets.find((a) => a.id === "skill-rubber-analysis")!.publishStatus = "审核中";
  assets.find((a) => a.id === "template-rubber-process")!.lifecycle = "草稿";
  assets.find((a) => a.id === "model-material")!.longRunning = true;
  assets.find((a) => a.id === "model-sequence")!.availability = "维护中";
  assets.find((a) => a.id === "shared-b")!.shares = [
    {
      id: "share-1",
      targetSpace: "topic-a",
      level: "只读",
      validTo: "",
      by: "chen",
      at: stamp,
    },
  ];
  const tasks = [
    task("task-shale", "页岩气储层敏感性分析", "RUNNING"),
    task("task-plan", "下一轮吸附实验方案", "WAITING_HUMAN"),
    task("task-failed", "储层多因素模拟", "FAILED"),
    task("task-wait", "分子动力学模拟", "WAITING_RESOURCE"),
    task("task-ccus", "CO₂吸附材料筛选", "PAUSED", "topic-ccus"),
  ];
  const readTask = task(
    "task-read",
    "新能源汽车轮胎用柔性丁苯橡胶文献调研",
    "COMPLETED",
    "topic-rubber",
  );
  readTask.type = "文献研究";
  readTask.next = "确认研究空白并进入配方计算";
  readTask.contextIds = ["skill-rubber-evidence"];
  readTask.capabilityIds = ["skill-rubber-evidence"];
  readTask.steps = [
    ["任务拆解与检索式设计", "completed"],
    ["论文、专利与标准检索", "completed"],
    ["证据抽取与质量复核", "completed"],
    ["研究空白识别", "completed"],
    ["形成调研产出", "completed"],
  ].map(([name, status], index) => ({
    id: `${readTask.id}-${index + 1}`,
    name,
    status: status as "completed",
    resources: ["skill-rubber-evidence"],
    outputIds: [],
    startedAt: stamp,
    completedAt: stamp,
  }));

  const calculateTask = task(
    "task-calculate",
    "柔性丁苯橡胶配方参数计算",
    "RUNNING",
    "topic-rubber",
  );
  calculateTask.type = "参数计算";
  calculateTask.next = "完成 V2 参数优化并筛选候选配方";
  calculateTask.contextIds = ["artifact-read-report", "dataset-rubber-history"];
  calculateTask.capabilityIds = ["model-rubber-formula"];
  calculateTask.steps = [
    ["历史配方数据质量检查", "completed"],
    ["建立配方变量与约束", "completed"],
    ["代理模型计算 V1", "completed"],
    ["贝叶斯优化 V2", "running"],
    ["候选配方验证", "pending"],
  ].map(([name, status], index) => ({
    id: `${calculateTask.id}-${index + 1}`,
    name,
    status: status as "completed" | "running" | "pending",
    resources: [index < 2 ? "dataset-rubber-history" : "model-rubber-formula"],
    outputIds: [],
    startedAt: status === "pending" ? undefined : stamp,
    completedAt: status === "completed" ? stamp : undefined,
  }));

  const experimentTask = task(
    "task-experiment",
    "推荐配方实验验证方案",
    "WAITING_HUMAN",
    "topic-rubber",
  );
  experimentTask.type = "实验设计";
  experimentTask.next = "确认实验批次与仪器时段";
  experimentTask.contextIds = ["artifact-calc-recommendation", "template-rubber-experiment"];
  experimentTask.capabilityIds = ["template-rubber-experiment"];
  experimentTask.steps = [
    ["读取推荐配方 V2", "completed"],
    ["生成 DOE 实验矩阵", "completed"],
    ["检查仪器与耗材", "waiting"],
    ["生成 SOP 与记录模板", "pending"],
  ].map(([name, status], index) => ({
    id: `${experimentTask.id}-${index + 1}`,
    name,
    status: status as "completed" | "waiting" | "pending",
    resources: ["template-rubber-experiment"],
    outputIds: [],
    startedAt: status === "pending" ? undefined : stamp,
    completedAt: status === "completed" ? stamp : undefined,
  }));
  tasks.unshift(readTask, calculateTask, experimentTask);
  const projects = [
    {
      id: "p-rubber",
      name: "高性能合成橡胶项目",
      code: "KY-2026-041",
      owner: "赵岩",
      organization: "材料研究中心",
      discipline: "材料科学",
      status: "在研",
      start: "2026-04-01",
      end: "2027-12-31",
      major: true,
      syncStatus: "已同步",
      syncTime: stamp,
    },
    {
      id: "p1",
      name: "非常规油气前沿研究",
      code: "KY-2026-017",
      owner: "赵岩",
      organization: "能源研究院",
      discipline: "地球科学",
      status: "在研",
      start: "2026-01-01",
      end: "2027-12-31",
      major: true,
      syncStatus: "已同步",
      syncTime: stamp,
    },
    {
      id: "p2",
      name: "CCUS材料研究",
      code: "KY-2026-028",
      owner: "王敏",
      organization: "材料研究中心",
      discipline: "材料科学",
      status: "在研",
      start: "2026-03-01",
      end: "2028-02-28",
      major: false,
      syncStatus: "同步异常",
      syncTime: "2026-09-23T16:00:00",
    },
    {
      id: "p3",
      name: "合成生物方法研究",
      code: "KY-2026-032",
      owner: "周宁",
      organization: "生物研究中心",
      discipline: "合成生物科学",
      status: "在研",
      start: "2026-06-01",
      end: "2028-05-31",
      major: false,
      syncStatus: "已同步",
      syncTime: stamp,
    },
  ];
  const spaces: State["spaces"] = [
    ...Object.values(profiles).map((p) => ({
      id: "personal-" + p.id,
      name: "个人空间",
      type: "PERSONAL" as const,
      projectId: "",
      ownerId: p.id,
      status: "ACTIVE" as const,
      description: "",
      code: "",
      mapping: "",
      syncStatus: "未映射",
      createdAt: stamp,
    })),
    ...[
      ["project-rubber", "高性能合成橡胶项目 · 项目空间", "PROJECT", "p-rubber", "zhao"],
      ["topic-rubber", "配方优化课题", "TOPIC", "p-rubber", "zhao"],
      ["project-p1", "非常规油气前沿研究 · 项目空间", "PROJECT", "p1", "zhao"],
      ["topic-a", "页岩气储层评价课题", "TOPIC", "p1", "zhao"],
      ["topic-b", "压裂机理研究课题", "TOPIC", "p1", "chen"],
      ["project-ccus", "CCUS材料研究 · 项目空间", "PROJECT", "p2", "wang"],
      ["topic-ccus", "CO₂吸附材料课题", "TOPIC", "p2", "wang"],
    ].map(([id, name, type, projectId, ownerId]) => ({
      id,
      name,
      type: type as "PROJECT" | "TOPIC",
      projectId,
      ownerId,
      status: "ACTIVE" as const,
      description: "科研项目与课题协作空间",
      code: id,
      mapping: "AI-" + id,
      syncStatus: "已同步",
      createdAt: stamp,
    })),
  ];
  const members: State["members"] = [];
  for (const p of Object.values(profiles))
    for (const sp of spaces) {
      if (sp.type === "PERSONAL" && sp.ownerId !== p.id) continue;
      if (
        sp.type !== "PERSONAL" &&
        (!p.projects.includes(sp.projectId) ||
          (p.id === "lin" && sp.id === "topic-b"))
      )
        continue;
      members.push({
        id: p.id + "-" + sp.id,
        userId: p.id,
        projectId: sp.projectId,
        spaceId: sp.id,
        role:
          p.roles.includes("admin") || p.roles.includes("manager")
            ? "Space Admin"
            : sp.ownerId === p.id
              ? "Topic Leader"
              : p.roles.includes("manager") || p.roles.includes("decision")
                ? "Viewer"
                : "Member",
        status: "active",
        joinedAt: stamp,
      });
    }
  const knowledge: State["knowledge"] = [
    [
      "k-paper",
      "页岩气储层脆性评价方法研究",
      "文献",
      "研究对比了矿物组分与弹性参数两类评价方法。",
    ],
    [
      "k-patent",
      "储层参数联合评价方法",
      "专利",
      "联合岩石力学与测井参数的评价方法。",
    ],
    [
      "k-standard",
      "岩石孔隙度测定方法",
      "标准",
      "岩样制备、测试条件与数据质量控制要求。",
    ],
    [
      "k-internal",
      "储层评价课题阶段资料",
      "内部资料",
      "本课题的实验记录及参数校验说明。",
    ],
    ["k-dataset", "页岩气实验数据集", "数据集", "孔隙度、渗透率与吸附数据。"],
  ].map(
    ([id, name, type, description], i): Knowledge => ({
      ...scoped(id, name, "topic-a", type === "内部资料" ? "SPACE" : "PUBLIC"),
      type,
      discipline: "地球科学",
      description,
      authors: "研究团队（示例）",
      organization: "能源研究院",
      source: "本地科研示例库",
      date: "2026-09-" + (10 + i),
      keywords: ["页岩气", "储层", "实验"],
      citationCount: 0,
      language: "中文",
      fulltext: type !== "专利",
      metadata:
        type === "文献"
          ? {
              DOI: "未接入真实文献源",
              期刊: "科研方法示例",
              参考文献: "示例未附外部参考文献",
            }
          : type === "专利"
            ? {
                申请号: "演示专利号",
                公开号: "演示公开号",
                申请人: "能源研究院",
                发明人: "研究团队",
                法律状态: "示例状态",
                IPC: "E21B",
                同族专利: "暂无",
                权利要求: "对多源储层参数进行联合处理。",
              }
            : type === "标准"
              ? {
                  标准号: "DEMO-STD-001",
                  标准类型: "方法示例",
                  发布机构: "示例机构",
                  实施日期: "2026-01-01",
                  当前状态: "示例有效",
                  适用范围: "科研演示",
                  核心章节: "样品准备、测量与记录",
                }
              : {
                  版本: "V1.0",
                  数据规模: "24条示例记录",
                  字段说明: "孔隙度、渗透率、压力、吸附量",
                  数据质量: "示例数据，不用于科研结论",
                },
      content:
        description +
        "\n本条目为前端原型示例，用于验证检索、来源追踪与引用流程。",
      baseId: "base-shale",
      ...(type === "数据集" ? { assetId: "dataset-shale" } : {}),
    }),
  );
  const assistantMessages: Record<string, State["sessions"][number]["messages"]> = {
    "task-read": [
      { id: "read-u1", role: "user", text: "调研新能源汽车轮胎对柔性丁苯橡胶的关键性能要求，检索近五年论文、专利和标准，并识别可验证的研究空白。", at: "2026-09-24T09:10:00" },
      { id: "read-a1", role: "assistant", text: "Research Supervisor：已将任务规划为检索式设计、跨库检索、证据筛选、指标提取和研究空白识别五个阶段。", at: "2026-09-24T09:11:00" },
      { id: "read-a2", role: "assistant", text: "文献检索 Agent：已生成检索式、同义词与纳排条件，准备执行近五年文献检索。", at: "2026-09-24T09:15:00" },
      { id: "read-t2", role: "assistant", text: "工具调用｜知识中心智能检索：输入 8 组检索式，返回 126 篇；去重与相关性排序后保留 26 篇。", at: "2026-09-24T09:18:00" },
      { id: "read-a3", role: "assistant", text: "专利分析 Agent、标准对标 Agent：已分别完成权利要求聚类和测试指标映射。", at: "2026-09-24T09:23:00" },
      { id: "read-t3", role: "assistant", text: "工具调用｜专利库、标准库：输入核心技术词与分类号，返回 43 项专利和 4 项标准；筛选 8 项核心专利。", at: "2026-09-24T09:26:00" },
      { id: "read-a4", role: "assistant", text: "研究空白分析 Agent：确认 6 项核心性能指标，识别低温湿滑与低滚阻协同优化、填料界面机理和长期老化三个研究空白。", at: "2026-09-24T09:36:00" },
    ],
    "task-calculate": [
      { id: "calc-u1", role: "user", text: "基于调研确认的核心指标和历史实验数据，计算柔性丁苯橡胶配方参数，优先优化低滚阻、湿滑和耐磨性能。", at: "2026-09-24T10:00:00" },
      { id: "calc-a1", role: "assistant", text: "Research Supervisor：已规划数据检查、变量约束、代理模型计算、贝叶斯优化和候选配方验证。", at: "2026-09-24T10:01:00" },
      { id: "calc-a2", role: "assistant", text: "数据质量 Agent：已定义完整性、单位一致性和异常值检查规则。", at: "2026-09-24T10:05:00" },
      { id: "calc-t2", role: "assistant", text: "工具调用｜Python 数据检查：读取 48 组历史配方，发现 3 条缺失记录和 2 条异常值，已隔离并保留审计记录。", at: "2026-09-24T10:08:00" },
      { id: "calc-a3", role: "assistant", text: "配方建模 Agent：已将 6 项性能指标转化为 11 个变量约束，并提交首轮计算。", at: "2026-09-24T10:16:00" },
      { id: "calc-t3", role: "assistant", text: "工具调用｜约束求解器、代理模型：V1 因硅烷偶联剂范围冲突被替代，修正约束后启动 V2。", at: "2026-09-24T10:22:00" },
      { id: "calc-a4", role: "assistant", text: "参数优化 Agent：正在根据模型返回结果更新采样点。", at: "2026-09-24T10:31:00" },
      { id: "calc-t4", role: "assistant", text: "工具调用｜贝叶斯优化：V2 当前进度 72%，预计生成 12 组候选配方并筛选 3 组优先方案。", at: "2026-09-24T10:42:00" },
    ],
    "task-experiment": [
      { id: "exp-u1", role: "user", text: "根据推荐配方 V2，设计两组本周可完成的实验方案，列出材料、仪器、操作步骤、质量控制和结果判定标准。", at: "2026-09-24T11:00:00" },
      { id: "exp-a1", role: "assistant", text: "Research Supervisor：已规划 DOE 设计、仪器与耗材检查、安全复核、SOP 和记录模板生成。", at: "2026-09-24T11:01:00" },
      { id: "exp-a2", role: "assistant", text: "实验设计 Agent、DOE Agent：已确定温度、混炼时间和硫化条件三个因素及水平。", at: "2026-09-24T11:05:00" },
      { id: "exp-t2", role: "assistant", text: "工具调用｜DOE 设计工具：输入两组候选配方和 4 项验收指标，返回 8 个实验批次及随机执行顺序。", at: "2026-09-24T11:08:00" },
      { id: "exp-a3", role: "assistant", text: "仪器资源 Agent、耗材 Agent：正在并行核对设备、人员和材料条件。", at: "2026-09-24T11:12:00" },
      { id: "exp-t3", role: "assistant", text: "工具调用｜仪器目录、预约系统、耗材库存：原定时段冲突；周四 14:00–17:00 和周五 09:00–12:00 可用。", at: "2026-09-24T11:16:00" },
      { id: "exp-a4", role: "assistant", text: "安全与可行性 Agent：材料库存满足两组实验；需要你确认采用两个替代时段，之后将生成实验方案 V2、SOP 和 ELN 记录模板。", at: "2026-09-24T11:20:00" },
    ],
  };
  return {
    schema: 1,
    profileKey: "researcher",
    extraRoles: [],
    spaceId: "topic-a",
    spaces,
    members,
    projects,
    assets,
    tools: [
      {
        ...scoped("tool-gromacs", "GROMACS", "project-p1", "PUBLIC", "admin"),
        type: "科研软件",
        discipline: "材料科学",
        description: "分子动力学模拟与轨迹分析。",
        source: "AI 中台",
        version: "2026",
        provider: "科研计算中心",
        tags: ["分子模拟", "科学计算"],
        availability: "可用",
        authorization: "已连接",
        method: "任务提交",
        input: "分子结构文件与模拟参数",
        output: "轨迹文件、能量数据、分析结果",
        limitations: "需计算资源；本地仅演示任务状态。",
        dependencies: [],
        longRunning: true,
      },
      {
        ...scoped(
          "tool-csv",
          "科研数据格式转换",
          "project-p1",
          "PUBLIC",
          "admin",
        ),
        type: "数据处理",
        discipline: "通用",
        description: "将 CSV 数据转换为结构化 JSON。",
        source: "AI4S",
        version: "V1.0",
        provider: "科研计算中心",
        tags: ["格式转换", "文件处理"],
        availability: "可用",
        authorization: "已连接",
        method: "Web 工具",
        input: "CSV 表格文本",
        output: "JSON 结构化数据",
        limitations: "首行为字段名。",
        dependencies: [],
        longRunning: false,
      },
      {
        ...scoped(
          "tool-connector",
          "内部文献库连接",
          "project-p1",
          "PUBLIC",
          "admin",
        ),
        type: "连接器",
        discipline: "通用",
        description: "访问已授权的企业文献资源。",
        source: "企业文献系统",
        version: "V1.0",
        provider: "信息中心",
        tags: ["外部服务"],
        availability: "需要授权",
        authorization: "未连接",
        method: "外部授权",
        input: "文献查询条件",
        output: "文献元数据",
        limitations: "需要企业账号授权。",
        dependencies: [],
        longRunning: false,
      },
      catalogTool("tool-data-clean", "科研数据清洗工具", "数据处理", "通用", "处理缺失值、异常值、重复记录并生成质量报告。", "MCP"),
      catalogTool("tool-molecule-convert", "分子格式转换工具", "分子处理", "材料科学", "支持 PDB、MOL、SDF 与 SMILES 格式转换。", "API"),
      catalogTool("tool-science-plot", "科研绘图工具", "可视化", "通用", "生成论文级折线图、散点图、谱图与统计图。", "平台内置"),
      catalogTool("software-vasp", "VASP", "科研软件", "材料科学", "第一性原理电子结构计算与材料性质分析。", "云电脑 / CLI"),
      catalogTool("software-gaussian", "Gaussian", "科研软件", "化学化工", "量子化学计算、分子结构优化与反应路径分析。", "本地电脑 / 云电脑"),
      catalogTool("software-materials-studio", "Materials Studio", "科研软件", "材料科学", "材料建模、分子模拟和结构性质分析。", "云电脑"),
      catalogTool("mcp-literature-search", "科研文献检索 MCP", "连接器", "通用", "向 Research Agent 提供论文检索、元数据读取与证据回溯能力。", "MCP"),
      catalogTool("mcp-eln", "ELN 实验记录 MCP", "连接器", "通用", "读取已授权实验记录并回写方案、SOP 与结果索引。", "MCP"),
      catalogTool("mcp-instrument", "仪器预约与状态 MCP", "连接器", "材料科学", "查询共享仪器状态、可用时段和预约结果。", "MCP"),
    ],
    sessions: tasks.map((t) => ({
      ...scoped(t.sessionIds[0], t.name, t.spaceId, "PRIVATE", t.ownerId),
      taskId: t.id,
      messages: assistantMessages[t.id] ?? [
        {
          id: t.id + "-m",
          role: "user",
          text: "请基于当前课题资料推进" + t.name,
          at: stamp,
        },
      ],
      favorite: false,
      archived: false,
      contextIds: t.contextIds,
      capabilityIds: t.capabilityIds,
    })),
    tasks,
    decisions: [
      {
        id: "decision-plan",
        taskId: "task-plan",
        stepId: "task-plan-2",
        question: "下一轮吸附实验采用哪组压力参数？",
        recommendation: "方案 B：按中低压区间增加采样点。",
        reason: "现有数据在低压区间的采样覆盖不足。",
        options: ["方案 A：维持原参数", "方案 B：增加中低压采样", "自定义"],
        assignee: "lin",
        status: "pending",
        choice: "",
        at: "",
        by: "",
      },
      {
        id: "decision-experiment-slot",
        taskId: "task-experiment",
        stepId: "task-experiment-3",
        question: "两组配方验证实验采用哪组替代时段？",
        recommendation: "分别预约周四 14:00–17:00 和周五 09:00–12:00，避免仪器冲突并保留样品稳定时间。",
        reason: "原定周四上午仪器已被占用；两个替代时段均满足人员、仪器和耗材条件。",
        options: ["采用两个推荐时段", "两组均安排在周五", "自定义"],
        assignee: "lin",
        status: "pending",
        choice: "",
        at: "",
        by: "",
      },
    ],
    artifacts: [
      {
        ...scoped("artifact-read-report", "柔性丁苯橡胶研究空白分析报告", "topic-rubber"),
        type: "研究报告",
        taskId: "task-read",
        sessionId: "task-read-session",
        stepId: "task-read-5",
        version: "V2.0",
        status: "已确认",
        content: "基于 26 篇论文、8 项专利和 4 项标准形成的演示调研报告。",
        references: ["skill-rubber-evidence"],
      },
      {
        ...scoped("artifact-calc-recommendation", "柔性丁苯橡胶推荐配方 V2", "topic-rubber"),
        type: "计算结果",
        taskId: "task-calculate",
        sessionId: "task-calculate-session",
        stepId: "task-calculate-4",
        version: "V2.0",
        status: "生成中",
        content: "基于历史配方数据与多目标约束生成的候选配方演示结果。",
        references: ["artifact-read-report", "dataset-rubber-history", "model-rubber-formula"],
      },
      {
        ...scoped("artifact-experiment-plan", "推荐配方实验验证方案 V2", "topic-rubber"),
        type: "实验方案",
        taskId: "task-experiment",
        sessionId: "task-experiment-session",
        stepId: "task-experiment-3",
        version: "V2.0",
        status: "待确认",
        content: "包含 8 个 DOE 批次、仪器时段、材料与质量控制要求。",
        references: ["artifact-calc-recommendation", "template-rubber-experiment"],
      },
      {
        ...scoped("artifact-shale", "储层敏感性分析结果"),
        type: "数据分析结果",
        taskId: "task-shale",
        sessionId: "task-shale-session",
        stepId: "task-shale-1",
        version: "V1.0",
        status: "待确认",
        content: "示例结果：已完成输入检查，待对关键参数进行进一步验证。",
        references: ["dataset-shale", "k-paper"],
      },
    ],
    knowledge,
    instruments: [
      {
        id: "sem",
        name: "扫描电子显微镜 SEM",
        code: "EQ-2026-016",
        type: "电子显微镜",
        manufacturer: "示例设备厂家",
        model: "SEM-500",
        organization: "能源研究院",
        lab: "材料表征实验室",
        location: "科研楼 B201",
        ownerId: "chen",
        contact: "实验室内线 201",
        specs: "形貌观察与微观结构表征",
        connection: "外部系统同步",
        online: "在线",
        runtime: "空闲",
        sharing: true,
        approval: true,
        rules: "工作日 09:00–18:00；需完成培训，由设备负责人审批。",
        purpose: "材料形貌与微观结构表征",
        discipline: "材料科学",
        source: "LIMS（示例）",
        syncTime: stamp,
        visibleProjects: ["p1", "p2"],
      },
      {
        id: "adsorption",
        name: "高压气体吸附仪",
        code: "EQ-2026-024",
        type: "吸附分析",
        manufacturer: "示例设备厂家",
        model: "ADS-20",
        organization: "能源研究院",
        lab: "储层实验室",
        location: "科研楼 A102",
        ownerId: "chen",
        contact: "实验室内线 102",
        specs: "气体吸附等温线测量",
        connection: "人工维护",
        online: "在线",
        runtime: "空闲",
        sharing: true,
        approval: false,
        rules: "工作日 09:00–18:00；已授权人员自动通过。",
        purpose: "储层气体吸附性能测定",
        discipline: "地球科学",
        source: "AI4S",
        syncTime: stamp,
        visibleProjects: ["p1"],
      },
      {
        id: "xrd",
        name: "X 射线衍射仪",
        code: "EQ-2026-031",
        type: "物相分析",
        manufacturer: "示例设备厂家",
        model: "XRD-30",
        organization: "材料研究中心",
        lab: "结构实验室",
        location: "C301",
        ownerId: "chen",
        contact: "实验室内线 301",
        specs: "晶体结构分析",
        connection: "状态感知",
        online: "离线",
        runtime: "维护中",
        sharing: false,
        approval: true,
        rules: "维护期间暂停预约。",
        purpose: "晶体结构分析",
        discipline: "材料科学",
        source: "LIMS（示例）",
        syncTime: stamp,
        visibleProjects: ["p1", "p2"],
      },
    ],
    reservations: [
      {
        id: "reservation-seed",
        instrumentId: "sem",
        projectId: "p1",
        spaceId: "topic-a",
        ownerId: "lin",
        start: "2026-09-25T09:00",
        end: "2026-09-25T11:00",
        purpose: "岩样形貌表征",
        experimentId: "experiment-seed",
        note: "",
        status: "已通过",
        records: ["2026-09-24 09:00 设备负责人审批通过"],
      },
    ],
    experiments: [
      {
        ...scoped("experiment-seed", "储层岩样高压吸附实验"),
        taskId: "task-plan",
        purpose: "验证低压区间吸附特征",
        requirements: "保留原始数据与校准记录",
        content: "完成三个压力点的吸附测试",
        executorId: "chen",
        instrumentId: "adsorption",
        priority: "普通",
        plannedStart: "2026-09-25T09:00",
        plannedEnd: "2026-09-25T12:00",
        status: "待接收",
        records: ["林夏 创建实验任务"],
        attachments: [],
        result: "",
        resultType: "文本说明",
        resultAt: "",
        confirmedBy: "",
        exception: "",
        paused: false,
        progress: "待执行",
      },
    ],
    materials: [
      {
        id: "ethanol",
        name: "无水乙醇",
        type: "试剂",
        specification: "分析纯 500mL",
        quantity: 12,
        unit: "瓶",
        location: "试剂柜 A",
        threshold: 5,
        managerId: "chen",
        records: [],
      },
      {
        id: "tube",
        name: "离心管",
        type: "耗材",
        specification: "50mL",
        quantity: 3,
        unit: "盒",
        location: "耗材柜 B",
        threshold: 5,
        managerId: "chen",
        records: [],
      },
    ],
    invocations: [],
    favorites: {},
    drafts: {},
    pendingContext: {},
    pendingCapabilities: {},
    history: {},
    collections: [],
    audit: [],
    requests: [],
    rolePermissions: {
      "Space Admin": [
        "view",
        "members",
        "roles",
        "configure",
        "share",
        "create",
        "archive",
      ],
      "Topic Leader": ["view", "create", "share"],
      Member: ["view", "create"],
      "Asset Manager": ["view", "share"],
      Viewer: ["view"],
    },
  };
}

export function ensureAssistantDemoState(state: State) {
  const defaults = createSeed();
  const taskIds = new Set(state.tasks.map((item) => item.id));
  const sessionIds = new Set(state.sessions.map((item) => item.id));
  const decisionIds = new Set(state.decisions.map((item) => item.id));
  const assistantTaskIds = new Set(["task-read", "task-calculate", "task-experiment"]);
  const projectIds = new Set(state.projects.map((item) => item.id));
  const spaceIds = new Set(state.spaces.map((item) => item.id));
  const memberIds = new Set(state.members.map((item) => item.id));
  const assetIds = new Set(state.assets.map((item) => item.id));
  const artifactIds = new Set(state.artifacts.map((item) => item.id));
  const assistantAssetIds = new Set([
    "dataset-adsorption-benchmark",
    "dataset-shale-public",
    "dataset-catalyst-spectra",
    "dataset-protein-sequence",
    "dataset-microscopy-defect",
    "dataset-sensor-timeseries",
    "dataset-literature-evidence",
    "dataset-molecular-structure",
    "dataset-geology-seismic",
    "dataset-rubber-history",
    "model-rubber-formula",
    "template-rubber-experiment",
    "skill-rubber-evidence",
    "agent-rubber-research",
    "skill-rubber-analysis",
    "dataset-rubber-property",
    "template-rubber-process",
    "skill-patent-route",
    "skill-data-clean",
    "skill-report",
    "skill-chart-extract",
    "skill-research-gap",
    "skill-molecular-simulation",
    "skill-doe-design",
    "skill-citation-audit",
    "model-molecule-generate",
    "model-science-llm",
    "model-image-analysis",
    "model-protein-structure",
    "model-rubber-performance",
    "model-catalyst-activity",
    "model-spectra-multimodal",
  ]);
  const toolIds = new Set(state.tools.map((item) => item.id));
  const catalogToolIds = new Set([
    "tool-data-clean",
    "tool-molecule-convert",
    "tool-science-plot",
    "software-vasp",
    "software-gaussian",
    "software-materials-studio",
    "mcp-literature-search",
    "mcp-eln",
    "mcp-instrument",
  ]);

  for (const template of defaults.tasks.filter((item) => assistantTaskIds.has(item.id))) {
    const existing = state.tasks.find((item) => item.id === template.id);
    if (!existing) continue;
    const previousStatus = existing.status;
    const previousRunAt = existing.runAt;
    const previousCompletedAt = existing.completedAt;
    const previousSteps = new Map(existing.steps.map((step) => [step.id, step]));
    Object.assign(existing, structuredClone(template));
    existing.status = previousStatus;
    existing.runAt = previousRunAt;
    existing.completedAt = previousCompletedAt;
    existing.steps = existing.steps.map((step) => {
      const previous = previousSteps.get(step.id);
      return previous
        ? { ...step, status: previous.status, startedAt: previous.startedAt, completedAt: previous.completedAt }
        : step;
    });
  }
  for (const template of defaults.sessions.filter(
    (item) => !!item.taskId && assistantTaskIds.has(item.taskId),
  )) {
    const existing = state.sessions.find((item) => item.id === template.id);
    if (!existing) continue;
    const templateMessageIds = new Set(template.messages.map((message) => message.id));
    const addedMessages = existing.messages.filter(
      (message) => !templateMessageIds.has(message.id) && message.id.startsWith("m-"),
    );
    Object.assign(existing, structuredClone(template));
    existing.messages.push(...addedMessages);
  }
  for (const template of defaults.decisions.filter((item) => assistantTaskIds.has(item.taskId))) {
    const existing = state.decisions.find((item) => item.id === template.id);
    if (!existing) continue;
    const interaction = {
      status: existing.status,
      choice: existing.choice,
      at: existing.at,
      by: existing.by,
    };
    Object.assign(existing, structuredClone(template), interaction);
  }

  state.projects.push(
    ...defaults.projects
      .filter((item) => item.id === "p-rubber" && !projectIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.spaces.push(
    ...defaults.spaces
      .filter((item) => item.projectId === "p-rubber" && !spaceIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.members.push(
    ...defaults.members
      .filter((item) => item.projectId === "p-rubber" && !memberIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.assets.push(
    ...defaults.assets
      .filter((item) => assistantAssetIds.has(item.id) && !assetIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.tools.push(
    ...defaults.tools
      .filter((item) => catalogToolIds.has(item.id) && !toolIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.artifacts.push(
    ...defaults.artifacts
      .filter((item) => assistantTaskIds.has(item.taskId) && !artifactIds.has(item.id))
      .map((item) => structuredClone(item)),
  );

  state.tasks.push(
    ...defaults.tasks
      .filter((item) => assistantTaskIds.has(item.id) && !taskIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.sessions.push(
    ...defaults.sessions
      .filter((item) => !!item.taskId && assistantTaskIds.has(item.taskId) && !sessionIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  state.decisions.push(
    ...defaults.decisions
      .filter((item) => assistantTaskIds.has(item.taskId) && !decisionIds.has(item.id))
      .map((item) => structuredClone(item)),
  );
  return state;
}

export const userName = (id: string) =>
  Object.values(profiles).find((p) => p.id === id)?.name ?? id;
