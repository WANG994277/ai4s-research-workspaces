export type ComputeRequirement = {
  id: string;
  title: string;
  section: string;
  page: string;
  userStory: string;
  description: string;
  acceptanceCriteria: string[];
  businessRules: string[];
  states: string[];
  assumptions: string[];
  source: string;
};

export type RequirementEdits = Record<string, Partial<Pick<ComputeRequirement,
  'title' | 'userStory' | 'description' | 'acceptanceCriteria' | 'businessRules' | 'states' | 'assumptions'
>>>;

export type ComputePrdPage = {
  id: string;
  title: string;
  path: string;
  summary: string;
  requirementIds: string[];
  elements: { id: string; label: string; type: string; requirementIds: string[] }[];
};

export const PRD_SOURCE_NAME = 'AI4S_算空间_PRD_V1.0.md';
export const PRD_SOURCE_URL = '/compute-space-prd.md';
export const PRD_STORAGE_KEY = 'ai4s-compute-prd-edits-v1';

export const computeDesignSystem = {
  productType: '面向科研人员的 B 端科研计算工作台',
  audience: '科研人员、课题负责人、科学计算工程师与平台管理人员',
  primaryWorkflow: '科研问题 → 计算方案 → 人工确认 → 正式任务 → 结果 Artifact → 实验验证或补充研究',
  density: 'compact',
  devicePriority: 'desktop-first responsive',
  tone: '专业、克制、分析导向',
  layoutPattern: '侧栏工作区；Agent 三栏；专业页面采用表格、结构化参数、日志与版本视图',
  styleRationale: '依据 PRD 第 27 章，使用白底、深灰、朱丹红关键动作与辅助蓝灰；优先任务状态和科研信息密度。',
};

function requirement(
  id: string, page: string, title: string, section: string, description: string,
  acceptanceCriteria: string[], businessRules: string[] = [], states: string[] = [],
  assumptions: string[] = [],
): ComputeRequirement {
  return { id, page, title, section, description, acceptanceCriteria, businessRules, states, assumptions,
    userStory: `作为科研人员，我希望${title}，以便完成可追溯的科研计算流程。`,
    source: `${PRD_SOURCE_NAME} / ${section}` };
}

