import type {
  Asset,
  AssetType,
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
    projects: ["p1"],
    managementProjects: [],
    grants: [],
  },
  analyst: {
    id: "chen",
    name: "陈明",
    roles: ["analyst"],
    projects: ["p1"],
    managementProjects: [],
    grants: [],
  },
  leader: {
    id: "zhao",
    name: "赵岩",
    roles: ["leader"],
    projects: ["p1"],
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
    projects: ["p1", "p2", "p3"],
    managementProjects: ["p1", "p2", "p3"],
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
  for (const a of assets)
    if (a.visibility === "PUBLIC") a.publishStatus = "已发布";
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
  const projects = [
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
    ],
    sessions: tasks.map((t) => ({
      ...scoped(t.sessionIds[0], t.name, t.spaceId, "PRIVATE", t.ownerId),
      taskId: t.id,
      messages: [
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
    ],
    artifacts: [
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

export const userName = (id: string) =>
  Object.values(profiles).find((p) => p.id === id)?.name ?? id;
