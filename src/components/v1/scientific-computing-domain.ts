export type ComputingCategory = "compute" | "training" | "inference";
export type ComputingStatus = "运行中" | "排队中" | "已完成" | "失败" | "已停止";
export const COMPUTING_DETAIL_TABS = ["概览", "配置与运行", "结果分析", "文件与日志"] as const;
export type ComputingDetailTab = (typeof COMPUTING_DETAIL_TABS)[number];

export function normalizeComputingDetailTab(tab: string | null | undefined): ComputingDetailTab {
  if (COMPUTING_DETAIL_TABS.includes(tab as ComputingDetailTab)) return tab as ComputingDetailTab;
  if (tab === "运行过程") return "配置与运行";
  if (tab === "计算结果") return "结果分析";
  if (tab === "结果文件" || tab === "运行日志") return "文件与日志";
  return "概览";
}
export interface ComputingTask {
  id: string;
  spaceId: string;
  category: ComputingCategory;
  name: string;
  type: string;
  software: string;
  inputFile: string;
  owner: string;
  updatedAt: string;
  status: ComputingStatus;
  progress: number;
  model?: string;
  metric?: string;
  samples?: number;
  outputFile?: string;
  precision?: string;
  encut?: string;
  kpoints?: string;
  ediff?: string;
  resource?: string;
  duration?: string;
  note?: string;
  domain?: "油气炼化";
  templateId?: RefineryTemplateId;
  parameters?: Record<string, string>;
}

export type RefineryTemplateId = "cdu-steady-state" | "fcc-reactor-regenerator" | "fired-heater-cfd" | "generic-refinery-process" | "generic-refinery-reactor";
export interface ComputingScenario {
  templateId: RefineryTemplateId;
  objective: string;
  parameters: Array<{ label: string; value: string }>;
  stages: Array<{ name: string; status: "已完成" | "运行中" | "排队中" | "失败"; detail: string }>;
  metrics: Array<{ label: string; value: string; note: string }>;
  tableTitle: string;
  tableHeaders: string[];
  tableRows: string[][];
  chartTitle: string;
  chartUnit: string;
  chartData: Array<{ step: string | number; value: number }>;
  conclusion: string;
  files: Array<{ name: string; size: string; description: string }>;
  log: string;
  workdir: string;
}

export interface ModelTaskScenario {
  objective: string;
  stages: Array<{ name: string; status: "已完成" | "运行中" | "排队中" | "失败"; detail: string }>;
  metrics: Array<{ label: string; value: string; note: string }>;
  chartTitle: string;
  chartData: Array<{ step: number; value: number }>;
  tableTitle: string;
  tableHeaders: string[];
  tableRows: string[][];
  files: Array<{ name: string; description: string }>;
  log: string;
}