export const computeRequirements: ComputeRequirement[] = [
  requirement('REQ-HOME-001', 'home', '从科研问题开始计算', '6.1–6.4 算空间首页',
    '首页是科研计算任务的统一智能启动页。标题为“开始计算”，引导用户描述计算目标，引用已有研究结论或科研资源，并启动科研计算助手。',
    ['可输入计算问题并进入科研计算助手。', '提供生成方案、分析数据、参数组合、候选筛选、模拟、训练、模型比较、结果解释八类快捷任务。', '空输入有可理解的提示。'],
    ['输入问题后先形成计算方案，不能直接提交正式任务。'], ['空白', '已输入问题', '已有引用', '已进入 Agent']),
  requirement('REQ-HOME-002', 'home', '引用科研上下文和文件', '4.1 Compute Context；6.3 AI 主输入框；18 读 → 算',
    '支持引用当前课题、科学假设、读空间研究结论、文献参数、科研数据、模型、已有计算结果、实验数据及上传文件。Compute Context 与读空间 Research Context 打通。',
    ['选择资源后显示引用名称和来源。', '进入 Agent 后保留问题、课题、引用与文件元信息。', '可选择读空间假设或结论作为计算依据。'],
    ['科研数据与模型引用应绑定版本。', '跨空间传递研究目标、假设、证据及参数，不能只跳转页面。']),
  requirement('REQ-HOME-003', 'home', '打开专业工作台和恢复历史任务', '6.5–6.7 核心 Agent、专业工作台、最近计算任务',
    '首页展示一个科研计算助手，以及智能设计与筛选、计算任务、科研数据处理、模型训练与评价、科研工具五个专业工作台。最近任务展示类型、状态、课题、工具、更新时间和结果状态。',
    ['五个工作台均可打开。', '最近任务可恢复到正确任务或方案。', '任务显示状态与进度，刷新后保留本地演示记录。']),

  requirement('REQ-AGENT-001', 'agent', '以三栏工作区规划科研计算', '7.1–7.2 科研计算助手；22 统一 Compute Agent Workspace',
    '左栏展示目标、任务计划和 Research Context；中栏展示用户指令、阶段结论、方法推荐、调用摘要、参数建议和人工确认；右栏固定呈现计算方案 Artifact。计划包括目标、输入约束、方法、工具、参数、资源、方案、创建任务八步。',
    ['可查看并推进任务计划和阶段结论。', '左侧上下文、中央执行区、右侧结构化 Artifact 可同时查看。', '长任务转到专业任务页查看运行状态和日志。'],
    ['不展示多 Agent 群聊。', '不在对话流持续刷运行日志。']),
  requirement('REQ-AGENT-002', 'agent', '编辑和版本化计算方案 Artifact', '4.2 Compute Plan；7.3 计算方案 Artifact',
    '计算方案包含研究目标、科学假设、计算目标、类型、输入、方法、模型、软件、变量、固定参数、范围、输出和评价指标、资源与环境、风险约束、来源证据、版本和状态。支持修改方案、生成新版本、查看依据和保存为科研方案。',
    ['可修改结构化方案并保存。', '新版本保留来源方案关联。', '可查看数据、方法、参数、工具、资源和输出。', '草稿、待确认、已确认、已创建任务等状态可区分。'],
    ['正式任务必须关联已确认的 Compute Plan。'], ['草稿', '待确认', '已确认', '已创建任务', '已失效']),
  requirement('REQ-AGENT-003', 'agent', '解释方法推荐与参数来源', '7.4–7.5 工具解释与参数推荐',
    '工具推荐说明能力匹配、平台接入、当前课题许可和输出适配理由。参数区分文献参数、实验参数、领域默认值、AI 推荐值和人工输入值，并标注已引用、已确认或待确认。',
    ['工具推荐有明确原因。', '参数表显示值、单位、来源和确认状态。', '用户可修改 AI 建议并确认关键参数。'],
    ['不能把 AI 建议值伪装成已核实的实验或文献值。']),
  requirement('REQ-AGENT-004', 'agent', '确认后创建正式任务', '1.3 原则 3；7.6 人工确认；23 人工确认机制',
    '计算方法、高成本资源、软件许可证、大批量组合和正式创建任务需要人工确认。确认界面展示将使用的数据、模型、工具版本、资源、参数和风险，保留确认记录。',
    ['未确认前不创建正式运行任务。', '确认后生成唯一任务并可进入详情。', '任务持久保留来源方案、版本与确认时间。'],
    ['模拟调度也必须遵循先方案后任务的业务顺序。'], ['待确认', '已确认', '已创建任务'],
    ['确认采用抽屉或对话框；真实调度与许可调用在演示中使用 Mock。']),

  requirement('REQ-DESIGN-001', 'design', '配置多目标设计与筛选', '8.1–8.4 智能设计与筛选',
    '按目标定义、约束条件、候选空间、专业插件、批量生成、多目标评价和排序组织工作台。覆盖材料科学、地球科学、合成生物三类场景，支持参数范围和指标权重。',
    ['可切换三类专业场景。', '可配置目标、约束、范围、权重与专业插件。', '生成候选后调整约束或权重能够影响筛选排序。'],
    ['大批量计算启动需要先确认。'], ['待配置', '配置错误', '已生成候选', '筛选完成']),
  requirement('REQ-DESIGN-002', 'design', '比较候选并形成方案集 Artifact', '8.3 页面布局；8.5 候选方案集',
    '候选空间支持列表、图表与帕累托前沿；候选显示多目标指标、约束满足和推荐或淘汰状态。支持比较、参数、依据、创建正式任务及进入实验设计。',
    ['可选择多个候选并比较。', '候选具有可查看的参数和约束状态。', '可从候选创建计算方案或实验设计交接草稿。'],
    ['正式任务和实验方案创建继续经过人工确认。']),

  requirement('REQ-TASK-001', 'tasks', '管理完整计算任务生命周期', '9.1–9.2 任务中心与生命周期',
    '统一管理计算方案到运行结果的生命周期：草稿、待确认、待提交、排队中、运行中、结果生成中、已完成；异常状态包含暂停、失败、取消、资源不足和等待人工处理。',
    ['任务具有明确状态、进度和来源方案。', '支持正常运行、完成及失败异常演示。', '新建任务可在中心与详情中保持一致。'],
    ['运行状态与日志属于专业任务页。'], ['草稿', '待确认', '待提交', '排队中', '运行中', '结果生成中', '已完成', '暂停', '失败', '取消', '资源不足', '等待人工处理']),
  requirement('REQ-TASK-002', 'tasks', '筛选和检索任务', '9.3–9.4 任务字段与筛选',
    '任务中心显示名称、类型、课题、来源方案、工具、数据版本、资源、状态、进度、创建时间、运行时长、结果数；按类型、课题、工具、状态、创建人、时间、异常和结果筛选。',
    ['任务列表可搜索和筛选。', '筛选无匹配时显示空态并允许清除筛选。', '任务行可打开对应详情。']),
  requirement('REQ-TASK-003', 'tasks', '操作任务和复用已有配置', '9.5 快捷操作；24 任务失败与异常',
    '提供详情、日志、停止、重试、克隆、重新运行、下载结果、结果分析和新版本。失败须说明阶段、原因、影响与建议。',
    ['停止与重试会更新任务状态。', '克隆创建独立记录并保留来源，不覆盖原任务。', '完成任务可下载结果或进入分析。'],
    ['失败结果不能被标注为有效科研结论。']),

  requirement('REQ-DETAIL-001', 'detail', '查看计算任务配置与运行', '10.1–10.5 任务详情',
    '任务详情含概览、参数、输入、运行、日志、结果、分析、版本与追溯八个视图。概览显示目标、来源方案、数据与模型版本、工具、资源、状态、进度和时间；运行视图显示队列、计算资源与执行阶段。',
    ['八个视图均可切换并显示对应内容。', '输入、资源、参数与任务创建配置保持一致。', '阶段进度和状态同步。']),
  requirement('REQ-DETAIL-002', 'detail', '追溯参数和版本', '1.3 原则 5；10.4 参数；4.3 Compute Task',
    '参数展示值、单位、来源、原始方案值和实际运行值，记录修改人与时间。结果可追溯科研任务、输入版本、模型/软件版本、环境、资源、运行时间、日志、产物和人工确认。',
    ['参数修改显示原值和当前值。', '版本视图展示来源方案与上下游关联。', '重试、克隆、确认具有记录。']),
  requirement('REQ-DETAIL-003', 'detail', '筛选日志和处理失败', '10.6 日志；24 任务失败与异常',
    '支持实时/历史日志、关键日志、Error/Warning 筛选、搜索与下载。失败页说明阶段、原因、影响，提供 AI 分析、修改后重试和克隆。',
    ['日志级别与关键词筛选可用。', '可下载日志文本。', '失败任务可解释异常并修改资源后重试。'],
    ['AI 解释不能替代完整运行日志。']),
  requirement('REQ-DETAIL-004', 'detail', '管理结果和结论可信状态', '10.7–10.8 计算结果；25 结果可信性',
    '展示结果文件、图表、表格、指标、图片、模型和报告，支持预览、下载、加入 Artifact 与分析。结果摘要包括主要结果、敏感参数、最优区间、异常和下一步，支持重算、参数调整、实验比较和保存科研资产。',
    ['结果可预览或下载。', '可生成结果 Artifact 并记录人工确认状态。', '可发起实验验证或补充研究交接。'],
    ['AI 解释不能作为最终科学结论。'], ['计算结果已生成', '待人工分析', '已人工确认', '与实验一致', '与实验存在偏差', '需要进一步验证']),

  requirement('REQ-DATA-001', 'data', '配置和运行科研数据处理', '11.1–11.4 科研数据处理',
    '选择科研数据和版本，配置清洗、转换、缺失值、异常值、标准化、特征处理与自定义算子，通过中台能力运行任务，查看预览、可视化和质量摘要。',
    ['可选择数据集和版本。', '可配置处理算子并创建任务。', '执行后展示处理前后预览及质量变化。'],
    ['复用中台服务，不在 AI4S 重建自定义算子开发后台。'], ['待配置', '运行中', '已完成', '失败']),
  requirement('REQ-DATA-002', 'data', '生成数据版本并回流科研任务', '4.5 Dataset Version；11.5 数据版本；21 做 → 算',
    '处理结果形成新的数据版本，保存来源、处理流程、创建人、时间、上游版本和使用中的任务。实验真实参数、实测和表征数据可用于校准、修正、训练及重新计算。',
    ['完成处理后生成新版本。', '版本保留上游与处理记录。', '可把新版本送入计算方案或模型训练。'],
    ['覆盖或替换现有数据版本需要人工确认。']),

  requirement('REQ-MODEL-001', 'models', '创建模型训练任务与版本', '12.1–12.3 模型训练与评价',
    '从研究目标开始，选择数据集版本与模型，配置训练或微调方案、参数和资源，人工确认后训练，形成关联训练任务与训练数据版本的模型版本。',
    ['可选择训练数据版本、模型与参数。', '正式训练有确认节点。', '任务完成后形成模型版本并可追溯训练配置。'],
    ['复用中台训练与 MLOps 能力。', '正式模型发布必须人工确认。'], ['草稿', '待确认', '训练中', '已完成', '训练失败', '已发布']),
  requirement('REQ-MODEL-002', 'models', '固定测试集评价与模型比较', '12.4–12.5 评价工作台与科学评价',
    '在固定测试集上评价模型，支持多模型、多版本、不同测试集对比和误差分析。科学评价包含物理约束、机理合理性、误差范围、外推能力和专业指标，形成模型评价 Artifact。',
    ['评价明确标注测试集与模型版本。', '可选择多个模型或版本比较。', '报告包含科学适用范围和科学评价指标。'],
    ['不同测试集的指标不可不加说明地直接排序。', '不能只依据 AI/ML 通用指标判断科学有效性。']),

  requirement('REQ-TOOL-001', 'tools', '发现可用科研工具', '13.1–13.4 科研工具广场',
    '按地球科学、油气、化工、材料、生物、仿真、数据分析、通用计算及 AI 分类发现科学软件、算法、模型和仿真服务。卡片显示名称、类型、领域、简介、输入输出、可用性、版本、许可和使用入口。',
    ['可按关键词、领域和类型查找工具。', '列表展示版本、许可与可用状态。', '工具详情和使用入口有效。'],
    ['不突出热度排行榜、商业评分或无意义使用次数。']),
  requirement('REQ-TOOL-002', 'tool-detail', '查看工具详情与使用条件', '13.5 工具详情；4.4 Scientific Tool',
    '工具详情提供概览、输入输出、参数、版本、运行环境、许可证、使用说明和调用记录；说明参数 Schema、许可状态和适用场景。',
    ['八类详情信息可查看。', '许可、运行环境、输入输出 Schema 和软件版本明确。', '调用记录能够关联具体任务。']),
  requirement('REQ-TOOL-003', 'tool-detail', '使用工具并加入科研方案', '13.6 使用工具；23 人工确认机制',
    '用户可直接运行、加入科研计算方案、由 Agent 调用、创建任务和收藏工具；正式计算必须在工具版本、许可、参数、资源明确后确认。',
    ['收藏状态可保存。', '加入方案后保留工具及版本信息。', '由 Agent 调用可进入带工具上下文的规划流程。'],
    ['直接运行仍需满足先方案后任务与必要的许可/资源确认。']),

  requirement('REQ-MANAGE-001', 'manage', '接入科研工具并维护 Schema', '14 工具接入与发布；15 接入对象；16 关键字段',
    '建设侧独立管理 CLI、Web API、Python 包、容器、HPC、专业仿真、模型推理和内部算法。登记输入输出/参数 Schema、调用方式、环境依赖、版本、许可权限、超时、资源和结果回传。',
    ['可新建接入工具。', '接入表单可配置 Schema、环境、许可和资源。', '参数校验错误有提示。'],
    ['工具使用侧与管理侧区分。']),
  requirement('REQ-MANAGE-002', 'manage', '调试和发布工具版本', '14 工具/软件接入与发布',
    '接入流程为新建、接口封装、Schema 和模板、环境、版本、许可、调试测试、发布及上架/下架。状态更新应在科研工具广场反映。',
    ['草稿工具可调试并查看结果。', '符合条件的工具可发布和上架。', '下架后广场可用性同步变化。'],
    ['调试失败时不得显示发布成功。'], ['草稿', '调试中', '调试失败', '待发布', '已上架', '已下架'],
    ['角色策略在本机原型采用演示角色；接入和调试采用 Mock。']),

  requirement('REQ-ANALYSIS-001', 'analysis', '解释结果与多任务对比', '17 结果分析与评价；17.1 多任务结果对比',
    '结果分析工作台支持指标摘要、多组参数和曲线对比、敏感性、误差、异常、实验结果对比及 AI 解释。选择多个任务比较参数与结果，支持推荐候选。',
    ['可选择任务并查看对比表格与图表。', '显示参数影响、误差或异常。', '分析结论关联具体任务和参数组合。'],
    ['计算完成后不能只显示文件下载。', 'AI 解释保留待人工确认状态。']),
  requirement('REQ-ANALYSIS-002', 'analysis', '形成敏感性分析和优化建议', '17.2 敏感性分析；29 P2',
    '展示主要敏感参数与弱影响参数，并关联任务和参数组合。可演示高级敏感性方法、跨任务优化、自动比较与资源策略建议。',
    ['显示温度、围压等参数的敏感性排序。', '可检查分析依据和来源任务。', '优化建议可生成后续计算或实验草稿。'],
    ['P2 使用可解释的演示数据，不冒充真实求解器结果。'], [],
    ['高级优化采用预设 Mock；实际优化服务属于后续接入。']),

  requirement('REQ-HANDOFF-001', 'handoff', '把计算结果转为实验方案', '19 算 → 做；23 人工确认机制',
    '生成实验方案时传递研究目标、科学假设、计算方法、关键参数、推荐区间、敏感参数、候选、结果、风险约束与来源证据，进入实验方案设计与生成流程。',
    ['交接草稿可预览和编辑。', '确认后保留完整来源并进入做空间。', '目标页面能够读取草稿内容。'],
    ['结果进入实验方案必须人工确认。']),
  requirement('REQ-HANDOFF-002', 'handoff', '补充研究或用实验校准计算', '18 读 → 算；20 算 → 读；21 做 → 算',
    '当计算与文献冲突、依据不足、参数不合理或假设缺证据时，向读空间携带计算问题、冲突结果和待补充知识。实验结果可回流计算用于参数校准、模型修正、再训练和重新计算。',
    ['补充研究草稿带入冲突和待研究问题。', '可接收实验数据并关联当前任务。', '回流后可创建新方案或数据版本。'],
    ['跨空间跳转保留课题与来源标识。']),
];

