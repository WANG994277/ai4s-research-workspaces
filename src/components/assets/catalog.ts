export type AssetCategoryKey = 'data' | 'knowledge' | 'outcome' | 'model' | 'compute-plan' | 'experiment-plan' | 'agent' | 'workflow' | 'skill' | 'software' | 'algorithm';
export type AssetStatus = '草稿' | '已发布' | '已下架';
export type AssetVisibility = '平台内公开' | '仅自己可见' | '指定用户可见';
export type SortKey = 'relevance' | 'latest' | 'updated' | 'downloads' | 'views' | 'favorites' | 'usage';

export interface AssetCategory {
  key: AssetCategoryKey;
  label: string;
  shortLabel: string;
  group: 'data-knowledge' | 'model' | 'plans' | 'intelligent-services';
  description: string;
  primaryAction: string;
  color: 'blue' | 'cyan' | 'red' | 'purple' | 'green' | 'orange';
}

export interface AssetFile {
  name: string;
  type: string;
  size: string;
  updatedAt: string;
  description: string;
}

export interface AssetVersion {
  version: string;
  date: string;
  note: string;
}

export interface AssetRecord {
  id: string;
  slug: string;
  category: AssetCategoryKey;
  name: string;
  summary: string;
  description: string;
  disciplines: string[];
  purposes: string[];
  attributes: string[];
  keywords: string[];
  author: string;
  organization: string;
  version: string;
  status: AssetStatus;
  visibility: AssetVisibility;
  publishedAt: string;
  updatedAt: string;
  format: string;
  size: string;
  license: string;
  downloads: number;
  views: number;
  favorites: number;
  usage: number;
  featured?: boolean;
  editorPick?: boolean;
  restricted?: boolean;
  metric?: { label: string; value: string };
  files: AssetFile[];
  versions: AssetVersion[];
  detailSections: { title: string; body: string }[];
}

export interface AssetFilter {
  query?: string;
  categories?: AssetCategoryKey[];
  disciplines?: string[];
  purposes?: string[];
  attributes?: string[];
}

export type AssetRoute =
  | { kind: 'home' }
  | { kind: 'plaza'; category: AssetCategoryKey }
  | { kind: 'detail'; category: AssetCategoryKey; slug: string }
  | { kind: 'upload'; category?: AssetCategoryKey }
  | { kind: 'mine' }
  | { kind: 'search' }
  | { kind: 'not-found' };

export const assetCategories: AssetCategory[] = [
  { key: 'data', label: '科研数据', shortLabel: '数据', group: 'data-knowledge', description: '实验、计算、模拟、观测与表征数据集', primaryAction: '上传数据集', color: 'blue' },
  { key: 'knowledge', label: '科研知识', shortLabel: '知识', group: 'data-knowledge', description: '文献、标准、方法、专家知识与知识图谱', primaryAction: '上传知识', color: 'cyan' },
  { key: 'outcome', label: '科研成果', shortLabel: '成果', group: 'data-knowledge', description: '论文、专利、报告、软件与方法成果', primaryAction: '上传成果', color: 'red' },
  { key: 'model', label: '科研模型', shortLabel: '模型', group: 'model', description: '机理、数值、机器学习与科学基础模型', primaryAction: '上传模型', color: 'purple' },
  { key: 'compute-plan', label: '计算方案', shortLabel: '计算方案', group: 'plans', description: '数据、模型、算法、参数与计算流程模板', primaryAction: '上传计算方案', color: 'blue' },
  { key: 'experiment-plan', label: '实验方案', shortLabel: '实验方案', group: 'plans', description: '材料、步骤、条件、质量控制与安全要求', primaryAction: '上传实验方案', color: 'green' },
  { key: 'agent', label: '科研智能体', shortLabel: 'Agent', group: 'intelligent-services', description: '文献调研、数据分析、实验设计与科研写作 Agent', primaryAction: '发布 Agent', color: 'purple' },
  { key: 'workflow', label: '科研工作流', shortLabel: 'Workflow', group: 'intelligent-services', description: '可导出、配置和复用的科研工作流', primaryAction: '发布 Workflow', color: 'cyan' },
  { key: 'skill', label: 'Skill', shortLabel: 'Skill', group: 'intelligent-services', description: '可被 Agent 或科研人员调用的单项能力', primaryAction: '发布 Skill', color: 'orange' },
  { key: 'software', label: '科学软件', shortLabel: '科学软件', group: 'intelligent-services', description: '量子化学、分子模拟、CFD、地学与数据分析软件', primaryAction: '上传科学软件', color: 'green' },
  { key: 'algorithm', label: '算法工具', shortLabel: '算法', group: 'intelligent-services', description: '优化、数值、信号、图像、统计与反演算法', primaryAction: '发布算法', color: 'red' },
];