const computeRows = [
  ["常减压装置原油切割方案模拟", "稳态流程模拟", "Aspen HYSYS", "crude_assay_2026Q3.xlsx", "张伟", "运行中", 68, "cdu-steady-state"],
  ["FCC反应—再生系统产率预测", "炼化反应器模拟", "Aspen HYSYS Petroleum Refining", "vgo_feed_properties.xlsx", "李娜", "已完成", 100, "fcc-reactor-regenerator"],
  ["加热炉燃烧与炉管热流密度CFD分析", "反应流CFD", "OpenFOAM reactingFoam", "heater_furnace_v12.step", "王强", "失败", 43, "fired-heater-cfd"],
  ["柴油加氢脱硫反应器床层温升模拟", "炼化反应器模拟", "Aspen HYSYS Petroleum Refining", "diesel_hds_feed.xlsx", "张伟", "排队中", 0, "generic-refinery-reactor"],
  ["催化重整装置芳烃收率预测", "炼化反应器模拟", "Aspen HYSYS Petroleum Refining", "naphtha_feed_assay.xlsx", "陈敏", "已完成", 100, "generic-refinery-reactor"],
  ["延迟焦化装置产品收率计算", "炼化反应器模拟", "Aspen HYSYS Petroleum Refining", "vacuum_residue_assay.xlsx", "王强", "已完成", 100, "generic-refinery-reactor"],
  ["酸性气脱除系统能耗优化", "稳态流程模拟", "Aspen HYSYS", "acid_gas_feed.csv", "李娜", "运行中", 42, "generic-refinery-process"],
  ["原油预热换热网络节能分析", "稳态流程模拟", "Aspen Energy Analyzer", "preheat_train_case.bkp", "刘洋", "排队中", 0, "generic-refinery-process"],
] as const;
const trainingRows = [
  ["催化活性预测模型训练", "Catalyst-GNN v1.0", "催化剂实验数据集 v3.2", "张伟", "运行中", 68, "Loss: 0.186"],
  ["配方推荐模型增量训练", "RecipeFormer v2.1", "配方文献+实验数据 v1.5", "李娜", "排队中", 0, "—"],
  ["稳定性分类模型训练", "Stability-Bert v1.0", "材料稳定性数据集 v2.0", "王强", "已完成", 100, "Accuracy: 0.921"],
  ["反应选择性预测模型训练", "SelectNet v1.3", "反应性能数据集 v1.1", "陈敏", "失败", 23, "Loss: 1.203"],
  ["多金属催化剂性能预测训练", "MultiCat v2.0", "多金属合金数据集 v4.0", "王强", "已完成", 100, "R²: 0.876"],
  ["催化剂寿命预测模型训练", "LifeNet v1.1", "长期稳定性数据集 v1.3", "李娜", "已完成", 100, "MAE: 0.042"],
  ["反应条件优化模型训练", "Opt-Transformer v1.2", "高通量计算数据集 v2.1", "刘洋", "运行中", 37, "Loss: 0.372"],
  ["表面吸附能预测模型训练", "AdsorbNet v1.0", "DFT计算数据集 v1.0", "刘洋", "排队中", 0, "—"],
] as const;
const inferenceRows = [
  ["催化剂候选配方批量预测", "催化剂性能预测模型 v2.1", "候选配方集_v3.csv", "张伟", "运行中", 1200, "置信度均值: 0.862"],
  ["催化稳定性快速评分", "催化稳定性评估模型 v1.3", "稳定性测试集.xlsx", "李娜", "排队中", 568, "—"],
  ["表面能参数预测", "表面性质预测模型 v2.0", "表面结构数据.xyz", "王强", "已完成", 320, "surface_energy.xlsx"],
  ["高通量样本推理", "多任务催化剂大模型 v1.5", "高通量样本库.sdf", "陈敏", "失败", 5000, "输入格式不匹配"],
  ["CO₂还原活性趋势预测", "反应活性预测模型 v1.2", "CO2RR_测试集.csv", "王强", "已完成", 800, "activity_pred.csv"],
  ["新型载体材料筛选推理", "材料性质联合模型 v3.0", "载体结构库.cif", "刘洋", "运行中", 2450, "置信度均值: 0.784"],
  ["反应路径能垒预测", "反应机理预测模型 v1.1", "反应路径集合.json", "李娜", "已完成", 186, "barrier_results.csv"],
  ["催化剂选择性预测", "选择性预测模型 v2.2", "选择性验证集.csv", "刘洋", "排队中", 940, "—"],
] as const;

