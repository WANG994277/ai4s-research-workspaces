export const views = [
  ["overview", "管理驾驶舱", "科研管理概览"],
  ["trend", "科技态势分析", "专题态势监测"],
  ["strategy", "战略方向研判", "技术方向证据研判"],
  ["resources", "资源统筹配置", "科研资源供需看板"],
  ["projects", "重大项目监管", "项目进度与风险穿透"],
  ["outcomes", "科技成果展示", "成果专题展示"],
  ["technology-tree", "科技树", "技术谱系与布局"],
] as const;
export type View = (typeof views)[number][0];
export type Filters = {
  org: string;
  field: string;
  period: string;
  source: string;
  status: string;
  type: string;
  share: string;
};
export const defaults: Filters = {
  org: "中国石油集团有限公司",
  field: "全部领域",
  period: "2019 - 2024",
  source: "全部",
  status: "全部",
  type: "全部",
  share: "全部",
};
export const organizations = [
  "中国石油集团有限公司",
  "勘探开发研究院",
  "石油化工研究院",
  "海洋工程研究院",
];
export const fields = [
  "全部领域",
  "油气勘探开发",
  "碳捕集与封存（CCUS）",
  "新能源与新材料",
];
export const colors = [
  "#C8102E",
  "#2878FF",
  "#00B889",
  "#9254FF",
  "#FF941F",
  "#7890A6",
];
export const number = (n: number) => n.toLocaleString("zh-CN");
export type Scope = {
  org: string;
  field: string;
  year: number;
  source: string;
};
export function inScope(row: Scope, filters: Filters) {
  const years = filters.period.match(/\d{4}/g)?.map(Number) ?? [2019, 2024];
  return (
    (filters.org === organizations[0] || row.org === filters.org) &&
    (filters.field === "全部领域" || row.field === filters.field) &&
    (filters.source === "全部" || row.source === filters.source) &&
    row.year >= years[0] &&
    row.year <= (years[1] ?? years[0])
  );
}
export const directions = [
  {
    id: "deep",
    name: "深层油气智能地质建模",
    heat: 92,
    maturity: 65,
    opportunity: 88,
    uncertainty: 28,
    confirmed: true,
    field: fields[1],
  },
  {
    id: "shale",
    name: "非常规油气甜点预测",
    heat: 85,
    maturity: 58,
    opportunity: 82,
    uncertainty: 35,
    confirmed: false,
    field: fields[1],
  },
  {
    id: "digital",
    name: "油气藏数字孪生与动态优化",
    heat: 78,
    maturity: 72,
    opportunity: 80,
    uncertainty: 32,
    confirmed: true,
    field: fields[1],
  },
  {
    id: "ccus",
    name: "CO₂地质封存与利用（CCUS）",
    heat: 76,
    maturity: 70,
    opportunity: 75,
    uncertainty: 38,
    confirmed: false,
    field: fields[2],
  },
  {
    id: "catalyst",
    name: "低碳炼化工艺智能优化",
    heat: 68,
    maturity: 77,
    opportunity: 72,
    uncertainty: 40,
    confirmed: true,
    field: fields[2],
  },
  {
    id: "equipment",
    name: "油气装备智能运维与故障预测",
    heat: 65,
    maturity: 73,
    opportunity: 70,
    uncertainty: 42,
    confirmed: false,
    field: fields[1],
  },
  {
    id: "offshore",
    name: "海洋油气智能勘探",
    heat: 62,
    maturity: 55,
    opportunity: 68,
    uncertainty: 48,
    confirmed: false,
    field: fields[1],
  },
  {
    id: "hydrogen",
    name: "氢能与新能源耦合利用",
    heat: 55,
    maturity: 48,
    opportunity: 60,
    uncertainty: 55,
    confirmed: false,
    field: fields[3],
  },
  {
    id: "well",
    name: "油气田智能生产与调控",
    heat: 53,
    maturity: 66,
    opportunity: 58,
    uncertainty: 51,
    confirmed: false,
    field: fields[1],
  },
  {
    id: "materials",
    name: "耐高温抗腐蚀新型合金材料",
    heat: 49,
    maturity: 62,
    opportunity: 56,
    uncertainty: 53,
    confirmed: false,
    field: fields[3],
  },
];
export type Direction = (typeof directions)[number];
export const evidenceTypes = ["论文", "专利", "标准", "项目"] as const;
export type EvidenceType = (typeof evidenceTypes)[number];
const evidenceSources = [
  "Web of Science",
  "中国专利数据库",
  "国家标准库",
  "科研管理",
];
// 固定的历史聚合演示数据。所有图表和统计按相同筛选后的记录汇总。
export const evidence = directions.flatMap((d, i) =>
  [0, 1, 2, 3, 4, 5].flatMap((yi) =>
    evidenceTypes.flatMap((type, ti) =>
      organizations.slice(1).map((org, oi) => ({
        id: `${d.id}-${yi}-${ti}-${oi}`,
        direction: d.id,
        name: d.name,
        type,
        org,
        field: d.field,
        year: 2019 + yi,
        source: evidenceSources[ti],
        count: Math.round(
          (110 - i * 7) *
            (0.45 + yi * 0.18) *
            [1, 0.34, 0.065, 0.18][ti] *
            [1, 0.6, 0.35][oi],
        ),
        country: ["中国", "中国", "中国", "美国", "美国", "欧洲"][(i + oi) % 6],
        institution: [
          "中国石油大学（北京）",
          "中国石油化工研究院",
          "中国科学院大连化学物理研究所",
          "斯坦福大学",
          "麻省理工学院",
          "苏黎世联邦理工学院",
        ][(i + oi) % 6],
      })),
    ),
  ),
);
export type Evidence = (typeof evidence)[number];
export function sumEvidence(rows: Evidence[], type?: string) {
  return rows
    .filter((r) => !type || r.type === type)
    .reduce((n, r) => n + r.count, 0);
}
export const news = [
  {
    id: "n1",
    type: "论文",
    title: "基于生成式AI的油气储层流体性质预测方法研究",
    institution: "中国石油大学（北京）",
    tags: ["AI4S", "油气储层", "机器学习"],
    date: "2024-12-10",
    direction: "deep",
  },
  {
    id: "n2",
    type: "专利",
    title: "一种深层致密砂岩气藏压裂优化方法",
    institution: "中国石油股份有限公司",
    tags: ["深层油气", "压裂改造"],
    date: "2024-12-08",
    direction: "shale",
  },
  {
    id: "n3",
    type: "标准",
    title: "二氧化碳地质封存监测技术规范（征求意见稿）",
    institution: "全国石油天然气标准化技术委员会",
    tags: ["CCUS", "监测", "行业标准"],
    date: "2024-12-05",
    direction: "ccus",
  },
  {
    id: "n4",
    type: "论文",
    title: "金属有机框架材料在天然气分离中的应用进展",
    institution: "清华大学",
    tags: ["新型材料", "气体分离"],
    date: "2024-12-02",
    direction: "materials",
  },
  {
    id: "n5",
    type: "专利",
    title: "一种基于机器学习的地震数据智能解释方法",
    institution: "中海油研究总院",
    tags: ["地震勘探", "人工智能"],
    date: "2024-11-28",
    direction: "offshore",
  },
];
export const projectRecords = [
  [
    "p1",
    "深层油气先进勘探开发重大专项",
    "4/6",
    "试验验证阶段，关键装备测试中",
    "高",
    68,
    "A4S",
    "李明",
    50000,
    "在研",
  ],
  [
    "p2",
    "非常规油气规模开发与示范",
    "3/5",
    "现场试验稳步推进",
    "中",
    52,
    "科研管理",
    "王芳",
    32000,
    "在研",
  ],
  [
    "p3",
    "CCUS全链条技术研发与示范",
    "5/7",
    "中试装置建设进行中",
    "低",
    76,
    "创新平台",
    "陈磊",
    28000,
    "在研",
  ],
  [
    "p4",
    "新能源与新材料关键技术",
    "2/4",
    "关键材料性能优化",
    "高",
    41,
    "A4S",
    "赵敏",
    18000,
    "在研",
  ],
  [
    "p5",
    "数字化智能油田示范工程",
    "4/6",
    "平台开发与集成测试",
    "中",
    63,
    "科研管理",
    "张伟",
    24000,
    "在研",
  ],
  [
    "p6",
    "深地地质与非常规资源评价",
    "5/5",
    "数据处理与成果归档",
    "低",
    100,
    "A4S",
    "刘洋",
    21000,
    "已结题",
  ],
  [
    "p7",
    "海洋油气勘探开发关键技术",
    "2/6",
    "海试装备研制",
    "中",
    46,
    "创新平台",
    "周宁",
    38000,
    "在研",
  ],
  [
    "p8",
    "氢能与低碳能源示范项目",
    "1/4",
    "前期研究阶段",
    "低",
    28,
    "科研管理",
    "孙悦",
    16000,
    "待启动",
  ],
].map((r, i) => ({
  id: String(r[0]),
  name: String(r[1]),
  milestone: String(r[2]),
  phase: String(r[3]),
  risk: String(r[4]),
  progress: Number(r[5]),
  source: String(r[6]),
  owner: String(r[7]),
  budget: Number(r[8]),
  status: String(r[9]),
  org: organizations[(i % 3) + 1],
  field: fields[[1, 1, 2, 3, 1, 1, 1, 3][i]],
  year: i === 5 ? 2023 : 2024,
  code: `2021ZX050${i + 1}`,
  index: i,
  milestones: Array.from(
    { length: Number(String(r[2]).split("/")[1]) },
    (_, j) => ({
      id: `p${i + 1}-m${j + 1}`,
      name: [
        "地质认识与目标优选完成",
        "关键技术方案验证",
        "试验区钻探与测试",
        "工业化方案编制",
        "成果总结与推广应用",
        "项目验收与技术归档",
        "示范应用效果评估",
      ][j],
      shortName: ["立项", "验证", "测试", "编制", "推广", "验收", "评估"][j],
      date: `${j === 0 ? 2022 : j === 1 ? 2023 : j < Number(String(r[2]).split("/")[0]) ? (i === 5 ? 2023 : 2024) : 2025}-${String(Math.min(12, j * 2 + 1)).padStart(2, "0")}-20`,
      status:
        j < Number(String(r[2]).split("/")[0])
          ? "已完成"
          : j === Number(String(r[2]).split("/")[0])
            ? "进行中"
            : "未开始",
    }),
  ),
}));
export type ProjectRecord = (typeof projectRecords)[number];
export const resourceRecords = [
  ["A100-集群1", "GPU", "1,024 卡", 96.2, 48, 85, 72, 26, 40, "算力资源"],
  ["H800-集群2", "GPU", "512 卡", 92.1, 32, 56, 43, 32, 18, "算力资源"],
  ["通用CPU-集群3", "CPU", "10,240 核", 88.3, 28, 68, 52, 28, 16, "算力资源"],
  ["存储-高性能", "存储", "5 PB", 85.6, 22, 62, 46, 36, 8, "算力资源"],
  ["昇腾NPU-集群1", "NPU", "1,024 卡", 82.4, 18, 38, 28, 20, 12, "算力资源"],
  ["高性能CPU-集群1", "CPU", "4,096 核", 78.9, 14, 42, 36, 18, 10, "算力资源"],
  ["高分辨质谱仪", "分析设备", "2 台", 94.5, 12, 120, 108, 12, 16, "科研设备"],
  ["核磁共振波谱仪", "表征设备", "3 台", 81.2, 8, 96, 78, 18, 10, "科研设备"],
  ["高温高压反应装置", "实验设备", "4 套", 63.4, 4, 88, 56, 32, 6, "科研设备"],
  ["岩心CT扫描系统", "成像设备", "2 台", 72.6, 6, 80, 58, 22, 8, "科研设备"],
  [
    "储层建模研究组",
    "地质专家",
    "18 人",
    91.2,
    6,
    140,
    128,
    12,
    20,
    "科研人员",
  ],
  [
    "低碳催化研究组",
    "化学专家",
    "24 人",
    83.6,
    4,
    160,
    134,
    26,
    14,
    "科研人员",
  ],
  ["新能源材料团队", "材料专家", "16 人", 68.5, 2, 120, 82, 38, 8, "科研人员"],
].map((r, i) => ({
  id: `resource-${i}`,
  name: String(r[0]),
  type: String(r[1]),
  capacity: String(r[2]),
  utilization: Number(r[3]),
  queue: Number(r[4]),
  demand: Number(r[5]),
  occupied: Number(r[6]),
  available: Number(r[7]),
  pending: Number(r[8]),
  category: String(r[9]),
  org: organizations[(i % 3) + 1],
  field: fields[(i % 3) + 1],
  year: 2024,
  source: "A4S",
}));
export type ResourceRecord = (typeof resourceRecords)[number];
export const outcomes = [
  {
    id: "o1",
    name: "新型高效催化剂在CO₂加氢制甲醇中的应用",
    type: "专利",
    topic: "能源化工",
    field: fields[2],
    image: "molecule",
    project: "CCUS全链条技术研发与示范",
    projectId: "p3",
    description:
      "提供一种新型高效催化剂及其制备方法，提升 CO₂ 加氢制甲醇的催化活性和稳定性，为碳资源化利用提供新的路径。",
    date: "2024-12-10",
    approved: true,
    shared: true,
    converted: true,
    amount: 8600,
  },
  {
    id: "o2",
    name: "深水油气田智能监测与风险预警系统",
    type: "软件著作权",
    topic: "石油工程",
    field: fields[1],
    image: "wind",
    project: "海洋油气勘探开发关键技术",
    projectId: "p7",
    description:
      "面向深水油气田的多源数据融合与智能分析系统，实现生产过程的实时监测与风险预警，提升作业安全性与效率。",
    date: "2024-12-08",
    approved: true,
    shared: true,
    converted: true,
    amount: 4200,
  },
  {
    id: "o3",
    name: "耐高温抗腐蚀新型合金材料",
    type: "专利",
    topic: "新材料",
    field: fields[3],
    image: "material",
    project: "新能源与新材料关键技术",
    projectId: "p4",
    description:
      "开发耐高温、抗腐蚀的新型合金材料，适用于极端工况下的油气装备制造，延长设备服役寿命。",
    date: "2024-12-05",
    approved: true,
    shared: true,
    converted: false,
    amount: 0,
  },
  {
    id: "o4",
    name: "氢能储运关键技术与示范应用",
    type: "标准规范",
    topic: "清洁能源",
    field: fields[3],
    image: "hydrogen",
    project: "氢能与低碳能源示范项目",
    projectId: "p8",
    description:
      "形成氢能储运技术标准体系，提出高安全性储运方案，并在示范工程中开展应用。",
    date: "2024-12-03",
    approved: true,
    shared: false,
    converted: true,
    amount: 3800,
  },
  {
    id: "o5",
    name: "非常规油气储层压裂改造优化技术",
    type: "论文",
    topic: "非常规油气",
    field: fields[1],
    image: "wind",
    project: "非常规油气规模开发与示范",
    projectId: "p2",
    description:
      "基于多尺度裂缝网络分析，提出压裂改造优化方法，提高非常规储层的单井产量。",
    date: "2023-11-28",
    approved: true,
    shared: true,
    converted: false,
    amount: 0,
  },
  {
    id: "o6",
    name: "数字孪生油藏动态优化方法",
    type: "技术成果",
    topic: "AI4S",
    field: fields[1],
    image: "molecule",
    project: "数字化智能油田示范工程",
    projectId: "p5",
    description: "融合生产历史与物理模型，建立油藏动态预测及注采优化方案。",
    date: "2024-11-21",
    approved: false,
    shared: false,
    converted: false,
    amount: 0,
  },
].map((r, i) => ({
  ...r,
  year: Number(r.date.slice(0, 4)),
  org: organizations[(i % 3) + 1],
  source: ["A4S", "科研管理", "创新平台"][i % 3],
  application: `CN20231012345${i + 6}.7`,
  owner: ["张伟", "李娜", "王强"][i % 3],
}));
export type Outcome = (typeof outcomes)[number];