const pageDefinitions = [
  ['home', '开始计算', '/compute-space', '科研问题驱动的智能启动页；引用上下文、打开专业工作台并继续最近任务。'],
  ['agent', '科研计算助手', '/compute-space/agent', '澄清计算问题并形成可编辑、可确认、可追溯的计算方案。'],
  ['design', '智能设计与筛选', '/compute-space/design', '定义多目标和约束，生成候选、比较排序并进入计算或实验验证。'],
  ['tasks', '计算任务', '/compute-space/tasks', '统一检索和管理计算任务生命周期、异常、复用与结果。'],
  ['detail', '计算任务详情', '/compute-space/tasks/[id]', '查看配置、参数、输入、运行、日志、结果、分析及版本追溯。'],
  ['data', '科研数据处理', '/compute-space/data', '配置处理流程、检查质量、形成数据新版本并回流科研任务。'],
  ['models', '模型训练与评价', '/compute-space/models', '训练模型、管理版本、固定测试集科学评价和模型比较。'],
  ['tools', '科研工具', '/compute-space/tools', '发现符合场景、运行环境与许可条件的科研工具。'],
  ['tool-detail', '科研工具详情', '/compute-space/tools/[id]', '查看工具输入输出、Schema、环境、许可、版本与调用记录。'],
  ['manage', '工具接入与管理', '/compute-space/tools/manage', '登记接入、配置 Schema、调试、发布及上下架工具。'],
  ['analysis', '结果分析与对比', '/compute-space/analysis', '比较任务和参数、分析误差与敏感性并形成可追溯结论。'],
  ['handoff', '科研结果流转', '/compute-space/handoff', '人工确认后携带完整科研上下文进入实验设计或补充研究。'],
] as const;