export const disciplines = ['地球科学', '油气勘探开发', '化学与化工', '材料科学', '计算科学', '生物与合成生物', '能源与环境', '通用学科'];
export const purposes = ['文献研读', '知识发现', '数据清洗', '数据可视化', '机理建模', '性质预测', '参数反演', '实验设计', '表征分析', '结果解释', '科研写作', '工作流自动化'];

const files = (base: string, format: string, size = '12.6 MB'): AssetFile[] => [
  { name: base, type: format, size, updatedAt: '2026-09-18 14:32', description: '主要资产文件' },
  { name: 'README.md', type: 'MD', size: '12 KB', updatedAt: '2026-09-18 14:32', description: '资产介绍与使用说明' },
  { name: 'metadata.json', type: 'JSON', size: '4 KB', updatedAt: '2026-09-18 14:32', description: '结构化元数据' },
];

const versions = (latest: string): AssetVersion[] => [
  { version: latest, date: '2026-09-18', note: '完善说明、示例与质量信息' },
  { version: 'v1.0', date: '2026-04-12', note: '首次公开发布' },
];

const record = (value: Omit<AssetRecord, 'status' | 'visibility' | 'license' | 'versions' | 'detailSections'> & Partial<Pick<AssetRecord, 'status' | 'visibility' | 'license' | 'versions' | 'detailSections'>>): AssetRecord => ({
  status: '已发布',
  visibility: '平台内公开',
  license: 'CC BY 4.0',
  versions: versions(value.version),
  detailSections: [
    { title: '适用范围', body: '用于科研验证与方法复现；使用前请核对版本、数据质量和资源需求。' },
    { title: '使用说明', body: '下载包含 README、元数据和可复现示例；引用时请保留作者和版本信息。' },
  ],
  ...value,
});