const scenarioByTemplate: Record<RefineryTemplateId, Omit<ComputingScenario, "templateId">> = {
  "cdu-steady-state": {
    objective: "基于原油评价数据建立常减压装置稳态模型，校核产品切割、物料衡算与装置能耗。",
    parameters: [{ label: "原油处理量", value: "800 万吨/年" }, { label: "进料温度", value: "365 ℃" }, { label: "常压塔顶压力", value: "145 kPa" }, { label: "汽提蒸汽量", value: "3.8 t/h" }, { label: "物性方法", value: "Peng-Robinson" }, { label: "求解模式", value: "稳态" }],
    stages: [{ name: "原油评价映射", status: "已完成", detail: "生成 36 个石油假组分" }, { name: "物性回归", status: "已完成", detail: "密度与TBP曲线校核通过" }, { name: "常压塔求解", status: "运行中", detail: "正在收敛侧线产品规格" }, { name: "能量衡算", status: "排队中", detail: "等待塔模型收敛" }, { name: "结果汇总", status: "排队中", detail: "尚未生成正式结果" }],
    metrics: [{ label: "总体进度", value: "68%", note: "已完成 2 / 5 个阶段" }, { label: "物料衡算误差", value: "0.18%", note: "目标 < 0.50%" }, { label: "当前塔顶温度", value: "118.6 ℃", note: "目标区间 115–122 ℃" }, { label: "炉负荷", value: "61.8 MW", note: "当前迭代值" }],
    tableTitle: "产品切割与收率", tableHeaders: ["物流", "切割范围", "流量 t/h", "收率", "密度 kg/m³", "状态"], tableRows: [["轻石脑油", "IBP–90 ℃", "18.4", "2.01%", "690", "已收敛"], ["重石脑油", "90–180 ℃", "72.6", "7.94%", "748", "已收敛"], ["航煤", "180–240 ℃", "96.8", "10.59%", "801", "计算中"], ["柴油", "240–350 ℃", "214.2", "23.43%", "846", "计算中"], ["常压渣油", ">350 ℃", "512.0", "56.02%", "934", "待校核"]],
    chartTitle: "常压塔温度分布", chartUnit: "℃", chartData: [{ step: 1, value: 118.6 }, { step: 8, value: 168.2 }, { step: 16, value: 231.5 }, { step: 24, value: 296.8 }, { step: 32, value: 351.4 }, { step: 40, value: 367.1 }],
    conclusion: "常压塔已基本收敛，当前柴油侧线收率为 23.43%。完成能量衡算后再确认最终切割方案。",
    files: [{ name: "crude_assay_mapping.json", size: "186 KB", description: "原油假组分映射" }, { name: "column_profile.csv", size: "42 KB", description: "塔板温压组成分布" }, { name: "stream_summary.csv", size: "28 KB", description: "物流汇总" }, { name: "energy_balance.xlsx", size: "96 KB", description: "装置能量衡算（生成中）" }],
    log: "[03:58:12] 读取原油评价 crude_assay_2026Q3.xlsx\n[03:58:16] 已生成 36 个石油假组分\n[03:58:24] Peng-Robinson 物性回归完成\n[03:59:05] 常压塔初始化完成\n[04:01:18] Iteration 42: material error = 0.18%\n[04:01:22] 正在收敛柴油侧线产品规格...",
    workdir: "/refinery/cdu/case-2026Q3/",
  },
  "fcc-reactor-regenerator": {
    objective: "建立FCC提升管—再生器耦合模型，预测转化率、产品收率、焦炭产率及反应—再生热平衡。",
    parameters: [{ label: "原料流量", value: "185 t/h" }, { label: "反应温度", value: "515 ℃" }, { label: "再生温度", value: "690 ℃" }, { label: "催化剂油比", value: "6.5" }, { label: "提升管停留时间", value: "2.4 s" }, { label: "催化剂活性", value: "68" }],
    stages: [{ name: "原料性质映射", status: "已完成", detail: "VGO 12集总组分初始化" }, { name: "提升管反应", status: "已完成", detail: "动力学计算完成" }, { name: "催化剂结焦", status: "已完成", detail: "定碳 0.91 wt%" }, { name: "再生器热平衡", status: "已完成", detail: "热平衡偏差 0.34%" }, { name: "产品收率汇总", status: "已完成", detail: "模型校核通过" }],
    metrics: [{ label: "原料转化率", value: "78.6%", note: "较基准提高 1.8%" }, { label: "汽油收率", value: "47.3%", note: "质量分数" }, { label: "LPG收率", value: "18.9%", note: "质量分数" }, { label: "焦炭收率", value: "5.12%", note: "质量分数" }],
    tableTitle: "FCC产品收率", tableHeaders: ["产品", "基准收率", "模拟收率", "变化", "质量状态"], tableRows: [["干气", "3.8%", "3.6%", "-0.2%", "合格"], ["LPG", "17.5%", "18.9%", "+1.4%", "合格"], ["汽油", "46.2%", "47.3%", "+1.1%", "辛烷值 92.4"], ["柴油", "19.8%", "18.6%", "-1.2%", "合格"], ["油浆", "7.6%", "6.5%", "-1.1%", "合格"], ["焦炭", "5.1%", "5.12%", "+0.02%", "热平衡满足"]],
    chartTitle: "反应温度—汽油收率", chartUnit: "%", chartData: [{ step: 500, value: 44.8 }, { step: 505, value: 45.9 }, { step: 510, value: 46.8 }, { step: 515, value: 47.3 }, { step: 520, value: 47.1 }, { step: 525, value: 46.4 }],
    conclusion: "515 ℃、剂油比 6.5 条件下汽油收率达到 47.3%，再生器热平衡偏差 0.34%，建议进入工艺工程师复核。",
    files: [{ name: "fcc_product_yield.csv", size: "36 KB", description: "产品收率" }, { name: "riser_profile.csv", size: "88 KB", description: "提升管轴向分布" }, { name: "regenerator_balance.xlsx", size: "124 KB", description: "再生器热平衡" }, { name: "kinetic_parameters.json", size: "18 KB", description: "动力学参数快照" }, { name: "FCC产率预测报告.pdf", size: "2.6 MB", description: "计算报告" }],
    log: "[20:18:03] VGO原料性质映射完成\n[20:18:21] 12集总动力学模型初始化\n[20:19:44] 提升管反应器收敛，转化率 78.6%\n[20:20:17] 催化剂定碳 0.91 wt%\n[20:21:08] 再生器热平衡偏差 0.34%\n[20:21:20] 模型校核通过，结果文件已生成",
    workdir: "/refinery/fcc/run-20261001-02/",
  },
  "fired-heater-cfd": {
    objective: "模拟加热炉内非预混燃烧、烟气流动和辐射传热，评价炉管热流密度与排放风险。",
    parameters: [{ label: "网格单元数", value: "8.24 million" }, { label: "燃料气流量", value: "8200 Nm³/h" }, { label: "空气过剩系数", value: "1.15" }, { label: "空气温度", value: "210 ℃" }, { label: "湍流模型", value: "Realizable k-ε" }, { label: "辐射模型", value: "P1" }],
    stages: [{ name: "几何与网格检查", status: "已完成", detail: "最大非正交度 68.4" }, { name: "冷态流场初始化", status: "已完成", detail: "连续性残差 8.2×10⁻⁵" }, { name: "燃烧与组分求解", status: "失败", detail: "局部温度超出热物性表范围" }, { name: "辐射传热", status: "排队中", detail: "未执行" }, { name: "排放后处理", status: "排队中", detail: "未执行" }],
    metrics: [{ label: "失败时间步", value: "0.84 s", note: "最近有效时间" }, { label: "最高温度", value: "2387 K", note: "超过物性表上限" }, { label: "连续性残差", value: "3.7×10⁻³", note: "未收敛" }, { label: "最大热流密度", value: "—", note: "结果无效" }],
    tableTitle: "求解阶段与残差", tableHeaders: ["时间步", "连续性", "能量", "组分", "最高温度", "状态"], tableRows: [["0.60 s", "6.8×10⁻⁴", "2.4×10⁻⁵", "7.1×10⁻⁴", "1894 K", "正常"], ["0.72 s", "8.5×10⁻⁴", "3.6×10⁻⁵", "9.4×10⁻⁴", "2051 K", "正常"], ["0.80 s", "1.4×10⁻³", "8.2×10⁻⁵", "1.8×10⁻³", "2248 K", "警告"], ["0.84 s", "3.7×10⁻³", "2.1×10⁻⁴", "4.6×10⁻³", "2387 K", "失败"]],
    chartTitle: "炉膛最高温度历史", chartUnit: "K", chartData: [{ step: 0.2, value: 1280 }, { step: 0.4, value: 1560 }, { step: 0.6, value: 1894 }, { step: 0.72, value: 2051 }, { step: 0.8, value: 2248 }, { step: 0.84, value: 2387 }],
    conclusion: "燃烧—能量方程在0.84 s发散，当前温度场、热流密度和排放结果均无效。建议检查燃料组分归一化并降低初始时间步。",
    files: [{ name: "mesh_quality_report.txt", size: "24 KB", description: "网格质量报告" }, { name: "residual_history.csv", size: "61 KB", description: "残差历史" }, { name: "last_valid_state_0.84s.foam", size: "486 MB", description: "最后有效时间步" }, { name: "solver.log", size: "182 KB", description: "求解器日志" }],
    log: "[16:44:02] 网格检查通过，cells=8,240,516\n[16:46:18] 冷态流场初始化完成\n[16:49:40] 启动组分输运、燃烧与能量方程\n[16:52:11] WARNING temperature reached 2248 K\n[16:52:36] ERROR thermophysical range exceeded at cell 481923\n[16:52:36] Time step 0.84 s aborted; derived results invalid",
    workdir: "/refinery/fired-heater/cfd/run-004/",
  },
  "generic-refinery-process": {
    objective: "对炼化流程的物料、能量和关键操作条件进行稳态模拟与方案评价。", parameters: [{ label: "处理量", value: "120 t/h" }, { label: "操作压力", value: "1.8 MPa" }, { label: "进料温度", value: "42 ℃" }, { label: "物性方法", value: "Peng-Robinson" }], stages: [{ name: "输入校验", status: "已完成", detail: "物流和组分完整" }, { name: "流程初始化", status: "已完成", detail: "初值生成完成" }, { name: "流程求解", status: "运行中", detail: "正在收敛" }, { name: "结果汇总", status: "排队中", detail: "等待求解完成" }], metrics: [{ label: "总体进度", value: "42%", note: "流程求解中" }, { label: "物料误差", value: "0.31%", note: "目标 < 0.50%" }, { label: "能耗", value: "18.6 MW", note: "当前值" }, { label: "结果文件", value: "待生成", note: "完成后归档" }], tableTitle: "关键物流", tableHeaders: ["物流", "流量 t/h", "温度 ℃", "压力 MPa", "状态"], tableRows: [["进料", "120.0", "42", "1.80", "已固定"], ["产品气", "18.4", "38", "1.62", "计算中"], ["液相产品", "101.2", "46", "1.58", "计算中"]], chartTitle: "流程收敛历史", chartUnit: "%", chartData: [{ step: 1, value: 8 }, { step: 5, value: 24 }, { step: 10, value: 38 }, { step: 15, value: 42 }], conclusion: "流程模型正在收敛，完成后需校核产品规格与能耗。", files: [{ name: "stream_summary.csv", size: "22 KB", description: "物流汇总" }, { name: "run.log", size: "16 KB", description: "运行日志" }], log: "[INFO] 炼化流程模型初始化\n[INFO] 物性计算完成\n[INFO] 正在求解流程循环...", workdir: "/refinery/process/generic/",
  },
  "generic-refinery-reactor": {
    objective: "基于原料性质与动力学模型预测炼化反应器转化率、产品分布和温升。", parameters: [{ label: "反应温度", value: "365 ℃" }, { label: "反应压力", value: "6.2 MPa" }, { label: "液时空速", value: "1.6 h⁻¹" }, { label: "氢油比", value: "420 Nm³/m³" }], stages: [{ name: "原料映射", status: "已完成", detail: "原料集总完成" }, { name: "动力学初始化", status: "已完成", detail: "参数加载完成" }, { name: "反应器求解", status: "已完成", detail: "床层计算完成" }, { name: "产品评价", status: "已完成", detail: "结果已汇总" }], metrics: [{ label: "转化率", value: "91.4%", note: "质量基准" }, { label: "产品收率", value: "86.8%", note: "目标产品" }, { label: "床层温升", value: "28.6 ℃", note: "最大值" }, { label: "结果文件", value: "4 个", note: "已归档" }], tableTitle: "反应器轴向分布", tableHeaders: ["床层", "入口温度", "出口温度", "转化率", "状态"], tableRows: [["Bed-1", "365 ℃", "382 ℃", "62.3%", "完成"], ["Bed-2", "374 ℃", "393 ℃", "84.7%", "完成"], ["Bed-3", "380 ℃", "394 ℃", "91.4%", "完成"]], chartTitle: "床层转化率", chartUnit: "%", chartData: [{ step: 0, value: 0 }, { step: 1, value: 62.3 }, { step: 2, value: 84.7 }, { step: 3, value: 91.4 }], conclusion: "反应器计算完成，床层温升和目标产品收率处于方案约束内。", files: [{ name: "reactor_profile.csv", size: "34 KB", description: "床层分布" }, { name: "product_yield.xlsx", size: "82 KB", description: "产品收率" }, { name: "kinetics_snapshot.json", size: "19 KB", description: "动力学参数" }, { name: "run.log", size: "28 KB", description: "运行日志" }], log: "[INFO] 原料性质映射完成\n[INFO] 动力学参数加载完成\n[INFO] 三床层反应器收敛\n[INFO] 产品评价完成", workdir: "/refinery/reactor/generic/",
  },
};

