'use client';
import { type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, FolderOpen, Quote } from 'lucide-react';
import { useResearchProject } from '@/components/research/workspace-kit';
import { useReadStore } from './store';
import { READ_ROUTES, type Evidence } from './types';

export function useReadTask() {
  const params = useSearchParams();
  const { project, href } = useResearchProject();
  const store = useReadStore();
  const id = params.get('task') || store.activeTaskId;
  const task = store.tasks.find(t => t.id === id && t.projectId === project.id);
  return { ...store, task, project, href };
}
export function ReadPage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  const { href } = useResearchProject();
  return <div className="rs-page"><header className="rs-page-heading"><div><Link href={href(READ_ROUTES.home)} className="rs-back"><ArrowLeft size={13}/>读空间</Link><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="rs-actions">{actions}</div></header>{children}</div>;
}
export function ReadPanel({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) { return <section className={`rs-panel ${className}`}>{(title || actions) && <header className="rs-panel-heading"><h2>{title}</h2><div className="rs-actions">{actions}</div></header>}<div className="rs-panel-body">{children}</div></section>; }
export function ReadBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) { return <span className={`rs-badge rs-badge-${tone}`}>{children}</span>; }
export function ReadTabs({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) { return <div role="tablist" className="rs-tabs">{items.map(item => <button role="tab" aria-selected={item === value} className={item === value ? 'active' : ''} key={item} onClick={() => onChange(item)}>{item}</button>)}</div>; }
export function EvidenceLink({ evidence }: { evidence: Evidence }) { return <Link className="rs-evidence-link" href={`${READ_ROUTES.reader}?doc=${encodeURIComponent(evidence.sourceId)}&page=${evidence.page}&task=${encodeURIComponent(evidence.taskId)}&projectId=${encodeURIComponent(evidence.projectId)}`}><Quote size={12}/>{evidence.location}<span className="sr-only">，{evidence.source}</span></Link>; }
export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) { return <div className="rs-empty"><FolderOpen size={32} strokeWidth={1.2}/><h3>{title}</h3>{description && <p>{description}</p>}<div className="rs-actions">{children}</div></div>; }
export function downloadText(name: string, text: string, mime = 'text/markdown;charset=utf-8') { const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function ResourceIcon() { return <FileText className="size-4 shrink-0 text-primary"/>; }
export function formatDate(date: string) { return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
