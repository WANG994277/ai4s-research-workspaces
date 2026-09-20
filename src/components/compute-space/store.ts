'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initialPlan, makeSeed } from './seed';
import { scenarioFor, scenarioPlan } from './scenarios';
import type { ComputePlan, ComputeState, ComputeTask, Dataset, ResearchModel, ScientificTool, Handoff } from './types';

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const now = () => new Date().toLocaleString('sv-SE');
const memoryStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
export interface ComputeActions {
  createPlan: (goal: string, patch?: Partial<ComputePlan>) => string;
  updatePlan: (id: string, patch: Partial<ComputePlan>) => void;
  newPlanVersion: (id: string) => string;
  createTask: (planId: string) => string;
  updateTask: (id: string, patch: Partial<ComputeTask>) => void;
  advanceTask: (id: string) => void;
  cloneTask: (id: string) => string;
  retryTask: (id: string) => void;
  addDataset: (data: Omit<Dataset, 'id'>) => string;
  addModel: (model: Omit<ResearchModel, 'id'>) => string;
  updateModel: (id: string, patch: Partial<ResearchModel>) => void;
  addTool: (tool: Omit<ScientificTool, 'id'>) => string;
  updateTool: (id: string, patch: Partial<ScientificTool>) => void;
  addHandoff: (handoff: Omit<Handoff, 'id' | 'createdAt'>) => string;
  updateHandoff: (id: string, patch: Partial<Handoff>) => void;
  addReference: (value: string) => void;
  removeReference: (value: string) => void;
  addAsset: (name: string) => void;
  reset: () => void;
}
export const useComputeStore = create<ComputeState & ComputeActions>()(persist((set, get) => ({
  ...makeSeed(),
  createPlan: (goal, patch = {}) => { const id = uid('PLAN'); const plan = { ...structuredClone(initialPlan), ...scenarioPlan(goal), ...patch, id, goal, title: patch.title || goal.slice(0, 32), status: '草稿' as const, createdAt: now() }; set(s => ({ plans: [plan, ...s.plans], activePlanId: id })); return id; },
  updatePlan: (id, patch) => set(s => ({ plans: s.plans.map(p => p.id === id ? { ...p, ...patch, id } : p) })),
  newPlanVersion: id => { const p = get().plans.find(p => p.id === id); if (!p) return ''; return get().createPlan(p.goal, { ...p, version: p.version + 1 }); },
  createTask: planId => {
    const s = get(); const p = s.plans.find(p => p.id === planId); if (!p || p.status !== '已确认') return '';
    const tool = s.tools.find(t => t.id === p.toolId); if (!tool || tool.status !== '已上架' || /过期|不可用/.test(tool.license) || !s.datasets.some(d => d.id === p.datasetId)) return '';
    const id = uid('SIM'); const confirmation = `${now()} · 张博士确认方法、参数、资源与许可证（方案 V${p.version}）`;
    const task: ComputeTask = { id, projectId: p.projectId, planId, planSnapshot: structuredClone(p), name: p.title, type: p.method, project: p.project, toolId: p.toolId, toolVersion: tool.version, datasetId: p.datasetId, modelId: p.modelId, parameters: structuredClone(p.parameters), resources: p.resources, environment: tool.environment, queue: '科研仿真队列', status: '排队中', progress: 0, createdAt: now(), duration: '尚未开始', creator: '张博士', resultCount: 0, version: 1, confirmations: [confirmation], logs: [`${now()} [INFO] 人工确认通过，创建任务`, `${now()} [INFO] 等待科研仿真队列资源`], conclusion: scenarioFor(p).conclusion, review: '待人工分析' };
    set(s => ({ tasks: [task, ...s.tasks], plans: s.plans.map(p => p.id === planId ? { ...p, status: '已创建任务' } : p), datasets: s.datasets.map(d => d.id === p.datasetId ? { ...d, usedBy: [...d.usedBy, id] } : d) })); return id;
  },
  updateTask: (id, patch) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch, id } : t) })),
  advanceTask: id => { const t = get().tasks.find(t => t.id === id); if (!t) return; let status = t.status; let progress = t.progress;
    if (['草稿','待确认'].includes(status)) return;
    if (status === '待提交') status = '排队中';
    else if (status === '排队中') { status = '运行中'; progress = 12; }
    else if (status === '运行中') { progress = Math.min(100, progress + 22); if (progress === 100) status = '结果生成中'; }
    else if (status === '结果生成中') status = '已完成'; else return;
    get().updateTask(id, { status, progress, duration: '演示运行 2 分钟', resultCount: status === '已完成' ? 7 : 0, logs: [...t.logs, `${now()} [INFO] ${status} · ${progress}%${status === '已完成' ? '，结果包与分析报告已生成' : ''}`] });
  },
  cloneTask: id => { const t = get().tasks.find(t => t.id === id); if (!t) return ''; const nextId = uid('SIM'); const clone: ComputeTask = { ...structuredClone(t), id: nextId, name: `${t.name} · 副本`, parentId: id, status: '草稿', progress: 0, resultCount: 0, createdAt: now(), duration: '尚未开始', error: undefined, confirmations: [], logs: [`${now()} [INFO] 从 ${id} 克隆，等待人工确认`], version: t.version + 1 }; set(s => ({ tasks: [clone, ...s.tasks] })); return nextId; },
  retryTask: id => { const t = get().tasks.find(t => t.id === id); if (!t || !['失败','资源不足','等待人工处理','取消'].includes(t.status)) return; const tool = get().tools.find(v => v.id === t.toolId); if (!tool || tool.status !== '已上架' || /过期|不可用/.test(tool.license)) return; get().updateTask(id, { status: '排队中', progress: 0, error: undefined, resultCount: 0, confirmations: [...t.confirmations, `${now()} · 张博士确认修改后重试`], logs: [...t.logs, `${now()} [INFO] 人工确认重新提交，保留失败记录`] }); },
  addDataset: data => { const id = uid('DATA'); set(s => ({ datasets: [{ ...data, id }, ...s.datasets] })); return id; },
  addModel: data => { const id = uid('MODEL'); set(s => ({ models: [{ ...data, id }, ...s.models] })); return id; },
  updateModel: (id, patch) => set(s => ({ models: s.models.map(m => m.id === id ? { ...m, ...patch, id } : m) })),
  addTool: data => { const id = uid('TOOL'); set(s => ({ tools: [{ ...data, id }, ...s.tools] })); return id; },
  updateTool: (id, patch) => set(s => ({ tools: s.tools.map(t => t.id === id ? { ...t, ...patch, id } : t) })),
  addHandoff: data => { const id = uid('HANDOFF'); set(s => ({ handoffs: [{ ...data, id, createdAt: now() }, ...s.handoffs] })); return id; },
  updateHandoff: (id, patch) => set(s => ({ handoffs: s.handoffs.map(h => h.id === id ? { ...h, ...patch, id } : h) })),
  addReference: value => set(s => ({ references: [...new Set([...s.references, value])] })),
  removeReference: value => set(s => ({ references: s.references.filter(r => r !== value) })),
  addAsset: name => set(s => ({ assets: [...new Set([...s.assets, name])] })),
  reset: () => set(makeSeed()),
}), { name: 'ai4s-compute-space-v1', version: 1, skipHydration: true, storage: createJSONStorage(() => typeof window === 'undefined' ? memoryStorage : localStorage), merge: (persisted, current) => {
  const data = persisted as Partial<ComputeState>;
  const plans = data.plans || current.plans;
  return { ...current, ...data, tasks: (data.tasks || current.tasks).map(task => {
    if (task.planSnapshot) return task;
    const recovered = plans.find(plan => plan.id === task.planId);
    return recovered ? { ...task, planSnapshot: structuredClone(recovered), confirmations: [...task.confirmations, '历史演示记录迁移：依据已保存方案补充快照，原始版本需人工核对。'] } : task;
  }) };
} }));



