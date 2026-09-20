export type RecordStatus = '进行中' | '待确认' | '已完成' | '需关注';

export interface ResearchRecord {
  id: string;
  name: string;
  description: string;
  project: string;
  owner: string;
  status: RecordStatus;
  updatedAt: string;
  source: string;
  kind: 'project' | 'literature' | 'compute' | 'experiment' | 'device' | 'workflow' | 'asset' | 'expert' | 'tool' | 'admin';
}

export const projects: ResearchRecord[] = [
  { id: 'PROJ-SHALE-06', name: '深层页岩气储层机理研究', description: '研究温压耦合对页岩裂缝扩展的影响，进行计算与实验对照。', project: '深层页岩气储层机理研究', owner: '张博士', status: '进行中', updatedAt: '今天 10:20', source: 'AI4S', kind: 'project' },
  { id: 'PROJ-CCUS-01', name: 'CO₂ 加氢制甲醇催化剂研究', description: '中期评审材料 3 天后到期，催化剂活性实验正在复核。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '需关注', updatedAt: '今天 09:20', source: '科研管理&驾驶舱（川庆）', kind: 'project' },
  { id: 'PROJ-PE-02', name: '功能性 PE 配方优化', description: '本周周报已更新，等待项目组确认下一阶段配方。', project: '功能性 PE 配方优化', owner: '李工', status: '进行中', updatedAt: '昨天 18:20', source: 'AI4S', kind: 'project' },
  { id: 'PROJ-RES-03', name: '储层智能评价方法研究', description: '地震解释数据整理中，等待模型训练结果。', project: '储层智能评价方法研究', owner: '王研究员', status: '进行中', updatedAt: '昨天 15:10', source: 'AI4S', kind: 'project' },
  { id: 'PROJ-HDS-04', name: '加氢脱硫催化剂性能提升', description: '已完成阶段性文献综述，准备实验验证。', project: '加氢脱硫催化剂性能提升', owner: '赵博士', status: '进行中', updatedAt: '9 月 15 日', source: 'AI4S', kind: 'project' },
  { id: 'PROJ-PIPE-05', name: '管道腐蚀预测与防护', description: '腐蚀数据模型已进入验证阶段。', project: '管道腐蚀预测与防护', owner: '陈工', status: '进行中', updatedAt: '9 月 14 日', source: 'AI4S', kind: 'project' },
];

export const literature: ResearchRecord[] = [
  { id: 'LIT-001', name: 'CCUS 催化转化最新进展', description: '针对 CO₂ 加氢路线的近期综述，含可追溯引用。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '待确认', updatedAt: '今天 08:30', source: '文献数据库', kind: 'literature' },
  { id: 'LIT-002', name: 'Nature Catalysis 新文献', description: '已加入课题知识库，待科研人员研读。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '进行中', updatedAt: '今天 09:15', source: '知识工程平台', kind: 'literature' },
  { id: 'STD-003', name: '催化剂评价方法标准对标', description: '国内外标准条款差异与适用范围。', project: '加氢脱硫催化剂性能提升', owner: '赵博士', status: '进行中', updatedAt: '昨天 16:00', source: '标准数据库', kind: 'literature' },
];

export const computeTasks: ResearchRecord[] = [
  { id: '1024', name: 'VASP 电子结构计算', description: '计算已完成，共生成 12 个结果文件。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '已完成', updatedAt: '今天 08:50', source: 'AI中台', kind: 'compute' },
  { id: '1025', name: 'GROMACS 分子动力学模拟', description: '分子动力学任务正在运行，最长已运行 5 h。', project: '功能性 PE 配方优化', owner: '李工', status: '进行中', updatedAt: '今天 09:41', source: 'AI中台', kind: 'compute' },
  { id: 'DFT-2839', name: 'DFT 参数优化', description: '内存不足中断，建议调整 k 点密度后重新提交。', project: '储层智能评价方法研究', owner: '王研究员', status: '需关注', updatedAt: '今天 08:12', source: 'AI中台', kind: 'compute' },
];

export const experiments: ResearchRecord[] = [
  { id: 'GB-2026-0915', name: '催化活性评价实验', description: '活性数据均值下降 35%，待复核反应温度控制系统。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '需关注', updatedAt: '今天 10:30', source: 'ELN', kind: 'experiment' },
  { id: 'EXP-0917', name: '固定床反应器验证实验', description: '已预约 9 月 17 日 10:00–12:00 普通仪器。', project: '加氢脱硫催化剂性能提升', owner: '赵博士', status: '待确认', updatedAt: '昨天 16:05', source: 'iLOMS', kind: 'experiment' },
  { id: 'EXP-0918', name: 'PE 配方正交实验', description: '实验方案已定版，等待设备准备。', project: '功能性 PE 配方优化', owner: '李工', status: '进行中', updatedAt: '昨天 14:10', source: 'AI4S', kind: 'experiment' },
];

export const devices: ResearchRecord[] = [
  { id: 'DEV-001', name: '固定床反应器', description: '催化剂活性评价；明日 10:00–12:00 已被预约。', project: '加氢脱硫催化剂性能提升', owner: '实验室 A', status: '进行中', updatedAt: '今天 08:00', source: 'iLOMS', kind: 'device' },
  { id: 'DEV-002', name: '气相色谱仪', description: '可供课题组预约使用。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '实验室 B', status: '已完成', updatedAt: '今天 07:30', source: 'iLOMS', kind: 'device' },
];

export const workflows: ResearchRecord[] = [
  { id: 'WF-CCUS-01', name: 'CO₂ 催化剂读—算—做闭环', description: '文献证据、VASP 计算与催化评价实验已关联；等待人工审核。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '待确认', updatedAt: '今天 09:20', source: 'AI4S', kind: 'workflow' },
  { id: 'WF-PE-02', name: 'PE 配方优化流程', description: '计算结果已回流，待启动下一轮实验。', project: '功能性 PE 配方优化', owner: '李工', status: '进行中', updatedAt: '昨天 18:20', source: 'AI4S', kind: 'workflow' },
];

export const assets: ResearchRecord[] = [
  { id: 'AST-RESULT-04', name: '催化剂活性评价阶段报告', description: '关联实验 GB-2026-0915 与计算任务 1024 的示例成果，已完成课题内审核。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '已完成', updatedAt: '2026-09-20', source: 'AI4S', kind: 'asset' },
  { id: 'AST-KNOW-05', name: '催化剂失活机理专题知识', description: '文献、笔记和术语形成的知识集合，保留资料版本与来源。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '已完成', updatedAt: '2026-09-20', source: '知识平台', kind: 'asset' },
  { id: 'AST-DATA-01', name: 'CuZnO_001 计算数据集', description: '与课题和 VASP 任务 #1024 关联，可按权限复用。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '已完成', updatedAt: '昨天 10:20', source: 'AI中台', kind: 'asset' },
  { id: 'AST-MODEL-02', name: '催化活性预测模型 v2', description: '模型版本、训练指标与数据血缘可追溯。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '张博士', status: '待确认', updatedAt: '9 月 15 日', source: 'AI中台', kind: 'asset' },
  { id: 'AST-PLAN-03', name: '固定床反应实验方案 v3', description: '实验方案已定版，待发布至项目资产空间。', project: '加氢脱硫催化剂性能提升', owner: '赵博士', status: '进行中', updatedAt: '9 月 14 日', source: 'AI4S', kind: 'asset' },
];

export const experts: ResearchRecord[] = [
  { id: 'EXP-001', name: '催化剂反应机理专家', description: '擅长 CO₂ 加氢、固定床反应与催化剂失活分析。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '周教授', status: '进行中', updatedAt: '今天 11:00', source: '员工助手', kind: 'expert' },
  { id: 'EXP-002', name: '分子模拟与材料筛选专家', description: '擅长 VASP、GROMACS 与多尺度模拟。', project: '功能性 PE 配方优化', owner: '刘研究员', status: '已完成', updatedAt: '昨天 14:30', source: '员工助手', kind: 'expert' },
];

export const tools: ResearchRecord[] = [
  { id: 'SERVICE-AGENT', name: '科研活动与管理智能体', description: '按课题绑定输入资料，查看智能体版本、用途与调用范围。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '课题组', status: '已完成', updatedAt: '2026-09-20', source: 'AI中台', kind: 'tool' },
  { id: 'SERVICE-SKILL', name: '科研技能与算法组件', description: '科研术语抽取、数据校验与分析工具的技能目录。', project: '功能性 PE 配方优化', owner: '课题组', status: '已完成', updatedAt: '2026-09-20', source: 'AI中台', kind: 'tool' },
  { id: 'SERVICE-WORKFLOW', name: '科研流程模板资产', description: '已发布的流程模板及版本，仅作为可引用的科研资产。', project: '功能性 PE 配方优化', owner: '课题组', status: '已完成', updatedAt: '2026-09-20', source: 'AI中台', kind: 'tool' },
  { id: 'SERVICE-DEVICE', name: '设备连接与状态监控服务', description: '设备连接器、状态点位和调用范围的业务侧封装。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '实验室 A', status: '待确认', updatedAt: '2026-09-20', source: 'iLOMS', kind: 'tool' },
  { id: 'TOOL-VASP', name: 'VASP 电子结构计算', description: '材料电子结构计算工具，关联科研计算任务与结果。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: 'AI中台', status: '进行中', updatedAt: '今天 08:50', source: 'AI中台', kind: 'tool' },
  { id: 'TOOL-GROMACS', name: 'GROMACS 分子动力学', description: '分子动力学模拟工具，支持任务提交和产物回流。', project: '功能性 PE 配方优化', owner: 'AI中台', status: '进行中', updatedAt: '今天 09:41', source: 'AI中台', kind: 'tool' },
  { id: 'TOOL-ELN', name: 'ELN 实验数据同步', description: '实验记录由来源系统管理，AI4S 查看同步状态与证据。', project: 'CO₂ 加氢制甲醇催化剂研究', owner: '实验室 A', status: '待确认', updatedAt: '今天 10:30', source: 'ELN', kind: 'tool' },
];

export const adminRecords: ResearchRecord[] = [
  { id: 'TENANT-001', name: '炼化科研中心', description: '已绑定计算资源组与科研数据权限。', project: '平台配置', owner: '平台管理员', status: '进行中', updatedAt: '今天 10:00', source: 'AI中台', kind: 'admin' },
  { id: 'TENANT-002', name: '油气勘探研究院', description: '组织同步正常，近期无告警。', project: '平台配置', owner: '平台管理员', status: '已完成', updatedAt: '昨天 18:00', source: 'IAM / AI中台', kind: 'admin' },
];
