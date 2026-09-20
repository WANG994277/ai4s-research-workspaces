import { scenarioFor, scenarioPlan } from './scenarios';
import type { ComputePlan, ComputeState, ComputeTask, ScientificTool } from './types';

export const stamp = '2026-09-21 10:20';
export const defaultParameters = [
  { name: '温度', value: '25, 100, 150, 200, 250', unit: '℃', source: '文献参数 · Zhang et al., 2024' },
  { name: '围压', value: '10, 30, 60', unit: 'MPa', source: 'AI 推荐值 · 待人工确认' },
  { name: '弹性模量', value: '28', unit: 'GPa', source: '文献参数 · Wang et al., 2023' },
  { name: '泊松比', value: '0.24', unit: '—', source: '实验参数 · 页岩材料参数集 V3' },
  { name: '网格尺寸', value: '0.5', unit: 'mm', source: '领域默认值' },
];
export const initialPlan: ComputePlan = { projectId: 'PROJ-SHALE-06', id: 'PLAN-20260921-001', title: '页岩温压耦合裂缝模拟', goal: '模拟不同温度和围压组合对页岩裂缝扩展形态的影响，并找出最敏感的参数。', hypothesis: 'H1：温度与围压共同改变页岩裂缝破坏模式。', project: '深层页岩气储层机理研究', method: '热-力耦合有限元模拟', toolId: 'comsol', datasetId: 'data-shale-v3', modelId: 'model-xgb-v2', parameters: defaultParameters, outputs: ['裂缝扩展方向', '最大主应力', '塑性区范围', '破坏模式'], resources: 'CPU 32 核 / 内存 128 GB / 预计 2 小时', risks: '250 ℃以上的外推结果需实验验证；COMSOL 许可证 1 席；15 组参数组合。', evidence: ['科学假设 H1 · 读空间', 'Zhang et al., 2024 · 热-力耦合破坏', 'Wang et al., 2023 · 页岩弹性参数'], version: 1, status: '草稿', createdAt: stamp };
const baseTool = { favorite: false, schema: '{"temperature":{"type":"number","minimum":25,"maximum":250},"pressure":{"type":"number","minimum":10,"maximum":60}}', invocation: '容器化工具', timeout: 7200, resource: 'CPU 32 核 / 内存 128 GB', tested: true };
export const initialTools: ScientificTool[] = [
  { ...baseTool, id: 'comsol', name: 'COMSOL Multiphysics', type: '专业仿真软件', domain: '机理仿真', description: '多物理场耦合仿真，支持热传导、结构力学与裂缝扩展分析。', inputs: '几何模型、材料参数、边界条件', outputs: '应力场、温度场、裂缝路径', version: '6.2', environment: 'Linux / COMSOL Server 6.2', license: '可用 · 2 / 4 席', status: '已上架', favorite: true },
  { ...baseTool, id: 'abaqus', name: 'Abaqus', type: '专业仿真软件', domain: '地球科学', description: '非线性有限元与扩展有限元分析，用于岩石损伤与断裂模拟。', inputs: '网格文件、材料本构、载荷', outputs: '位移、应力、断裂场', version: '2024', environment: 'Linux / Intel MPI', license: '可用 · 1 / 2 席', status: '已上架' },
  { ...baseTool, id: 'lammps', name: 'LAMMPS', type: 'CLI 软件', domain: '材料科学', description: '大规模原子与分子动力学模拟，研究材料微观结构和热稳定性。', inputs: '原子结构、势函数、模拟脚本', outputs: '轨迹文件、热力学曲线', version: '29Aug2024', environment: 'CUDA 12 / OpenMPI', license: '开源 · GPL', status: '已上架' },
  { ...baseTool, id: 'openfoam', name: 'OpenFOAM', type: 'HPC 软件', domain: '油气勘探开发', description: '面向多孔介质渗流与复杂流体的开源计算流体力学平台。', inputs: '网格、流体属性、边界条件', outputs: '速度场、压力场', version: 'v2312', environment: 'Ubuntu 22.04 / MPI', license: '开源 · GPL', status: '已上架' },
  { ...baseTool, id: 'python', name: 'Python 科研计算', type: 'Python 包', domain: '数据分析', description: '数据清洗、统计分析、特征工程及科学可视化。', inputs: 'CSV / Parquet / NumPy', outputs: '数据集、图表、统计报告', version: '3.11', environment: 'Python 3.11 / SciPy 1.12', license: '开源 · PSF', status: '已上架' },
  { ...baseTool, id: 'pytorch', name: 'PyTorch', type: '模型推理服务', domain: 'AI/机器学习', description: '科学机器学习、物理信息神经网络训练与推理。', inputs: '训练数据、网络定义、权重', outputs: '模型权重、预测值、评价指标', version: '2.4', environment: 'CUDA 12.1 / A100', license: '开源 · BSD', status: '已上架' },
  { ...baseTool, id: 'matlab', name: 'MATLAB', type: '专业仿真软件', domain: '通用科学计算', description: '数值计算、信号分析与科学建模。', inputs: '矩阵、脚本、实验数据', outputs: '数值结果、图像、模型', version: 'R2024b', environment: 'MATLAB Runtime', license: '许可证已过期', status: '已上架' },
  { ...baseTool, id: 'cobra', name: 'COBRApy', type: 'Python 包', domain: '合成生物', description: '代谢网络建模、通量平衡分析与合成路径优化。', inputs: 'SBML 模型、反应约束', outputs: '代谢通量、候选路径', version: '0.29', environment: 'Python 3.11 / GLPK', license: '开源 · LGPL', status: '已上架' },
];
const task = (id: string, name: string, status: ComputeTask['status'], progress: number, extra: Partial<ComputeTask> = {}): ComputeTask => ({ id, name, status, progress, planId: initialPlan.id, planSnapshot: structuredClone(initialPlan), type: '多物理场仿真', project: initialPlan.project, toolId: 'comsol', toolVersion: '6.2', datasetId: initialPlan.datasetId, modelId: initialPlan.modelId, parameters: defaultParameters, resources: initialPlan.resources, environment: 'Linux / COMSOL Server 6.2 / Intel MPI', queue: '科研仿真队列', createdAt: stamp, duration: '1 小时 24 分', creator: '张博士', resultCount: status === '已完成' ? 7 : 0, version: 1, confirmations: ['2026-09-21 10:20 · 张博士确认计算方法、资源和许可证'], logs: ['10:20:00 [INFO] 任务已提交至科研仿真队列', '10:20:02 [INFO] 加载页岩材料参数集 V3', '10:20:05 [INFO] 材料本构与边界条件校验通过', '10:20:08 [INFO] 网格初始化完成：182,640 个单元', '10:20:10 [INFO] 热-力耦合求解器启动', '10:20:32 [WARNING] 局部温度梯度较高，已使用自适应步长'], conclusion: '演示结果：温度对裂缝扩展长度影响较显著，围压影响次之；建议在 150–200 ℃、30–45 MPa 区间开展实验验证。', review: '待人工分析', ...extra });
export function makeSeed(): ComputeState { const state: ComputeState = structuredClone({
  plans: [initialPlan], activePlanId: initialPlan.id, references: ['科学假设 H1', '页岩材料参数集 V3'], assets: [], handoffs: [],
  tasks: [task('SIM-20260921-003', '页岩温压耦合裂缝模拟', '运行中', 68), task('SIM-20260921-002', 'CO₂ 驱油多相渗流模拟', '排队中', 0, { toolId: 'openfoam', toolVersion: 'v2312', type: '流体模拟' }), task('SIM-20260920-008', '高温页岩裂缝基准实验对照', '已完成', 100, { createdAt: '2026-09-20 09:30' }), task('SIM-20260920-006', '催化剂候选材料稳定性筛选', '已完成', 100, { type: '材料筛选', project: '高效催化材料研发', toolId: 'lammps', toolVersion: '29Aug2024', createdAt: '2026-09-20 08:10' }), task('SIM-20260919-004', '深层储层精细网格模拟', '失败', 42, { error: '求解阶段内存不足（128 GB 已耗尽）。当前中间结果无效。', logs: ['10:20:00 [INFO] 任务初始化完成', '10:26:12 [WARNING] 内存使用率超过 95%', '10:26:18 [ERROR] OutOfMemory: 求解器申请内存失败'], createdAt: '2026-09-19 10:20' }), task('SIM-20260919-003', '裂缝扩展参数敏感性分析', '暂停', 36), task('SIM-20260918-001', '热-渗-力耦合方案草稿', '草稿', 0)],
  datasets: [ { id: 'data-shale-v1', name: '页岩材料参数集', version: 1, rows: 12840, columns: 8, quality: 89.4, source: '实验中心 / 真三轴实验', flow: ['原始实验数据'], createdAt: '2026-09-18 09:00', creator: '李研究员', usedBy: [] }, { id: 'data-shale-v2', name: '页岩材料参数集', version: 2, rows: 12526, columns: 8, quality: 96.2, source: '缺失值清洗', parentId: 'data-shale-v1', flow: ['缺失值插补', '异常值识别'], createdAt: '2026-09-19 14:30', creator: '张博士', usedBy: [] }, { id: 'data-shale-v3', name: '页岩材料参数集', version: 3, rows: 12526, columns: 8, quality: 99.1, source: '单位统一与标准化', parentId: 'data-shale-v2', flow: ['缺失值插补', '异常值识别', '单位统一', '特征标准化'], createdAt: stamp, creator: '张博士', usedBy: ['SIM-20260921-003'] }, { id: 'data-catalyst-v1', name: '催化剂结构与性能', version: 1, rows: 2640, columns: 12, quality: 97.8, source: '材料数据库', flow: ['原始数据'], createdAt: stamp, creator: '王研究员', usedBy: [] } ],
  models: [{ id: 'model-xgb-v1', name: '裂缝长度预测模型', version: 1, type: 'XGBoost', datasetId: 'data-shale-v2', testSet: '页岩固定测试集 T1（2,505 条）', r2: .906, rmse: .224, mae: .178, status: '已评价', parameters: 'n_estimators=300, max_depth=6', scope: '25–250 ℃，10–60 MPa；不适用于未见岩性', createdAt: '2026-09-19 14:30' }, { id: 'model-xgb-v2', name: '裂缝长度预测模型', version: 2, type: 'XGBoost', datasetId: 'data-shale-v3', testSet: '页岩固定测试集 T1（2,505 条）', r2: .932, rmse: .186, mae: .142, status: '已发布', parameters: 'n_estimators=500, max_depth=8', scope: '25–250 ℃，10–60 MPa；需满足非负裂缝长度物理约束', createdAt: stamp }, { id: 'model-pinn-v1', name: '岩石热力耦合 PINN', version: 1, type: 'PINN', datasetId: 'data-shale-v3', testSet: '页岩固定测试集 T1（2,505 条）', r2: .947, rmse: .164, mae: .126, status: '已评价', parameters: 'epochs=1000, lr=0.001', scope: '物理残差小于 0.01；仅适用于稳态边界', createdAt: stamp }], tools: initialTools,
});
  state.datasets.push({ id: 'data-bio-v1', name: '代谢通量与生长参数', version: 1, rows: 960, columns: 6, quality: 97.2, source: '合成生物实验中心', flow: ['原始实验数据'], createdAt: stamp, creator: '王研究员', usedBy: [] });
  state.tasks.splice(3, 0, task('SIM-20260920-007', '页岩 150℃ / 30MPa 工况对照', '已完成', 100, { parameters: defaultParameters.map(p => p.name === '温度' ? { ...p, value: '150' } : p.name === '围压' ? { ...p, value: '30' } : p) }), task('SIM-20260920-005', '页岩 200℃ / 45MPa 工况对照', '已完成', 100, { parameters: defaultParameters.map(p => p.name === '温度' ? { ...p, value: '200' } : p.name === '围压' ? { ...p, value: '45' } : p) }));
  state.tasks = state.tasks.map(t => {
    const scenario = scenarioFor({ name: t.name, type: t.type, toolId: t.toolId });
    const patch = scenarioPlan(t.name);
    const plan: ComputePlan = { ...structuredClone(initialPlan), ...patch, id: `PLAN-${t.id}`, title: t.name, goal: `研究并验证：${t.name}`, project: t.project, parameters: patch.parameters || t.parameters, toolId: t.toolId, status: '已创建任务' };
    state.plans.push(plan);
    return { ...t, planId: plan.id, planSnapshot: structuredClone(plan), parameters: structuredClone(plan.parameters), datasetId: plan.datasetId, modelId: plan.modelId, conclusion: scenario.conclusion };
  });
  return state;
}



