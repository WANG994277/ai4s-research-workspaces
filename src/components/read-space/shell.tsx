'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, Network, NotebookPen, FolderOpen } from 'lucide-react';
import { Toaster } from 'sonner';
import { useReadStore } from './store';
import { useResearchProject } from '@/components/research/workspace-kit';
import { READ_ROUTES } from './types';
import { ReadBadge } from './ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import './read-space.css';
import { ReadRequirementTools } from './prd';

export function ReadShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false); const [notesOpen, setNotesOpen] = useState(false);
  const { project, href } = useResearchProject(); const params = useSearchParams(); const pathname = usePathname();
  const state = useReadStore();
  const { tasks, setActiveTask } = state;
  useEffect(() => { let mounted = true; Promise.resolve(useReadStore.persist.rehydrate()).finally(() => { if (mounted) setReady(true); }); return () => { mounted = false; }; }, []);
  const queryTaskId = params.get('task');
  useEffect(() => { if (ready && queryTaskId && tasks.some(t => t.id === queryTaskId && t.projectId === project.id)) setActiveTask(queryTaskId); }, [ready, queryTaskId, project.id, tasks, setActiveTask]);
  const task = state.tasks.find(t => t.id === (queryTaskId || state.activeTaskId) && t.projectId === project.id);
  const notes = state.notes.filter(n => n.projectId === project.id && (!task || n.taskId === task.id));
  const graphHref = `${href(READ_ROUTES.graph)}${task ? `&task=${task.id}` : ''}`;
  return <div className="read-space"><nav className="mb-4 flex gap-5 border-b border-slate-200 pb-3 text-sm min-[701px]:hidden" aria-label="读空间移动导航"><Link href={href(READ_ROUTES.home)}>开始研究</Link><Link href={href(READ_ROUTES.search)}>文献检索</Link><Link href={href(READ_ROUTES.tasks)}>研究任务</Link></nav><div className="rs-context"><BookOpen size={14} className="text-primary"/><strong>{project.name}</strong><span className="hidden lg:inline">{task ? `${task.resourceIds.length} 项研究资料 · ${task.artifactIds.length} 个研究产物` : '从科研问题出发，沉淀可追溯的研究成果'}</span><div className="rs-context-actions"><ReadBadge>模拟体验</ReadBadge>{pathname !== READ_ROUTES.graph && <Link href={graphHref} className="inline-flex items-center gap-1"><Network size={13}/>知识关系</Link>}<button onClick={() => setNotesOpen(true)} className="inline-flex items-center gap-1"><NotebookPen size={13}/>研究笔记 {notes.length || ''}</button><Link href={href(READ_ROUTES.tasks)} className="inline-flex items-center gap-1"><FolderOpen size={13}/>任务中心</Link></div></div>{ready ? <>{children}<ReadRequirementTools/></> : <div className="rs-empty" role="status">正在恢复研究上下文…</div>}<Dialog open={notesOpen} onOpenChange={setNotesOpen}><DialogContent className="max-h-[85vh] overflow-auto bg-white sm:max-w-2xl"><DialogHeader><DialogTitle>研究笔记</DialogTitle><DialogDescription>当前课题中的人工判断和 AI 笔记分别保存。</DialogDescription></DialogHeader>{notes.length ? notes.map(n => <article key={n.id} className="rounded-lg border p-4"><ReadBadge tone={n.author === '人工' ? 'green' : 'purple'}>{n.author}笔记</ReadBadge>{n.author === '人工' ? <textarea aria-label="编辑人工笔记" value={n.text} className="research-input mt-3 min-h-24" onChange={e => state.updateNote(n.id, e.target.value)}/> : <p className="mt-3 whitespace-pre-wrap text-sm">{n.text}</p>}<small className="text-muted-foreground">来源：{n.sourceId || '研究任务'} · {n.evidenceIds.length} 条证据</small></article>) : <p className="py-10 text-center text-sm text-muted-foreground">还没有研究笔记，可在文献研读时记录科研判断。</p>}<button className="research-button" onClick={() => { state.addNote({ projectId: project.id, taskId: task?.id || '', sourceId: '', text: '记录我的科研判断…', author: '人工', evidenceIds: [] }); }}>新增人工笔记</button></DialogContent></Dialog><Toaster richColors position="bottom-right" closeButton/></div>;
}
