export type ComputingCategory = "compute" | "training" | "inference";
export type ComputingStatus = "运行中" | "排队中" | "已完成" | "失败" | "已停止";
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
}

const computeRows = [
  ["PtNi合金表面吸附能计算", "DFT 参数计算", "VASP", "POSCAR_PtNi.vasp", "张伟", "运行中", 68],
  ["催化剂助剂定性模拟", "分子动力学模拟", "LAMMPS", "catalyst.cif", "李娜", "排队中", 0],
  ["CO₂还原反应路径搜索", "反应路径搜索", "DeepMD-kit", "CO2RR.xyz", "王强", "已完成", 100],
  ["催化剂构型优化", "结构优化计算", "QE", "catalyst.in", "张伟", "失败", 23],
  ["ZrO₂载体表面能计算", "DFT 参数计算", "VASP", "ZrO2.vasp", "陈敏", "已完成", 100],
  ["甲烷氧化反应动力学模拟", "分子动力学模拟", "GROMACS", "methane.gro", "王强", "已完成", 100],
  ["多金属催化剂筛选计算", "相图计算", "ATAT", "alloy.dat", "李娜", "运行中", 42],
  ["H₂选择性加氢机理研究", "反应路径搜索", "AutoNEB", "H2_path.xyz", "刘洋", "排队中", 0],
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

export function createComputingSeed(spaceId: string): ComputingTask[] {
  const dates = ["2024-10-28 14:32", "2024-10-28 11:06", "2024-10-27 20:18", "2024-10-27 16:44", "2024-10-26 19:20", "2024-10-26 15:03", "2024-10-25 10:21", "2024-10-24 22:17"];
  const base = (category: ComputingCategory, index: number, row: readonly [string, string, string, string, string, ComputingStatus, number]): ComputingTask => ({ id: `${category}-${index + 1}`, spaceId, category, name: row[0], type: row[1], software: category === "compute" ? row[2] : "", inputFile: row[3], owner: row[4], updatedAt: dates[index], status: row[5], progress: row[6], encut: "500", kpoints: "5 × 5 × 1", ediff: "1e-5", resource: "GPU 节点（A100 80GB）", duration: category === "compute" ? "6 小时 13 分钟" : undefined, outputFile: row[5] === "已完成" ? "结果文件.zip" : undefined });
  return [
    ...computeRows.map((row, i) => base("compute", i, row)),
    ...trainingRows.map((row, i) => ({ ...base("training", i, [row[0], "模型训练", "", row[2], row[3], row[4], row[5]]), model: row[1], metric: row[6] })),
    ...inferenceRows.map((row, i) => ({ ...base("inference", i, [row[0], "模型推理", "", row[2], row[3], row[4], row[4] === "运行中" ? 68 : row[4] === "已完成" ? 100 : 0]), model: row[1], samples: row[5], metric: row[6], outputFile: row[4] === "已完成" ? row[6] : undefined })),
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
