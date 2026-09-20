import type { Artifact, Evidence, ResearchTask } from './types';
import { findLiterature } from './literature';
export const ARTIFACT_TABS = ['问题树', '证据', '研究空白', '科学假设', '研究路线'];
export function artifactContent(task: ResearchTask, type: string): string {
  const scope = task.focus.length ? task.focus.join('、') : '研究对象、作用机制、实验方法、关键参数与适用边界';
  const contents: Record<string,string> = {
    '问题树': `核心问题：${task.goal}\n\n1. 研究对象与科学问题如何界定？\n2. 已有实验与计算方法支持哪些结论？\n3. 关键参数如何影响观测结果？\n4. 不同文献的观点为何存在差异？\n5. 哪些证据缺口值得继续验证？\n\n当前研究重点：${scope}`,
    '证据': `科学问题 | 支持证据 | 反向证据 | 证据状态\n关键参数的影响机制 | 研究资料 A · P3 | 研究资料 B · P4 | 存在争议\n实验条件与方法差异 | 研究资料 A · Table 2 | 尚未检出 | 证据有限\n模型适用性边界 | 研究资料 C · P5 | 需补充检索 | 需进一步验证\n\n说明：以上为模拟资料构建的证据矩阵，不代表穷尽性检索结果。`,
    '研究空白': `候选研究空白：多因素耦合作用下的机制与验证\n\n研究主题：${task.goal}\n现有研究：示例资料多讨论单一因素或有限实验条件。\n缺失证据：联合条件下的实验与计算交叉验证不足。\n现有争议：参数影响与方法差异的贡献尚未分离。\n潜在价值：通过对照研究检验适用边界。\n下一步：补充检索，寻找反向证据，再进行科学假设确认。`,
    '科学假设': task.hypothesis || `候选 H1：在「${task.goal}」中，关键因素的耦合作用可能改变观测结果与机理；该效应可通过控制变量实验与参数敏感性分析检验。\n\n可证伪条件：控制混杂因素后未观察到预期变化，或反向证据更充分。\n状态：候选假设，需科研人员确认后开展验证。`,
    '研究路线': `1. 文献证据分析 · 读空间\n输入：文献与证据矩阵；输出：待验证问题。\n\n2. 确认候选科学假设 · 读空间\n输入：支持/反向证据；输出：经人工确认的假设。\n\n3. 数值模拟与敏感性分析 · 算空间\n输入：模型、单位、参数与约束；输出：计算结果。\n\n4. 对照实验验证 · 做空间\n输入：实验条件、标准条款；输出：实验记录。\n\n5. 比较结果并修正模型\n输入：计算与实验结果；输出：科研报告。`,
  };
  return contents[type] || `${type}\n${task.goal}`;
}
export function stageArtifact(title: string): string | undefined {
  if (/明确|问题/.test(title)) return '问题树';
  if (/证据分析|争议/.test(title)) return '证据';
  if (/空白/.test(title)) return '研究空白';
  if (/假设/.test(title)) return '科学假设';
  if (/路线/.test(title)) return '研究路线';
}
export function artifactInput(task: ResearchTask, type: string, evidenceIds: string[]): Omit<Artifact, 'id' | 'version' | 'updatedAt'> { return { projectId: task.projectId, taskId: task.id, type, title: `${task.title} · ${type}`, content: artifactContent(task,type), evidenceIds, confirmed:false, mode:'AI' }; }
export function evidenceInputs(task: ResearchTask): Omit<Evidence,'id'|'acquiredAt'>[] { return (task.resourceIds.filter(id => id.startsWith('demo-lit') || id.startsWith('upload')).length ? task.resourceIds.filter(id => id.startsWith('demo-lit') || id.startsWith('upload')) : ['demo-lit-1','demo-lit-2','demo-lit-3']).slice(0,3).map((id,i) => ({ projectId:task.projectId, taskId:task.id, sourceId:id, source:findLiterature(id)?.title || `研究资料 ${String.fromCharCode(65+i)}（模拟证据）`, page:[3,4,5][i], location:['P3 · 研究方法','P4 · Table 2','P5 · Figure 6'][i], excerpt:['示例研究表明，在控制实验条件后，温度变化与材料强度变化有关。','不同围压与加载方式会影响实验结果，可比性需要进一步核验。','多因素耦合条件下的机制尚存在解释差异，需要反向证据与实验验证。'][i], confirmed:false, access:'演示原文' as const })); }
