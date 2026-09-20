'use client';
import { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useReadTask, ReadBadge } from './ui';
import type { Resource } from './types';
import { toast } from 'sonner';

export const RESOURCE_SEEDS: Omit<Resource, 'projectId'>[] = [
  { id: 'demo-lit-1', name: '高温高压条件下页岩裂缝扩展的真三轴实验研究', kind: '文献', status: '可研读' },
  { id: 'demo-lit-2', name: '深层页岩热–力耦合破坏机制与参数敏感性', kind: '文献', status: '可研读' },
  { id: 'demo-lit-3', name: '层理方向对页岩裂缝扩展路径的影响', kind: '文献', status: '可研读' },
  { id: 'demo-std-1', name: '岩石力学试验方法（标准示例）', kind: '标准', status: '待确认' },
  { id: 'demo-patent-1', name: '高温高压岩石试验装置（专利示例）', kind: '专利', status: '待核验' },
  { id: 'demo-kb-1', name: '深层储层科研知识库', kind: '知识库', status: '已关联' },
  { id: 'demo-note-1', name: '温压耦合机制研究笔记', kind: '研究笔记', status: '人工笔记' },
  { id: 'demo-report-1', name: '深层页岩技术调研阶段报告', kind: '已有报告', status: '草稿' },
  { id: 'demo-compute-1', name: '热力耦合敏感性分析结果', kind: '计算结果', status: '模拟结果' },
];
export function ResourcePicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (ids: string[]) => void }) {
  const { project, resources, addResource } = useReadTask();
  const [kind, setKind] = useState('全部'); const [selected, setSelected] = useState<string[]>([]); const [query, setQuery] = useState('');
  const data = [...RESOURCE_SEEDS.map(r => ({ ...r, projectId: project.id })), ...resources.filter(r => r.projectId === project.id && !RESOURCE_SEEDS.some(s => s.id === r.id))];
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-h-[85vh] overflow-auto bg-white sm:max-w-2xl"><DialogHeader><DialogTitle>引用科研资料</DialogTitle><DialogDescription>选择资料加入当前研究上下文，来源与确认状态随任务保存。</DialogDescription></DialogHeader><div className="flex flex-wrap gap-3"><select aria-label="资料类型" className="research-input w-36" value={kind} onChange={e => setKind(e.target.value)}>{['全部', '文献', '标准', '专利', '知识库', '研究笔记', '已有报告', '计算结果', '文件'].map(k => <option key={k}>{k}</option>)}</select><input aria-label="搜索引用资料" className="research-input flex-1" placeholder="搜索资料名称" value={query} onChange={e => setQuery(e.target.value)}/></div><div className="divide-y divide-slate-100">{data.filter(r => (kind === '全部' || r.kind === kind) && r.name.toLowerCase().includes(query.toLowerCase())).map(r => <label key={r.id} className="flex cursor-pointer items-center gap-3 py-3 text-sm"><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(s => e.target.checked ? [...s, r.id] : s.filter(id => id !== r.id))}/><FileText size={16} className="shrink-0 text-primary"/><span className="flex-1">{r.name}<small className="block text-xs text-muted-foreground">{r.kind} · {r.status}</small></span><ReadBadge>示例资料</ReadBadge></label>)}</div><button className="research-primary justify-center" disabled={!selected.length} onClick={() => { data.filter(r => selected.includes(r.id)).forEach(addResource); onSelect(selected); setSelected([]); onClose(); }}>引用所选 {selected.length} 项</button></DialogContent></Dialog>;
}

export function ResourceList({ ids, onRemove, onAdd }: { ids: string[]; onRemove?: (id: string) => void; onAdd?: () => void }) {
  const { resources, project } = useReadTask();
  return <div className="space-y-2">{ids.map(id => { const resource = resources.find(r => r.id === id && r.projectId === project.id) || RESOURCE_SEEDS.find(r => r.id === id); return <div key={id} className="flex items-center gap-2 rounded bg-slate-50 p-2 text-xs"><FileText size={13} className="shrink-0 text-primary"/><span className="min-w-0 flex-1 truncate" title={resource?.name || id}>{resource?.name || id}</span>{onRemove && <button aria-label={`移除${resource?.name || id}`} onClick={() => onRemove(id)}><X size={12}/></button>}</div>; })}{onAdd && <button className="rs-link-btn mt-2" onClick={onAdd}><Plus size={13}/>添加研究资料</button>}</div>;
}

export async function uploadResource(file: File, projectId: string): Promise<Resource> {
  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (file.size > 30 * 1024 * 1024) throw new Error('单个文件请不超过 30 MB');
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('ai4s-read-files', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  await new Promise<void>((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  return { id, name: file.name, kind: /pdf|word|document/.test(file.type) ? '文献' : '文件', status: '已上传 · 可模拟解析', projectId, mime: file.type, size: file.size };
}
export async function getUploadedFile(id: string): Promise<Blob | undefined> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open('ai4s-read-files', 1); req.onupgradeneeded = () => req.result.createObjectStore('files'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  const file = await new Promise<Blob | undefined>((resolve, reject) => { const req = db.transaction('files').objectStore('files').get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); db.close(); return file;
}
export function reportUploadError(error: unknown) { toast.error(error instanceof Error ? error.message : '本地文件保存失败，请重试'); }