export const assetRecords: AssetRecord[] = [
  record({ id: 'RA-DATA-001', slug: 'cu-zno-catalyst-characterization', category: 'data', name: 'Cu/ZnO/Al₂O₃ 催化剂表征数据集', summary: '汇集 XRD、XPS、BET、TEM 与 H₂-TPR 数据，支持催化剂结构—性能关系研究。', description: '数据集涵盖多种制备条件下 Cu/ZnO/Al₂O₃ 催化剂的原始表征、处理结果与元数据，可用于结构解析、性能关联和模型验证。', disciplines: ['化学与化工', '材料科学'], purposes: ['表征分析', '性质预测'], attributes: ['表征数据', '图像', '谱图'], keywords: ['Cu/ZnO', '催化剂', 'XRD', 'TEM'], author: '李明', organization: '中国科学院大连化学物理研究所', version: 'v1.2', publishedAt: '2026-09-18', updatedAt: '2026-09-20', format: 'CSV / XLSX / PNG', size: '2.4 GB', downloads: 1280, views: 8420, favorites: 256, usage: 412, featured: true, editorPick: true, metric: { label: '样本数', value: '1,250' }, files: files('XRD_patterns.csv', 'CSV', '12.4 MB') }),
  record({ id: 'RA-DATA-002', slug: 'carbonate-reservoir-ct', category: 'data', name: '页岩储层孔隙结构三维数据集', summary: '基于微米 CT 扫描的三维孔隙数据和连通性标注。', description: '包含原始 CT 切片、三维重建、孔隙分割与多尺度渗流特征。', disciplines: ['地球科学', '油气勘探开发'], purposes: ['机理建模', '结果解释'], attributes: ['观测数据', '图像', '三维数据'], keywords: ['页岩', '孔隙', 'CT'], author: '王研究员', organization: '中国石油大学（北京）', version: 'v2.1', publishedAt: '2026-09-16', updatedAt: '2026-09-19', format: 'SEGY / TIFF', size: '15.6 GB', downloads: 856, views: 6130, favorites: 184, usage: 229, restricted: true, metric: { label: '体数据', value: '48 个' }, files: files('core_ct_volume.zip', 'ZIP', '15.6 GB') }),
  record({ id: 'RA-KNOW-001', slug: 'methanol-catalysis-knowledge-graph', category: 'knowledge', name: '甲醇合成催化机理综述与知识图谱', summary: '系统整理甲醇合成的催化机理、反应路径与关键中间体。', description: '基于文献和专家知识建立概念、证据与反应路径网络，支持专题研读和知识检索。', disciplines: ['化学与化工'], purposes: ['文献研读', '知识发现'], attributes: ['知识图谱', '文献', '方法'], keywords: ['甲醇合成', '催化机理', '知识图谱'], author: '李明', organization: '中国科学院大连化学物理研究所', version: 'v1.0', publishedAt: '2026-09-12', updatedAt: '2026-09-18', format: 'PDF / JSON-LD', size: '12.8 MB', downloads: 3100, views: 12400, favorites: 912, usage: 1500, featured: true, files: files('methanol_knowledge.pdf', 'PDF', '12.8 MB') }),
  record({ id: 'RA-OUT-001', slug: 'co2-methanol-stage-report', category: 'outcome', name: 'CO₂ 加氢制甲醇催化剂优化阶段成果报告', summary: '系统总结催化剂筛选、性能评价与放大验证结果。', description: '成果包括研究报告、关键图表与实验数据汇总。', disciplines: ['化学与化工', '能源与环境'], purposes: ['科研写作', '结果解释'], attributes: ['研究报告', '数据成果'], keywords: ['CO₂加氢', '甲醇', '研究报告'], author: '李明、王芳等', organization: '清华大学化学工程系', version: 'v1.3', publishedAt: '2026-09-10', updatedAt: '2026-09-17', format: 'PDF / XLSX', size: '12.6 MB', downloads: 328, views: 1200, favorites: 146, usage: 82, editorPick: true, files: files('CO2_methanol_report.pdf', 'PDF', '12.6 MB') }),
  record({ id: 'RA-MODEL-001', slug: 'methanol-microkinetic-model', category: 'model', name: '甲醇合成微观动力学模型', summary: '基于 DFT 反应能垒与表面反应网络的多相催化反应动力学模型。', description: '用于反应机理分析、工艺条件优化与反应器模拟，提供权重、配置、环境与示例。', disciplines: ['化学与化工', '计算科学'], purposes: ['机理建模', '性质预测'], attributes: ['机理模型', '机器学习模型', 'PyTorch'], keywords: ['甲醇合成', '微观动力学', 'PyTorch'], author: '李明', organization: '清华大学化学工程系', version: 'v1.2.0', publishedAt: '2026-09-08', updatedAt: '2026-09-18', format: 'safetensors / JSON', size: '1.2 GB', license: 'Apache 2.0', downloads: 2300, views: 9800, favorites: 458, usage: 4210, featured: true, editorPick: true, metric: { label: 'MAE', value: '0.012 eV' }, files: files('model.safetensors', 'MODEL', '1.2 GB') }),
  record({ id: 'RA-MODEL-002', slug: 'reservoir-porosity-prediction', category: 'model', name: '储层孔隙度预测模型', summary: '融合测井与地震特征的三维储层孔隙度预测模型。', description: '支持多源测井数据融合和区域孔隙度预测。', disciplines: ['油气勘探开发', '地球科学'], purposes: ['性质预测', '参数反演'], attributes: ['深度学习模型', '图神经网络', 'PyTorch'], keywords: ['储层', '孔隙度', '测井'], author: '王研究员', organization: '中国石油大学（北京）', version: 'v2.0.1', publishedAt: '2026-08-28', updatedAt: '2026-09-16', format: 'ONNX / YAML', size: '856 MB', downloads: 1800, views: 7200, favorites: 320, usage: 2900, metric: { label: 'R²', value: '0.921' }, files: files('reservoir.onnx', 'ONNX', '856 MB') }),
  record({ id: 'RA-PLAN-C-001', slug: 'high-throughput-catalyst-screening', category: 'compute-plan', name: '催化剂高通量筛选计算方案', summary: '组合 DFT、代理模型与优化算法的催化材料高通量筛选模板。', description: '包含候选构型生成、批量计算、指标评估与结果排序流程。', disciplines: ['计算科学', '材料科学'], purposes: ['性质预测', '工作流自动化'], attributes: ['高通量计算', '已验证'], keywords: ['DFT', '高通量', '催化剂'], author: '陈晓', organization: '中国科学技术大学', version: 'v1.4', publishedAt: '2026-08-20', updatedAt: '2026-09-15', format: 'YAML / ZIP', size: '42 MB', license: 'MIT', downloads: 736, views: 3180, favorites: 188, usage: 962, files: files('screening-plan.yaml', 'YAML', '36 KB') }),
  record({ id: 'RA-PLAN-E-001', slug: 'co2-hydrogenation-doe', category: 'experiment-plan', name: 'CO₂ 加氢催化评价 DOE 实验方案', summary: '围绕温度、压力、空速与组成设计的响应面实验模板。', description: '含材料与样品、实验步骤、参数条件、质量控制与安全检查。', disciplines: ['化学与化工'], purposes: ['实验设计', '结果解释'], attributes: ['DOE', '催化评价', '已验证'], keywords: ['CO₂加氢', 'DOE', '催化评价'], author: '张晓云', organization: '浙江大学', version: 'v1.1', publishedAt: '2026-08-12', updatedAt: '2026-09-13', format: 'PDF / XLSX', size: '8.5 MB', downloads: 621, views: 2840, favorites: 174, usage: 803, files: files('DOE-experiment-plan.pdf', 'PDF', '2.3 MB') }),
  record({ id: 'RA-AGENT-001', slug: 'scientific-literature-agent', category: 'agent', name: '科研文献调研智能体', summary: '面向科研问题完成检索规划、证据整理与研究空白提取。', description: '可配置检索范围与输出模板，启动后进入科研思路工作区。', disciplines: ['通用学科'], purposes: ['文献研读', '知识发现'], attributes: ['Agent', '8 Skills', '5 Tools'], keywords: ['文献调研', '证据', '科研智能体'], author: 'AI4S 科研助手团队', organization: 'AI4S 科研平台', version: 'v2.3', publishedAt: '2026-09-01', updatedAt: '2026-09-20', format: 'Agent Package', size: '18 MB', license: '平台内使用', downloads: 980, views: 6500, favorites: 432, usage: 12600, featured: true, files: files('agent-config.yaml', 'YAML', '18 KB') }),
  record({ id: 'RA-WF-001', slug: 'spectra-analysis-workflow', category: 'workflow', name: '催化剂谱图批量分析工作流', summary: '从原始谱图导入到预处理、峰拟合、质量检查和报告导出。', description: '支持 XRD、XPS 批量处理，每一步都可调整参数并保留运行记录。', disciplines: ['材料科学', '化学与化工'], purposes: ['表征分析', '工作流自动化'], attributes: ['Workflow', '谱图分析'], keywords: ['XRD', 'XPS', '批量分析'], author: '王芳', organization: '清华大学分析中心', version: 'v1.5', publishedAt: '2026-08-06', updatedAt: '2026-09-14', format: 'JSON / YAML', size: '6.2 MB', license: 'Apache 2.0', downloads: 560, views: 2910, favorites: 198, usage: 2300, files: files('workflow.json', 'JSON', '42 KB') }),
  record({ id: 'RA-SKILL-001', slug: 'scientific-chart-extraction', category: 'skill', name: '科研图表数据提取 Skill', summary: '识别科研文献中的表格、曲线和单位，生成可校正的结构化数据。', description: '适用于文献表格、折线图、柱状图的数字化提取，输出 CSV 和来源记录。', disciplines: ['通用学科'], purposes: ['文献研读', '数据清洗'], attributes: ['Skill', '图表提取'], keywords: ['PDF解析', '图表提取', 'CSV'], author: '陈晓', organization: 'AI4S 科研平台', version: 'v1.2', publishedAt: '2026-07-28', updatedAt: '2026-09-11', format: 'Skill Package', size: '3.8 MB', license: 'MIT', downloads: 1420, views: 7830, favorites: 612, usage: 9800, editorPick: true, files: files('SKILL.md', 'MD', '24 KB') }),
  record({ id: 'RA-SOFT-001', slug: 'molecular-simulation-studio', category: 'software', name: '分子模拟可视化工作台', summary: '用于分子结构搭建、轨迹可视化和常用性质分析的桌面软件。', description: '提供 Linux 与 Windows 安装包、安装说明和授权说明。', disciplines: ['计算科学', '材料科学'], purposes: ['机理建模', '数据可视化'], attributes: ['分子模拟', 'Linux', 'Windows'], keywords: ['分子模拟', '轨迹', '可视化'], author: '科学软件联合实验室', organization: '中国科学院', version: 'v4.2', publishedAt: '2026-06-19', updatedAt: '2026-09-10', format: 'AppImage / EXE', size: '680 MB', license: '科研授权', downloads: 2100, views: 8900, favorites: 482, usage: 3500, files: files('molecular-studio.AppImage', 'APP', '680 MB') }),
  record({ id: 'RA-ALG-001', slug: 'bayesian-parameter-inversion', category: 'algorithm', name: '贝叶斯参数反演算法工具包', summary: '面向非线性科学模型的参数反演、不确定性量化与敏感性分析。', description: '提供 Python SDK、命令行工具和实例数据，支持 MCMC 与变分推断。', disciplines: ['计算科学', '通用学科'], purposes: ['参数反演', '结果解释'], attributes: ['反演算法', 'Python SDK', 'API'], keywords: ['贝叶斯', '参数反演', 'MCMC'], author: '周强', organization: '北京大学数学科学学院', version: 'v2.0', publishedAt: '2026-05-16', updatedAt: '2026-09-08', format: 'Python Package', size: '24 MB', license: 'BSD-3-Clause', downloads: 1680, views: 6240, favorites: 390, usage: 5100, files: files('bayes-inversion.whl', 'WHL', '24 MB') }),
];

