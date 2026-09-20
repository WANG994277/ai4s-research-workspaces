export type Activity = {
  id: string;
  actor: string;
  action: string;
  time: string;
};
export type Member = { name: string; role: string; responsibility: string };
export type Milestone = {
  id: string;
  name: string;
  due: string;
  status: string;
};
export type ProjectTask = {
  id: string;
  name: string;
  owner: string;
  due: string;
  status: string;
  risk: string;
};
export type ResearchProject = {
  id: string;
  name: string;
  org: string;
  direction: string;
  owner: string;
  status: string;
  start: string;
  end: string;
  updated: string;
  description: string;
  managementId: string;
  tags: string[];
  members: Member[];
  milestones: Milestone[];
  tasks: ProjectTask[];
  folders: string[];
  activities: Activity[];
};
export type Handoff = {
  id: string;
  from: string;
  to: string;
  content: string;
  time: string;
  status: string;
  acceptedAt?: string;
  resumeStatus?: string;
};
export type Issue = {
  id: string;
  title: string;
  level: string;
  owner: string;
  status: string;
  description: string;
  resolution: string;
  comments: string[];
  created: string;
};
export type Experiment = {
  id: string;
  name: string;
  projectId: string;
  org: string;
  type: string;
  owner: string;
  operator: string;
  status: string;
  start: string;
  end: string;
  goal: string;
  location: string;
  device: string;
  sample: string;
  recordId: string;
  updated: string;
  members: Member[];
  handoffs: Handoff[];
  issues: Issue[];
  activities: Activity[];
};
export type FileVersion = {
  version: number;
  content: string;
  time: string;
  author: string;
};
export type ResearchFile = {
  id: string;
  name: string;
  type: string;
  projectId: string;
  folder: string;
  tags: string[];
  author: string;
  updated: string;
  content: string;
  version: number;
  versions: FileVersion[];
  comments: {
    author: string;
    content: string;
    time: string;
    resolved: boolean;
  }[];
  shares: { recipient: string; permission: string }[];
  refs: { type: string; id: string; name: string }[];
  favorite: boolean;
  deleted: boolean;
  dataUrl?: string;
  mime?: string;
  size?: number;
};
export type Expert = {
  id: string;
  name: string;
  title: string;
  org: string;
  field: string;
  directions: string[];
  services: string[];
  status: string;
  bio: string;
  conditions: string;
  achievements: string[];
  experience: string[];
  favorite: boolean;
};
export type Consultation = {
  id: string;
  expertId: string;
  projectId: string;
  title: string;
  service: string;
  due: string;
  description: string;
  expected: string;
  status: string;
  created: string;
  messages: { actor: string; content: string; time: string }[];
  result: string;
  rating: string;
  feedback: string;
};
export type CollaborationData = {
  version: 1;
  projects: ResearchProject[];
  experiments: Experiment[];
  files: ResearchFile[];
  experts: Expert[];
  consultations: Consultation[];
};
export const today = '2026-09-20';
export const timestamp = () =>
  new Date().toLocaleString('zh-CN', { hour12: false });
export const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
export const activity = (action: string, actor = '张博士'): Activity => ({
  id: uid('ACT'),
  actor,
  action,
  time: timestamp(),
});