export const computePrdPages: ComputePrdPage[] = pageDefinitions.map(([id, title, path, summary]) => {
  const requirements = computeRequirements.filter(item => item.page === id);
  return { id, title, path, summary, requirementIds: requirements.map(item => item.id),
    elements: requirements.map(item => ({ id: item.id.toLowerCase(), label: item.title, type: '功能区域及关联操作', requirementIds: [item.id] })) };
});

export const prdModel = {
  meta: { productName: 'AI4S 算空间', version: 'V1.0', source: PRD_SOURCE_NAME, designSystem: computeDesignSystem },
  pages: computePrdPages,
  requirements: computeRequirements,
};

export function resolvePrdPage(pathname: string): ComputePrdPage {
  const path = pathname.replace(/\/$/, '') || '/compute-space';
  const exact = computePrdPages.find(page => page.path === path);
  if (exact) return exact;
  if (/^\/compute-space\/tasks\/.+/.test(path) || path.startsWith('/compute-results/')) return computePrdPages.find(page => page.id === 'detail')!;
  if (/^\/compute-space\/tools\/.+/.test(path)) return computePrdPages.find(page => page.id === 'tool-detail')!;
  if (path === '/compute-tasks') return computePrdPages.find(page => page.id === 'tasks')!;
  return computePrdPages[0];
}

