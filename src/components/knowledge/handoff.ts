'use client';

import { useReadStore, type ReadState } from '@/components/read-space/store';
import type { Artifact, Evidence as ReadEvidence, ResearchTask, Resource } from '@/components/read-space/types';
import { makeId, type Evidence, type KnowledgeBase } from './model';

export interface KnowledgeResearchTaskInput {
  knowledgeBase: KnowledgeBase;
  title: string;
  evidence: Evidence[];
  projectId: string;
}

const collections = ['tasks', 'readingIds', 'artifacts', 'evidence', 'notes', 'resources', 'drafts'] as const;

function knowledgeSourceUrl(evidence: Evidence) {
  const search = new URLSearchParams({ version: evidence.version, section: evidence.sectionId });
  if (evidence.documentId.startsWith('entry:')) {
    search.set('entry', evidence.documentId.slice(6));
    return `/knowledge/${encodeURIComponent(evidence.knowledgeBaseId)}/entries?${search}`;
  }
  return `/knowledge/${encodeURIComponent(evidence.knowledgeBaseId)}/documents/${encodeURIComponent(evidence.documentId)}?${search}`;
}

/** A source-preserving handoff package; no findings or confirmations are inferred. */
export function buildKnowledgeResearchTaskBundle({ knowledgeBase, title, evidence, projectId }: KnowledgeResearchTaskInput) {
  const taskTitle = title.trim();
  const scopedProjectId = projectId.trim();
  if (!knowledgeBase.canRead) throw new Error('当前没有读取此知识库的权限。');
  if (!taskTitle) throw new Error('请填写研究任务名称。');
  if (!scopedProjectId) throw new Error('请选择研究任务所属课题。');
  if (!evidence.length) throw new Error('请选择至少一条知识库证据。');

  const unique = new Map<string, Evidence>();
  for (const item of evidence) {
    if (item.knowledgeBaseId !== knowledgeBase.id) throw new Error('所选证据必须全部来自当前知识库。');
    if (!item.documentId || !item.version || !item.sectionId || !item.quote.trim()
      || !Number.isInteger(item.page) || item.page < 1 || !Number.isInteger(item.paragraph) || item.paragraph < 1) {
      throw new Error('所选证据缺少文档、版本、段落或原文，请重新选择完整依据。');
    }
    const key = JSON.stringify([item.documentId, item.version, item.sectionId, item.page, item.paragraph, item.pageKind ?? '', item.quote]);
    if (!unique.has(key)) unique.set(key, { ...item });
  }

  const sourceEvidence = [...unique.values()];
  const stamp = new Date().toISOString();
  const taskId = makeId('TASK');
  const resourceId = makeId('KBRESOURCE');
  const artifactId = makeId('ART');
  const resource: Resource & { taskId: string; sourceUrl: string } = {
    id: resourceId, taskId, projectId: scopedProjectId, name: knowledgeBase.name, kind: '知识库',
    status: '已关联摘录 · 待核验', sourceUrl: `/knowledge/${encodeURIComponent(knowledgeBase.id)}/documents`,
  };
  const linkedEvidence: (ReadEvidence & { sourceUrl: string; knowledgeSource: Evidence })[] = sourceEvidence.map(item => ({
    id: makeId('EVD'), projectId: scopedProjectId, taskId, sourceId: item.documentId,
    source: `${item.documentTitle}（${item.version}）· 知识库摘录`,
    location: `${item.section} · ${item.version} · ${item.pageKind === 'logical' ? '逻辑页' : item.pageKind === 'original' ? '原文页' : '页码'} ${item.page} / 段 ${item.paragraph}`,
    page: item.page, excerpt: item.quote, confirmed: false, acquiredAt: stamp,
    // The read-space enum has no knowledge-excerpt value; full-source access is not asserted.
    access: '仅摘要', sourceUrl: knowledgeSourceUrl(item), knowledgeSource: item,
  }));
  const artifact: Artifact = {
    id: artifactId, projectId: scopedProjectId, taskId, type: '知识库证据包', title: `${taskTitle} · 知识库证据包`,
    content: [
      `# ${taskTitle} · 知识库证据包`,
      `来源知识库：${knowledgeBase.name}（${knowledgeBase.id}）`,
      '以下内容为用户选定的已保存摘录，来源和适用性仍待人工核验；本证据包不生成新的科研结论。',
      ...sourceEvidence.map((item, index) => [
        `## ${index + 1}. ${item.documentTitle}`,
        `文档标识：${item.documentId}\n来源版本：${item.version}\n章节：${item.section}（${item.sectionId}）`,
        `${item.pageKind === 'logical' ? '逻辑页' : item.pageKind === 'original' ? '原文页' : '页码'}：${item.page}\n段落：${item.paragraph}\n页码类型：${item.pageKind ?? '未标注，需核验'}`,
        `引用标识：${item.id}`,
        `引用原文：\n${item.quote}`,
        `回看知识库：[打开原版本和段落](${knowledgeSourceUrl(item)})`,
      ].join('\n\n')),
    ].join('\n\n'),
    evidenceIds: linkedEvidence.map(item => item.id), version: 1, mode: '人工', confirmed: false, updatedAt: stamp,
  };
  const task: ResearchTask = {
    id: taskId, title: taskTitle, goal: taskTitle, type: '科研思路探索', projectId: scopedProjectId,
    status: '规划中', mode: '人工',
    plan: ['核验引用文献的版本与段落', '明确研究问题与适用条件', '补充证据并制定研究方案'].map((step, index) => ({ id: `${taskId}-step-${index + 1}`, title: step, done: false })),
    resourceIds: [resource.id], artifactIds: [artifact.id],
    stream: [
      { id: makeId('EVENT'), kind: '用户指令', text: taskTitle, time: stamp },
      { id: makeId('EVENT'), kind: '执行节点', text: `已从“${knowledgeBase.name}”接收 ${linkedEvidence.length} 条知识库摘录，已保留来源版本与段落定位，等待人工核验。`, time: stamp },
    ],
    confirmations: [], focus: [], hypothesis: '', createdAt: stamp, updatedAt: stamp,
  };
  return { task, resource, evidence: linkedEvidence, artifact };
}

