'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PLAN, type Artifact, type Evidence, type HandoffDraft, type ResearchNote, type ResearchTask, type Resource, type TaskType } from './types';

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();
type ArtifactInput = Omit<Artifact, 'id' | 'version' | 'updatedAt'>;
type EvidenceInput = Omit<Evidence, 'id' | 'acquiredAt'>;
export type ReadState = {
  tasks: ResearchTask[]; activeTaskId: string; readingIds: string[]; artifacts: Artifact[]; evidence: Evidence[]; notes: ResearchNote[]; resources: Resource[]; drafts: HandoffDraft[];
  createTask: (title: string, type: TaskType, projectId: string, resourceIds?: string[], mode?: string) => string;
  setActiveTask: (id: string) => void; updateTask: (id: string, patch: Partial<ResearchTask>) => void;
  addResources: (ids: string[], taskId?: string) => void; setReadingIds: (ids: string[]) => void; addResource: (resource: Resource) => void;
  addArtifact: (artifact: ArtifactInput) => string; updateArtifact: (id: string, patch: Partial<Artifact>) => void;
  addEvidence: (evidence: EvidenceInput) => string; updateEvidence: (id: string, patch: Partial<Evidence>) => void;
  addNote: (note: Omit<ResearchNote, 'id' | 'updatedAt'>) => string; updateNote: (id: string, text: string) => void;
  createDraft: (draft: Omit<HandoffDraft, 'id' | 'createdAt' | 'confirmed'>) => string; updateDraft: (id: string, patch: Partial<HandoffDraft>) => void;
};
export const useReadStore = create<ReadState>()(persist((set, get) => ({
  tasks: [], activeTaskId: '', readingIds: [], artifacts: [], evidence: [], notes: [], resources: [], drafts: [],
  createTask: (title, type, projectId, resourceIds = [], mode = '自动') => { const id = uid('TASK'); const stamp = now(); const task: ResearchTask = { id, title, goal: title, type, projectId, status: '规划中', mode, plan: DEFAULT_PLAN.map((title, index) => ({ id: `${id}-step-${index}`, title, done: false })), resourceIds: [...new Set(resourceIds)], artifactIds: [], stream: [{ id: uid('EVENT'), kind: '用户指令', text: title, time: stamp }], confirmations: [], updatedAt: stamp, createdAt: stamp, focus: [], hypothesis: '' }; set(s => ({ tasks: [task, ...s.tasks], activeTaskId: id })); return id; },
  setActiveTask: activeTaskId => set({ activeTaskId }),
  updateTask: (id, patch) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch, id: t.id, projectId: t.projectId, updatedAt: now() } : t) })),
  addResources: (ids, taskId) => { const id = taskId || get().activeTaskId; set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, resourceIds: [...new Set([...t.resourceIds, ...ids])], updatedAt: now() } : t) })); },
  setReadingIds: readingIds => set({ readingIds: [...new Set(readingIds)] }),
  addResource: resource => set(s => ({ resources: [...s.resources.filter(r => r.id !== resource.id || r.projectId !== resource.projectId), resource] })),
  addArtifact: input => { const id = uid('ART'); set(s => ({ artifacts: [{ ...input, id, version: 1, updatedAt: now() }, ...s.artifacts], tasks: s.tasks.map(t => t.id === input.taskId ? { ...t, artifactIds: [...t.artifactIds, id], updatedAt: now() } : t) })); return id; },
  updateArtifact: (id, patch) => set(s => ({ artifacts: s.artifacts.map(a => a.id === id ? { ...a, ...patch, id: a.id, projectId: a.projectId, version: a.version + 1, updatedAt: now() } : a) })),
  addEvidence: input => { const existing = get().evidence.find(e => e.taskId === input.taskId && e.sourceId === input.sourceId && e.location === input.location && e.excerpt === input.excerpt); if (existing) return existing.id; const id = uid('EVD'); set(s => ({ evidence: [{ ...input, id, acquiredAt: now() }, ...s.evidence] })); return id; },
  updateEvidence: (id, patch) => set(s => ({ evidence: s.evidence.map(e => e.id === id ? { ...e, ...patch, id: e.id, projectId: e.projectId, taskId: e.taskId } : e) })),
  addNote: input => { const id = uid('NOTE'); set(s => ({ notes: [{ ...input, id, updatedAt: now() }, ...s.notes] })); return id; },
  updateNote: (id, text) => set(s => ({ notes: s.notes.map(n => n.id === id && n.author === '人工' ? { ...n, text, updatedAt: now() } : n) })),
  createDraft: input => { const id = uid('DRAFT'); set(s => ({ drafts: [{ ...input, id, confirmed: false, createdAt: now() }, ...s.drafts] })); return id; },
  updateDraft: (id, patch) => set(s => ({ drafts: s.drafts.map(d => d.id === id ? { ...d, ...patch, id: d.id, projectId: d.projectId } : d) })),
}), { name: 'ai4s-read-space-v1', version: 1, skipHydration: true }));