export function getRequirement(id: string, edits: RequirementEdits = {}): ComputeRequirement | undefined {
  const base = computeRequirements.find(item => item.id === id);
  return base ? { ...base, ...edits[id] } : undefined;
}

export function validateRequirementEdits(value: unknown): RequirementEdits {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: RequirementEdits = {};
  for (const [id, fields] of Object.entries(value)) {
    if (!computeRequirements.some(item => item.id === id) || !fields || typeof fields !== 'object' || Array.isArray(fields)) continue;
    const clean: RequirementEdits[string] = {};
    const record = fields as Record<string, unknown>;
    for (const key of ['title', 'userStory', 'description'] as const) if (typeof record[key] === 'string') clean[key] = record[key];
    for (const key of ['acceptanceCriteria', 'businessRules', 'states', 'assumptions'] as const) {
      const field = record[key];
      if (Array.isArray(field) && field.every(item => typeof item === 'string')) clean[key] = field;
    }
    result[id] = clean;
  }
  return result;
}

function list(items: string[]) { return items.length ? items.map(item => `- ${item}`).join('\n') : '- 未补充'; }

function requirementMarkdown(item: ComputeRequirement) {
  return `### ${item.id} ${item.title}\n\n来源：${item.source}\n\n所属页面：${item.page}\n\n${item.userStory}\n\n${item.description}\n\n**验收条件**\n\n${list(item.acceptanceCriteria)}\n\n**业务规则**\n\n${list(item.businessRules)}\n\n**状态**\n\n${list(item.states)}\n\n**原型假设 / 待确认项**\n\n${list(item.assumptions)}`;
}