const lower = (value: string) => value.toLocaleLowerCase('zh-CN');

export function filterAssets(records: AssetRecord[], filter: AssetFilter): AssetRecord[] {
  const query = lower(filter.query?.trim() ?? '');
  return records.filter((item) => {
    if (filter.categories?.length && !filter.categories.includes(item.category)) return false;
    if (filter.disciplines?.length && !filter.disciplines.some((value) => item.disciplines.includes(value))) return false;
    if (filter.purposes?.length && !filter.purposes.some((value) => item.purposes.includes(value))) return false;
    if (filter.attributes?.length && !filter.attributes.some((value) => item.attributes.includes(value))) return false;
    if (!query) return true;
    const haystack = [item.name, item.summary, item.description, item.author, item.organization, item.format, ...item.disciplines, ...item.purposes, ...item.attributes, ...item.keywords, ...item.files.map((file) => file.name)].join(' ');
    return lower(haystack).includes(query);
  });
}

export function sortAssets(records: AssetRecord[], sort: SortKey): AssetRecord[] {
  const sorted = [...records];
  if (sort === 'latest') return sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (sort === 'updated') return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (sort === 'downloads') return sorted.sort((a, b) => b.downloads - a.downloads);
  if (sort === 'views') return sorted.sort((a, b) => b.views - a.views);
  if (sort === 'favorites') return sorted.sort((a, b) => b.favorites - a.favorites);
  if (sort === 'usage') return sorted.sort((a, b) => b.usage - a.usage);
  return sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.downloads + b.views + b.favorites) - (a.downloads + a.views + a.favorites));
}

