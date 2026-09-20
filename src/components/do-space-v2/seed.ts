import type { DoState, Plan, Task, Point } from "./types";
export const dateNow = () => new Date().toLocaleString("sv-SE");
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
export const stages = [
  "样品准备",
  "设备预约",
  "实验前检查",
  "实验执行",
  "结果采集",
  "表征分析",
  "实验结论",
];
export const demoPoints: Point[] = Array.from({ length: 25 }, (_, i) => ({
  x: i * 10,
  a: Number(
    (
      8 +
      48 * Math.exp(-Math.pow((i - 15) / 6, 2)) +
      Math.sin(i * 2) * 1.6
    ).toFixed(2),
  ),
  b: Number(
    (7 + 40 * Math.exp(-Math.pow((i - 14) / 6, 2)) + Math.cos(i) * 1.2).toFixed(
      2,
    ),
  ),
  computed: Number((8 + 52 * Math.exp(-Math.pow((i - 15) / 6, 2))).toFixed(2)),
}));
export function makePlan(
  goal: string,
  projectId: string,
  project: string,
  template = "",
): Plan {
  if (!template)
    template = /页岩|真三轴|裂缝/.test(goal)
      ? "页岩真三轴实验"
      : /薄膜|老化|材料稳定|PE 配方/.test(goal)
        ? "材料稳定性实验"
        : "催化活性验证";
  const shale = template === "页岩真三轴实验";
  const material = template === "材料稳定性实验";
  const id = uid("PLAN");
  return {
    id,
    familyId: id,
    projectId,
    project,
    title: goal.slice(0, 32) || `${template}方案`,
    goal,
    hypothesis: shale
      ? "温度超过 150 ℃后，围压对裂缝破坏模式的影响发生变化。"
      : material
        ? "处理温度与老化时间共同影响材料稳定性。"
        : "反应温度与压力共同影响 CO₂ 转化率和甲醇选择性。",
    method: template,
    materials: shale
      ? "页岩柱状试样，50 × 100 mm，18 件"
      : material
        ? "材料薄膜试样，20 × 20 mm，18 片"
        : "Cu/ZnO/Al₂O₃ 催化剂，0.5 g/份，18 份；CO₂/H₂ 标准混合气",
    sampleCount: 18,
    repeats: 3,
    control: shale
      ? "25 ℃、10 MPa，3 个平行样"
      : material
        ? "25 ℃、0 h，3 个平行样"
        : "220 ℃、2 MPa，3 个平行样",
    parameters: [
      {
        name: "温度",
        value: shale
          ? "25 / 150 / 200"
          : material
            ? "25 / 60 / 85"
            : "220 / 240 / 260",
        unit: "℃",
        source: "计算结果",
        confirmed: true,
      },
      {
        name: shale ? "围压" : material ? "老化时间" : "反应压力",
        value: shale ? "10 / 30" : material ? "0 / 24" : "2 / 4",
        unit: material ? "h" : "MPa",
        source: "AI 建议",
        confirmed: false,
      },
      {
        name: shale ? "加载速率" : material ? "湿度" : "空速",
        value: shale ? "0.5" : material ? "85" : "3000",
        unit: shale ? "MPa/s" : material ? "%" : "mL/(g·h)",
        source: "文献",
        confirmed: true,
      },
    ],
    steps: shale
      ? [
          "样品制备与编号",
          "高温预处理",
          "真三轴加载",
          "CT / 声发射监测",
          "破坏后表征",
        ]
      : material
        ? [
            "薄膜制备与编号",
            "预处理与称量",
            "恒温恒湿老化",
            "力学性能测试",
            "结构表征与分析",
          ]
        : [
            "样品制备与批次登记",
            "催化剂装填与活化",
            "气路检漏与安全检查",
            "温度 / 压力梯度实验",
            "GC 产物检测与重复验证",
          ],
    equipmentId: shale ? "EQ-03" : material ? "EQ-05" : "EQ-01",
    characterization: shale
      ? "CT、声发射、应力应变曲线"
      : material
        ? "拉伸强度、质量变化、SEM"
        : "GC 产物分析、XRD、SEM",
    output: shale
      ? "峰值强度、裂缝方向、破坏模式、声发射特征"
      : material
        ? "强度保持率、质量损失、微观形貌变化"
        : "CO₂ 转化率、甲醇选择性、时空收率与重复性",
    risks: shale
      ? [
          "高温：需隔热防护",
          "高压：加载前校验密封与量程",
          "样品破裂：使用安全防护罩",
        ]
      : material
        ? ["高温表面：佩戴防护手套", "样品老化：保留对照样"]
        : [
            "高温：装填前确认反应器冷却",
            "高压：升压前检查密封与泄压装置",
            "可燃气体：确认氢气检测与排风联锁",
          ],
    evidence: [
      {
        id: "EV-01",
        type: "文献",
        title: "实验方法与条件摘录",
        content:
          "当前课题方法研究摘要，推荐梯度设计并保留对照组。演示证据，请以原文为准。",
      },
      {
        id: "EV-02",
        type: "计算结果",
        title: "敏感参数分析结果",
        content: "温度为主要敏感参数，采用三个温度梯度验证趋势。",
      },
      {
        id: "EV-03",
        type: "标准",
        title: "实验室作业规程 SOP-EXP-012",
        content:
          "演示规程：设备校验、操作资质、风险审批、重复性和原始记录要求。",
      },
    ],
    version: 1,
    status: "草稿",
    route: "重点敏感参数验证",
    owner: "张博士",
    updatedAt: dateNow(),
    reviews: [],
    messages: [],
  };
}
export function makeTask(plan: Plan): Task {
  return {
    id: uid("EXP"),
    projectId: plan.projectId,
    planId: plan.id,
    name: plan.title,
    batch: `B-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`,
    owner: "张博士",
    status: "草稿",
    step: 0,
    sampleIds: [],
    equipmentId: plan.equipmentId,
    checks: [],
    createdAt: dateNow(),
    updatedAt: dateNow(),
    logs: [`${dateNow()} 从已定版方案 V${plan.version} 创建任务`],
    exceptions: [],
    changes: [],
    parameters: structuredClone(plan.parameters),
    resultId: "",
  };
}
export function seed(): DoState {
  const p = makePlan(
    "CO₂ 加氢制甲醇催化剂温压梯度验证",
    "PROJ-CCUS-01",
    "CO₂ 加氢制甲醇催化剂研究",
  );
  p.id = "PLAN-001";
  p.familyId = p.id;
  p.status = "待会签";
  p.version = 2;
  p.updatedAt = "2026-09-21 09:30";
  const final = {
    ...structuredClone(p),
    id: "PLAN-002",
    familyId: "PLAN-002",
    title: "Cu/ZnO 催化剂活性与重复性实验",
    version: 1,
    status: "已定版" as const,
    parameters: p.parameters.map((v) => ({ ...v, confirmed: true })),
    reviews: [
      {
        action: "同意",
        content: "样品、量程和安全条件已核对。",
        author: "王研究员",
        time: "2026-09-20 14:10",
      },
    ],
  };
  const draft = {
    ...structuredClone(p),
    id: "PLAN-003",
    familyId: "PLAN-003",
    title: "催化剂长周期稳定性补充实验",
    status: "草稿" as const,
    version: 1,
  };
  const t = makeTask(final);
  t.id = "EXP-001";
  t.name = "Cu/ZnO 催化剂活性测试 · 第一批";
  t.status = "执行中";
  t.step = 3;
  t.sampleIds = ["S-01"];
  t.checks = ["样品条件", "设备与预约", "高风险实验", "实验前审核"];
  t.createdAt = "2026-09-21 08:00";
  t.updatedAt = "2026-09-21 10:20";
  const done = {
    ...structuredClone(t),
    id: "EXP-002",
    name: "Cu/ZnO 催化剂活性测试 · 对照批",
    status: "已完成",
    step: 6,
    resultId: "RES-001",
    sampleIds: ["S-02"],
  };
  return {
    plans: [
      p,
      final,
      draft,
      {
        ...structuredClone(p),
        id: "PLAN-001-V1",
        version: 1,
        status: "已废止",
        parameters: p.parameters.map((v, i) =>
          i === 0 ? { ...v, value: "220 / 230 / 240" } : v,
        ),
        updatedAt: "2026-09-19 16:00",
      },
    ],
    tasks: [t, done],
    samples: [
      {
        id: "S-01",
        projectId: p.projectId,
        name: "Cu/ZnO 催化剂 A",
        batch: "S20260921",
        type: "粉末",
        quantity: 18,
        unit: "份",
        status: "已制备",
        storage: "干燥避光 / 室温",
        location: "实验楼 A · 样品柜 03",
        taskId: t.id,
        eln: "ELN-2026-0921",
        lims: "LIMS-S-001",
        traces: [
          "2026-09-20 09:00 · 李工制备并编号",
          "2026-09-21 08:30 · 张博士领取 18 份，关联 EXP-001",
        ],
      },
      {
        id: "S-02",
        projectId: p.projectId,
        name: "Cu/ZnO 对照样品 B",
        batch: "S20260920",
        type: "粉末",
        quantity: 18,
        unit: "份",
        status: "已完成",
        storage: "干燥避光 / 室温",
        location: "实验楼 A · 留样柜",
        taskId: done.id,
        eln: "ELN-2026-0920",
        lims: "LIMS-S-002",
        traces: ["2026-09-20 · 入库", "2026-09-20 · 完成检测，转留样柜"],
      },
      {
        id: "S-03",
        projectId: p.projectId,
        name: "催化剂 C / 待制备",
        batch: "S20260922",
        type: "粉末",
        quantity: 6,
        unit: "份",
        status: "待制备",
        storage: "室温",
        location: "制样室",
        taskId: "",
        eln: "ELN-2026-0922",
        lims: "LIMS-S-003",
        traces: ["2026-09-21 · 创建制样计划"],
      },
    ],
    equipment: [
      {
        id: "EQ-01",
        name: "高压固定床反应系统",
        type: "催化反应",
        status: "空闲",
        access: "已接入",
        range: "20–400 ℃ / 0–10 MPa",
        organization: "能源催化实验室",
        sharing: "课题组内 / 校内共享",
        hours: "周一至周五 08:00–18:00",
        condition: "需培训资质，高压实验需安全审核",
        owner: "刘工",
        source: "iLOMS · DEV-001",
      },
      {
        id: "EQ-02",
        name: "气相色谱仪 GC-2030",
        type: "成分分析",
        status: "使用中",
        access: "已接入",
        range: "FID / TCD 双检测器",
        organization: "分析测试中心",
        sharing: "校内共享",
        hours: "周一至周五 08:00–18:00",
        condition: "样品需满足进样浓度要求",
        owner: "王工",
        source: "iLOMS · DEV-002",
      },
      {
        id: "EQ-03",
        name: "高温高压真三轴实验系统",
        type: "力学试验",
        status: "空闲",
        access: "部分接入",
        range: "25–300 ℃ / 0–60 MPa",
        organization: "岩石力学实验室",
        sharing: "预约审核后共享",
        hours: "周一至周五 08:00–18:00",
        condition: "持证操作，需核对样品尺寸",
        owner: "陈工",
        source: "iLOMS · DEV-003",
      },
      {
        id: "EQ-04",
        name: "场发射扫描电镜 SEM",
        type: "形貌表征",
        status: "维护中",
        access: "已接入",
        range: "分辨率 1 nm",
        organization: "分析测试中心",
        sharing: "校内共享",
        hours: "维护结束后开放",
        condition: "样品需导电或完成喷金",
        owner: "赵工",
        source: "iLOMS · DEV-004",
      },
      {
        id: "EQ-05",
        name: "恒温恒湿试验箱",
        type: "环境试验",
        status: "空闲",
        access: "未接入",
        range: "20–150 ℃ / 20–95 %RH",
        organization: "材料实验室",
        sharing: "课题组内",
        hours: "周一至周五 08:00–18:00",
        condition: "运行状态由管理员人工核实",
        owner: "孙工",
        source: "人工登记 · DEV-005",
      },
    ],
    bookings: [
      {
        id: "BK-001",
        projectId: p.projectId,
        planId: final.id,
        taskId: t.id,
        equipmentId: "EQ-01",
        date: "2026-09-21",
        start: 8,
        end: 12,
        sampleId: "S-01",
        owner: "张博士",
        purpose: "温压梯度验证",
        status: "已确认",
      },
      {
        id: "BK-002",
        projectId: p.projectId,
        planId: final.id,
        taskId: "",
        equipmentId: "EQ-02",
        date: "2026-09-22",
        start: 10,
        end: 12,
        sampleId: "S-02",
        owner: "李工",
        purpose: "产物组分检测",
        status: "已确认",
      },
    ],
    results: [
      {
        id: "RES-001",
        projectId: p.projectId,
        taskId: done.id,
        sampleId: "S-02",
        name: "对照批 GC 活性测量",
        method: "GC",
        points: structuredClone(demoPoints),
        processed: false,
        operations: [],
        report: "",
        confirmed: false,
        createdAt: "2026-09-20 16:30",
      },
    ],
    transfers: [],
  };
}