function designMarkdown() {
  return `## 设计系统\n\n${Object.entries(computeDesignSystem).map(([key, value]) => `- ${key}：${value}`).join('\n')}`;
}

function pageMarkdown(page: ComputePrdPage) {
  return `### ${page.title}\n\n路径：\`${page.path}\`\n\n${page.summary}\n\n关联需求：${page.requirementIds.join('、')}\n\n${page.elements.map(element => `- ${element.label}（${element.type}，\`${element.id}\`）→ ${element.requirementIds.join('、')}`).join('\n')}`;
}

export function buildPageMarkdown(page: ComputePrdPage, edits: RequirementEdits = {}) {
  return `# AI4S 算空间 — ${page.title}\n\n版本：V1.0\n\n来源：${PRD_SOURCE_NAME}\n\n> 本导出包含当前页需求映射和本机编辑内容；不表示对应验收已经通过。\n\n${designMarkdown()}\n\n## 页面结构\n\n${pageMarkdown(page)}\n\n## 当前页关联需求\n\n${page.requirementIds.map(id => getRequirement(id, edits)).filter((item): item is ComputeRequirement => Boolean(item)).map(requirementMarkdown).join('\n\n---\n\n')}\n`;
}

export function buildFullMarkdown(originalPrd: string, edits: RequirementEdits = {}) {
  if (!originalPrd.trim()) throw new Error('完整 PRD 原文尚未加载，请重试。');
  return `# AI4S 算空间 PRD 与原型需求映射\n\n版本：V1.0\n\n来源：${PRD_SOURCE_NAME}\n\n> 第一部分为当前可编辑的需求映射（包含本机修订）；第二部分为完整来源 PRD 存档。原始文件未被改写，修订与来源分别保留。验收条件不代表测试通过。\n\n${designMarkdown()}\n\n## 页面清单与控件映射\n\n${computePrdPages.map(pageMarkdown).join('\n\n')}\n\n## 当前需求与本机修订\n\n${computeRequirements.map(item => requirementMarkdown(getRequirement(item.id, edits)!)).join('\n\n---\n\n')}\n\n---\n\n# 完整来源 PRD 存档\n\n${originalPrd}\n`;
}