const isCategory = (value: string | null): value is AssetCategoryKey => assetCategories.some((item) => item.key === value);

export function resolveAssetRoute(pathname: string, rawSearch = ''): AssetRoute {
  const search = new URLSearchParams(rawSearch);
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'assets') return { kind: 'home' };
  if (parts[0] !== 'assets') return { kind: 'not-found' };
  if (parts[1] === 'upload') {
    const category = search.get('type');
    return isCategory(category) ? { kind: 'upload', category } : { kind: 'upload' };
  }
  if (parts[1] === 'mine') return { kind: 'mine' };
  if (parts[1] === 'search') return { kind: 'search' };
  if (parts[1] === 'data-knowledge') {
    const category = search.get('tab');
    return { kind: 'plaza', category: category === 'knowledge' || category === 'outcome' ? category : 'data' };
  }
  if (parts[1] === 'models') return { kind: 'plaza', category: 'model' };
  if (parts[1] === 'plans') return { kind: 'plaza', category: search.get('tab') === 'experiment-plan' ? 'experiment-plan' : 'compute-plan' };
  if (parts[1] === 'intelligent-services') {
    const category = search.get('tab');
    return { kind: 'plaza', category: isCategory(category) && ['agent', 'workflow', 'skill', 'software', 'algorithm'].includes(category) ? category : 'agent' };
  }
  if (isCategory(parts[1]) && parts[2]) return { kind: 'detail', category: parts[1], slug: parts[2] };
  return { kind: 'not-found' };
}

export function categoryByKey(key: AssetCategoryKey) {
  return assetCategories.find((item) => item.key === key)!;
}

export function plazaHref(key: AssetCategoryKey) {
  if (key === 'data') return '/assets/data-knowledge';
  if (key === 'knowledge' || key === 'outcome') return `/assets/data-knowledge?tab=${key}`;
  if (key === 'model') return '/assets/models';
  if (key === 'compute-plan') return '/assets/plans';
  if (key === 'experiment-plan') return '/assets/plans?tab=experiment-plan';
  return `/assets/intelligent-services?tab=${key}`;
}

export function detailHref(item: Pick<AssetRecord, 'category' | 'slug'>) {
  return `/assets/${item.category}/${item.slug}`;
}