export function getComputingScenario(task: ComputingTask): ComputingScenario {
  const templateId = task.templateId ?? "generic-refinery-process";
  return { templateId, ...scenarioByTemplate[templateId] };
}

export function getModelTaskScenario(task: ComputingTask): ModelTaskScenario {
  const training = task.category === "training";
  const failed = task.status === "失败";
  if (training) return {
    objective: `使用${task.inputFile}训练${task.model ?? "科研模型"}，跟踪训练损失、验证集指标和模型检查点。`,
    stages: [{ name: "数据集校验", status: "已完成", detail: "字段、标签和数据切分检查完成" }, { name: "训练环境初始化", status: "已完成", detail: "依赖与随机种子已固定" }, { name: "模型训练", status: failed ? "失败" : task.status === "已完成" ? "已完成" : "运行中", detail: failed ? "梯度出现异常，训练中止" : `已完成 ${task.progress}%` }, { name: "模型评价", status: task.status === "已完成" ? "已完成" : "排队中", detail: "验证集与测试集评价" }, { name: "模型归档", status: task.status === "已完成" ? "已完成" : "排队中", detail: "权重、配置和指标归档" }],
    metrics: [{ label: "训练进度", value: `${task.progress}%`, note: task.status }, { label: "当前指标", value: task.metric ?? "—", note: "验证集" }, { label: "训练轮次", value: task.parameters?.["训练轮次"] ?? "120", note: "最大Epoch" }, { label: "最佳检查点", value: task.status === "已完成" ? "epoch-108" : "待生成", note: "按验证指标保存" }],
    chartTitle: "训练损失变化", chartData: Array.from({ length: 13 }, (_, index) => ({ step: index * 10, value: Number((1.28 * Math.exp(-index / 3.5) + 0.11).toFixed(3)) })),
    tableTitle: "训练与验证指标", tableHeaders: ["Epoch", "Train Loss", "Val Loss", "主指标", "状态"], tableRows: [["20", "0.842", "0.906", "0.712", "完成"], ["40", "0.516", "0.601", "0.801", "完成"], ["60", "0.331", "0.428", "0.854", "完成"], ["80", "0.224", "0.319", "0.889", task.progress >= 67 ? "完成" : "待运行"], ["100", "0.168", "0.274", "0.912", task.progress >= 84 ? "完成" : "待运行"]],
    files: [{ name: "best_model.pt", description: "最佳模型权重" }, { name: "training_metrics.csv", description: "训练与验证指标" }, { name: "training_config.yaml", description: "训练配置快照" }, { name: "dataset_manifest.json", description: "数据集版本清单" }],
    log: `[INFO] 加载训练数据集 ${task.inputFile}\n[INFO] 初始化模型 ${task.model ?? "未指定"}\n[INFO] epochs=${task.parameters?.["训练轮次"] ?? "120"}, learning_rate=${task.parameters?.["学习率"] ?? "0.001"}\n[INFO] 当前进度 ${task.progress}%\n${failed ? "[ERROR] gradient overflow detected; training aborted" : "[INFO] checkpoint and metrics synchronized"}`,
  };
  return {
    objective: `使用${task.model ?? "科研模型"}对${task.inputFile}执行${task.parameters?.["推理模式"] ?? "批量预测"}，生成预测结果与置信度。`,
    stages: [{ name: "模型版本校验", status: "已完成", detail: "模型权重与运行时兼容" }, { name: "输入数据校验", status: failed ? "失败" : "已完成", detail: failed ? "输入字段与模型Schema不匹配" : "字段映射和缺失值检查完成" }, { name: "批量推理", status: task.status === "已完成" ? "已完成" : failed ? "排队中" : "运行中", detail: `已处理 ${task.samples?.toLocaleString() ?? 0} 个样本` }, { name: "结果后处理", status: task.status === "已完成" ? "已完成" : "排队中", detail: "置信度过滤与结果汇总" }],
    metrics: [{ label: "预测样本", value: task.samples?.toLocaleString() ?? "—", note: "输入规模" }, { label: "任务进度", value: `${task.progress}%`, note: task.status }, { label: "结果摘要", value: task.metric ?? "—", note: "模拟指标" }, { label: "置信度阈值", value: task.parameters?.["置信度阈值"] ?? "0.75", note: "低于阈值需复核" }],
    chartTitle: "预测置信度分布", chartData: [{ step: 1, value: 0.62 }, { step: 2, value: 0.71 }, { step: 3, value: 0.78 }, { step: 4, value: 0.84 }, { step: 5, value: 0.91 }, { step: 6, value: 0.87 }],
    tableTitle: "推理结果摘要", tableHeaders: ["样本", "预测值", "置信度", "状态"], tableRows: [["sample-001", "0.862", "0.91", "高置信"], ["sample-002", "0.784", "0.87", "高置信"], ["sample-003", "0.611", "0.72", "需要复核"], ["sample-004", "0.829", "0.89", "高置信"]],
    files: [{ name: "prediction_results.csv", description: "逐样本预测结果" }, { name: "confidence_summary.json", description: "置信度统计" }, { name: "inference_config.yaml", description: "推理配置快照" }, { name: "input_manifest.json", description: "输入数据清单" }],
    log: `[INFO] 加载模型 ${task.model ?? "未指定"}\n[INFO] 校验输入数据 ${task.inputFile}\n[INFO] inference_mode=${task.parameters?.["推理模式"] ?? "批量预测"}, confidence_threshold=${task.parameters?.["置信度阈值"] ?? "0.75"}\n${failed ? "[ERROR] input schema mismatch; inference aborted" : `[INFO] processed ${task.samples?.toLocaleString() ?? 0} samples`}`,
  };
}