function validateStoredState(raw: string | null) {
  if (raw === null) return;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('读空间缓存格式不正确。');
  const record = parsed as { version?: unknown; state?: unknown };
  if (record.version !== 1 || !record.state || typeof record.state !== 'object') throw new Error('读空间缓存版本不兼容。');
  const state = record.state as Record<string, unknown>;
  if (!collections.every(key => Array.isArray(state[key]))) throw new Error('读空间缓存缺少必要数据。');
}

let handoffQueue: Promise<void> = Promise.resolve();

export async function createKnowledgeResearchTask(input: KnowledgeResearchTaskInput): Promise<string> {
  const bundle = buildKnowledgeResearchTaskBundle(input);
  const save = handoffQueue.then(async () => {
    if (typeof localStorage === 'undefined') throw new Error('当前环境无法保存读空间任务，请在浏览器中重试。');
    const persist = useReadStore.persist;
    if (!persist) throw new Error('读空间的本地存储不可用，请恢复浏览器存储权限后重试。');
    const storageName = persist.getOptions().name;
    if (!storageName) throw new Error('读空间尚未配置本地存储，任务未创建。');
    try {
      validateStoredState(localStorage.getItem(storageName));
      await persist.rehydrate();
      if (!persist.hasHydrated()) throw new Error('读空间数据未能完整读取。');
    } catch (cause) {
      throw new Error(`${cause instanceof Error ? cause.message : '无法读取读空间数据。'} 原有资料未覆盖，任务尚未创建。`);
    }

    const current = useReadStore.getState();
    const nextState: ReadState = {
      ...current,
      tasks: [bundle.task, ...current.tasks], activeTaskId: bundle.task.id,
      resources: [...current.resources, bundle.resource],
      evidence: [...bundle.evidence, ...current.evidence],
      artifacts: [bundle.artifact, ...current.artifacts],
    };
    // Zustand setters update memory before storage. Write the complete persisted envelope first.
    try {
      localStorage.setItem(storageName, JSON.stringify({ state: nextState, version: 1 }));
    } catch {
      throw new Error('研究任务未保存，可能是浏览器存储空间不足。原有任务和本次草稿均已保留，请重试。');
    }
    await persist.rehydrate();
    if (!persist.hasHydrated() || !useReadStore.getState().tasks.some(task => task.id === bundle.task.id)) {
      throw new Error(`研究任务 ${bundle.task.id} 已保存，但读空间尚未载入。请刷新页面后查看，避免重复创建。`);
    }
    return bundle.task.id;
  });
  handoffQueue = save.then(() => undefined, () => undefined);
  return save;
}