const projectBriefs = [
  [
    'PROJ-DEEP-06',
    '深层油气智能勘探关键技术研究',
    '勘探开发研究院',
    '油气勘探',
    '王强',
    '在研',
  ],
  [
    'PROJ-CCUS-01',
    'CO₂ 加氢制甲醇催化剂研究',
    '炼化研究中心',
    '催化化学',
    '张博士',
    '在研',
  ],
  ['PROJ-PE-02', '功能性 PE 配方优化', '材料研究所', '新材料', '李工', '在研'],
  [
    'PROJ-RES-03',
    '储层智能评价方法研究',
    '勘探开发研究院',
    '油气勘探',
    '王研究员',
    '规划中',
  ],
  [
    'PROJ-HDS-04',
    '加氢脱硫催化剂性能提升',
    '炼化研究中心',
    '催化化学',
    '赵博士',
    '在研',
  ],
  [
    'PROJ-PIPE-05',
    '管道腐蚀预测与防护',
    '管道技术研究所',
    '腐蚀防护',
    '陈工',
    '已结题',
  ],
];
export const seedProjects: ResearchProject[] = projectBriefs.map(
  ([id, name, org, direction, owner, status], i) => ({
    id,
    name,
    org,
    direction,
    owner,
    status,
    start: '2026-01-01',
    end: '2027-12-31',
    updated: `2026-09-${20 - i}`,
    description: `围绕${name}，开展基础资料整理、关键方法验证与成果评价。以课题空间组织文献、计算与实验产物，明确团队分工，跟踪阶段进展和风险。`,
    managementId: `KC2026-${String(i + 12).padStart(4, '0')}`,
    tags: [direction, '技术研究', '协同攻关'],
    members: [
      {
        name: owner,
        role: '课题负责人',
        responsibility: '总体组织、节点审查与成果确认',
      },
      { name: '李明', role: '科研人员', responsibility: '资料整理与模型验证' },
      {
        name: '张华',
        role: '实验操作人',
        responsibility: '实验执行、数据记录与交接',
      },
    ],
    milestones: [
      {
        id: `MS-${i}-1`,
        name: '立项启动',
        due: '2026-01-15',
        status: '已完成',
      },
      {
        id: `MS-${i}-2`,
        name: '数据与方法准备',
        due: '2026-06-30',
        status: '已完成',
      },
      {
        id: `MS-${i}-3`,
        name: '关键技术验证',
        due: '2026-09-30',
        status: '进行中',
      },
      {
        id: `MS-${i}-4`,
        name: '成果总结',
        due: '2027-12-15',
        status: '未开始',
      },
    ],
    tasks: [
      {
        id: `TASK-${i}-1`,
        name: '补充阶段研究材料',
        owner,
        due: '2026-09-25',
        status: '进行中',
        risk: i === 0 ? '关键样品交付延迟' : '',
      },
      {
        id: `TASK-${i}-2`,
        name: '核对实验数据与证据来源',
        owner: '张华',
        due: '2026-09-28',
        status: '未开始',
        risk: '',
      },
    ],
    folders: ['文档', '笔记', '数据', '报告'],
    activities: [
      {
        id: `ACT-${i}`,
        actor: owner,
        action: '更新了课题基础信息与阶段计划',
        time: `2026-09-${20 - i} 10:24`,
      },
    ],
  }),
);
const experimentNames = [
  '深层油气智能勘探关键技术实验',
  'CO₂ 催化活性评价实验',
  'PE 配方正交实验',
  '储层岩心驱替实验',
  '催化剂表征与稳定性测试',
  '管道材料腐蚀测试',
];
export const seedExperiments: Experiment[] = seedProjects.map((p, i) => ({
  id: i === 1 ? 'GB-2026-0915' : `EXP-2026-${String(i + 12).padStart(4, '0')}`,
  name: experimentNames[i],
  projectId: p.id,
  org: p.org,
  type: ['室内实验', '分析测试', '模拟实验', '岩心实验'][i % 4],
  owner: p.owner,
  operator: '李明',
  status: ['进行中', '异常', '准备中', '结果处理', '已完成', '待交接'][i],
  start: '2026-09-01',
  end: '2026-10-31',
  goal: `通过${experimentNames[i]}验证课题研究假设，形成可追溯的实验数据与分析结论。`,
  location: '重点实验室 A 区',
  device: i === 1 ? '固定床反应器' : '综合实验平台',
  sample: `样品批次 B-202609-${i + 1}`,
  recordId: i === 1 ? 'ELN-0915' : '',
  updated: `2026-09-${20 - i}`,
  members: p.members,
  handoffs:
    i === 5
      ? [
          {
            id: 'HAND-SEED',
            from: '李明',
            to: '张华',
            content: '样品数据已整理，交接结果分析工作。',
            time: '2026-09-19 14:00',
            status: '待接收',
          },
        ]
      : [],
  issues:
    i === 1
      ? [
          {
            id: 'ISSUE-001',
            title: '催化活性数据异常波动',
            level: '高',
            owner: '张华',
            status: '待处理',
            description: '活性记录与前一批次存在差异，需要核对温度与采样记录。',
            resolution: '',
            comments: ['李明：原始记录已附在实验文件中。'],
            created: '2026-09-20',
          },
        ]
      : [],
  activities: [
    {
      id: `EA-${i}`,
      actor: p.owner,
      action: '建立实验任务，明确负责人和操作人',
      time: '2026-09-18 09:30',
    },
  ],
}));
const fileNames = [
  '深层油气勘探技术方案设计',
  '实验方案设计与风险说明',
  '地层压力预测模型',
  '实验数据汇总_202609',
  '阶段性研究总结',
  '项目中期汇报',
  '文献阅读笔记：催化剂机理',
  '数值模拟参数设置说明',
  '下一步实验验证计划',
];
export const seedFiles: ResearchFile[] = fileNames.map((name, i) => ({
  id: `DOC-${String(i + 1).padStart(3, '0')}`,
  name,
  type: ['文档', '文档', 'PDF', '数据', '报告', '报告', '笔记', '文档', '笔记'][
    i
  ],
  projectId: seedProjects[i % 3].id,
  folder: [
    '文档',
    '文档',
    '文档',
    '数据',
    '报告',
    '报告',
    '笔记',
    '文档',
    '笔记',
  ][i],
  tags: [
    ['技术方案', '研究背景'],
    ['实验设计', '风险'],
    ['模型', '参数'],
    ['实验数据', '分析'],
  ][i % 4],
  author: ['王强', '张博士', '李明', '张华'][i % 4],
  updated: `2026-09-${20 - i}`,
  content: `## 1. 研究背景与目标\n围绕${seedProjects[i % 3].name}，整理阶段研究材料，明确本次研究的关键问题、输入条件和预期产物。\n\n## 2. 技术路线\n- 收集并核验文献与实验资料\n- 比较研究方法，记录适用条件与不确定性\n- 开展验证，保存参数、结果和来源\n\n## 3. 下一步工作\n完善数据质量检查，并在课题组内讨论确认。`,
  version: 1,
  versions: [],
  comments:
    i < 3
      ? [
          {
            author: '李明',
            content: '请补充输入数据的来源与版本。',
            time: '2026-09-19 10:00',
            resolved: false,
          },
        ]
      : [],
  shares: i % 2 === 0 ? [{ recipient: '课题成员', permission: '可查看' }] : [],
  refs: [
    {
      type: '课题',
      id: seedProjects[i % 3].id,
      name: seedProjects[i % 3].name,
    },
  ],
  favorite: i === 0,
  deleted: false,
}));
export const seedExperts: Expert[] = [
  {
    id: 'EXPERT-001',
    name: '王强',
    title: '研究员',
    org: '勘探开发研究院',
    field: '油气勘探',
    directions: ['油气勘探', '人工智能', '储层地质', '数值模拟'],
    services: ['技术咨询', '项目评审'],
    status: '可咨询',
    bio: '长期从事油气藏成藏理论与勘探评价研究，关注深层油气、非常规油气的关键技术验证。',
    conditions: '请提供课题背景、研究目标和待讨论材料；建议提前3个工作日预约。',
    achievements: [
      '深层复杂油气藏关键技术研究',
      '多源数据融合的储层预测方法',
      '非常规油气开发技术评价',
    ],
    experience: [
      '2020年至今 · 勘探开发研究院 · 研究员',
      '2014—2020年 · 油气资源评价课题组 · 技术负责人',
    ],
    favorite: false,
  },
  {
    id: 'EXPERT-002',
    name: '李娜',
    title: '高级工程师',
    org: '炼化研究中心',
    field: '催化化学',
    directions: ['催化化学', '清洁能源', '碳中和', '反应工程'],
    services: ['技术咨询', '方案论证'],
    status: '可咨询',
    bio: '从事催化转化与清洁能源技术研究，擅长实验设计和催化剂性能评价。',
    conditions: '需明确催化体系、评价指标和实验条件。',
    achievements: ['催化剂稳定性评价方法', 'CO₂ 催化转化路线比较'],
    experience: ['2019年至今 · 炼化研究中心 · 催化课题组'],
    favorite: false,
  },
  {
    id: 'EXPERT-003',
    name: '张伟',
    title: '教授',
    org: '石油工程研究院',
    field: '油藏工程',
    directions: ['油藏工程', '数字油田', '生产优化'],
    services: ['技术咨询', '项目评审'],
    status: '需预约',
    bio: '研究油藏动态分析与智能决策方法，结合机理与数据开展油田生产优化。',
    conditions: '当前服务需预约，请说明期望时间和数据范围。',
    achievements: ['多尺度油藏数值模拟方法', '油藏生产优化评价'],
    experience: ['2018年至今 · 石油工程研究院 · 研究负责人'],
    favorite: false,
  },
  {
    id: 'EXPERT-004',
    name: '刘洋',
    title: '高级工程师',
    org: '石油工程研究院',
    field: '钻井工程',
    directions: ['钻井工程', '井筒力学', '智能钻井'],
    services: ['方案论证'],
    status: '可咨询',
    bio: '从事复杂地层钻井与井筒工程技术研究。',
    conditions: '提供现场边界条件及已有设计材料。',
    achievements: ['复杂地层钻井优化设计'],
    experience: ['2016年至今 · 钻井工程研究团队'],
    favorite: false,
  },
  {
    id: 'EXPERT-005',
    name: '陈敏',
    title: '研究员',
    org: '勘探开发研究院',
    field: '地球物理',
    directions: ['地球物理', '储层预测', '数据融合'],
    services: ['技术咨询', '项目评审'],
    status: '可咨询',
    bio: '关注地震解释与多源资料融合，支持储层预测和评价。',
    conditions: '资料应具有清晰坐标、数据来源和使用授权。',
    achievements: ['多源地震资料融合分析'],
    experience: ['2021年至今 · 地球物理研究团队'],
    favorite: false,
  },
  {
    id: 'EXPERT-006',
    name: '赵磊',
    title: '高级工程师',
    org: '管道技术研究所',
    field: '腐蚀防护',
    directions: ['管道工程', '完整性评价'],
    services: ['技术咨询'],
    status: '暂不可约',
    bio: '从事管道完整性评价、腐蚀监测与防护研究。',
    conditions: '近期暂不可约，可先收藏档案。',
    achievements: ['管道材料腐蚀监测方法'],
    experience: ['2017年至今 · 管道技术研究所'],
    favorite: false,
  },
];
export const seedData: CollaborationData = {
  version: 1,
  projects: seedProjects,
  experiments: seedExperiments,
  files: seedFiles,
  experts: seedExperts,
  consultations: [],
};
