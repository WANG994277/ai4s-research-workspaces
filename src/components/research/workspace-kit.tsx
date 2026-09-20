'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSidebar } from '@/components/layout/sidebar-context';
import { contextHref } from '@/lib/capabilities';
import { projects } from '@/mock/research';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function useResearchProject() {
  const { projectId, setProjectId } = useSidebar();
  const params = useSearchParams();
  const queryProject = params.get('projectId');
  useEffect(() => {
    if (queryProject && projects.some((p) => p.id === queryProject))
      setProjectId(queryProject);
  }, [queryProject, setProjectId]);
  const project =
    projects.find((p) => p.id === (queryProject || projectId)) ?? projects[0];
  return {
    project,
    href: (path: string, source?: string) =>
      contextHref(path, project.id, source),
  };
}

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      /* Invalid local demo data falls back to the supplied initial state. */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Storage can be unavailable in a private browser. */
      }
  }, [key, value, ready]);
  return [value, setValue] as const;
}

export function WorkspaceHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </header>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <nav
      aria-label="工作区视图"
      className="flex flex-wrap gap-x-6 border-b border-line"
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-current={value === t ? 'page' : undefined}
          className={`min-h-11 border-b-2 px-1 text-sm ${value === t ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-white p-5">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-blue/20 bg-blue/5 px-4 py-3 text-sm leading-6"
    >
      {children}
    </p>
  );
}
export function Status({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
export function Empty({
  message = '没有匹配记录，请调整筛选或新建记录。',
}: {
  message?: string;
}) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">{message}</p>
  );
}
export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? '所有操作保存在本机原型中，用于演示业务过程。'}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
export function NextActions({ sourceId }: { sourceId?: string }) {
  const { href } = useResearchProject();
  return (
    <div className="flex flex-wrap gap-2">
      {[
        ['继续研读', '/literature-search'],
        ['创建计算任务', '/compute-tasks'],
        ['实验方案', '/experiment-design'],
        ['撰写报告', '/research-writing'],
        ['科研资产', '/assets/data-knowledge'],
      ].map(([label, path]) => (
        <Link
          className="research-button"
          key={path}
          href={href(path, sourceId)}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
export function downloadText(
  name: string,
  content: string,
  type = 'text/plain;charset=utf-8',
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