export function createComputingSeed(spaceId: string): ComputingTask[] {
  const dates = ["2024-10-28 14:32", "2024-10-28 11:06", "2024-10-27 20:18", "2024-10-27 16:44", "2024-10-26 19:20", "2024-10-26 15:03", "2024-10-25 10:21", "2024-10-24 22:17"];
  const base = (category: ComputingCategory, index: number, row: readonly [string, string, string, string, string, ComputingStatus, number]): ComputingTask => ({ id: `${category}-${index + 1}`, spaceId, category, name: row[0], type: row[1], software: category === "compute" ? row[2] : "", inputFile: row[3], owner: row[4], updatedAt: dates[index], status: row[5], progress: row[6], resource: category === "compute" ? "炼化科学计算节点" : "GPU 节点（A100 80GB）", duration: category === "compute" ? "6 小时 13 分钟" : undefined, outputFile: row[5] === "已完成" ? "结果数据包.zip" : undefined });
  return [
    ...computeRows.map((row, i) => ({ ...base("compute", i, row.slice(0, 7) as unknown as readonly [string, string, string, string, string, ComputingStatus, number]), domain: "油气炼化" as const, templateId: row[7] as RefineryTemplateId })),
    ...trainingRows.map((row, i) => ({ ...base("training", i, [row[0], "模型训练", "", row[2], row[3], row[4], row[5]]), model: row[1], metric: row[6], parameters: { "训练方式": i === 1 ? "增量训练" : "全量训练", "训练轮次": "120", "批大小": "64", "学习率": "0.001", "验证集比例": "20%", "目标指标": "Validation Loss" } })),
    ...inferenceRows.map((row, i) => ({ ...base("inference", i, [row[0], "模型推理", "", row[2], row[3], row[4], row[4] === "运行中" ? 68 : row[4] === "已完成" ? 100 : 0]), model: row[1], samples: row[5], metric: row[6], outputFile: row[4] === "已完成" ? row[6] : undefined, parameters: { "推理模式": "批量预测", "批大小": "256", "置信度阈值": "0.75", "输出格式": "CSV + JSON" } })),
  ];
}

export function filterComputingTasks(tasks: ComputingTask[], filters: { category: ComputingCategory; query: string; status: string; model?: string }) {
  const q = filters.query.trim().toLocaleLowerCase();
  return tasks.filter((task) => task.category === filters.category && (filters.status === "全部" || task.status === filters.status) && (!filters.model || filters.model === "全部" || task.model === filters.model) && (!q || [task.name, task.type, task.software, task.inputFile, task.owner, task.model].some((value) => value?.toLocaleLowerCase().includes(q))));
}

export function nextComputingStatus(status: ComputingStatus, action: "start" | "stop" | "retry" | "complete"): ComputingStatus | null {
  if (action === "stop" && (status === "运行中" || status === "排队中")) return "已停止";
  if (action === "start" && status === "排队中") return "运行中";
  if (action === "complete" && status === "运行中") return "已完成";
  if (action === "retry" && (status === "失败" || status === "已停止")) return "排队中";
  return null;
}

export function validateComputeDraft(draft: { name: string; fileName: string }) {
  return [...(!draft.name.trim() ? ["请输入任务名称"] : []), ...(!draft.fileName.trim() ? ["请选择输入结构文件"] : [])];
}
