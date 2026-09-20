'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, FileText, ScanSearch, Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  PRD_SOURCE_URL, PRD_STORAGE_KEY, buildFullMarkdown, buildPageMarkdown,
  computePrdPages, computeRequirements, getRequirement, resolvePrdPage, validateRequirementEdits,
  type ComputeRequirement, type RequirementEdits,
} from './requirements';

const textFieldClass = 'min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm';

function downloadMarkdown(name: string, content: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function splitIds(value: string | null) {
  return (value ?? '').split(/[\s,]+/).map(id => id.trim()).filter(id => computeRequirements.some(item => item.id === id));
}

export function PrdInspector() {
  const pathname = usePathname();
  const page = resolvePrdPage(pathname);
  const [inspecting, setInspecting] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(page.requirementIds[0]);
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [linkedControls, setLinkedControls] = useState<string[]>([]);
  const [edits, setEdits] = useState<RequirementEdits>({});
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState('需求修订仅保存在本机，不改写源 PRD。');
  const [originalPrd, setOriginalPrd] = useState('');
  const [sourceStatus, setSourceStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const active = getRequirement(activeId, edits);
  const activePage = active ? computePrdPages.find(item => item.id === active.page) : page;
  const pageRequirements = useMemo(() => page.requirementIds.map(id => getRequirement(id, edits)).filter((item): item is ComputeRequirement => Boolean(item)), [page, edits]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PRD_STORAGE_KEY);
      if (stored) {
        setEdits(validateRequirementEdits(JSON.parse(stored)));
        setSaveStatus('已恢复本机保存的需求修订。');
      }
    } catch {
      setSaveStatus('无法读取本机修订，当前显示原始需求映射。');
    }
    setHydrated(true);
  }, []);

  const loadOriginal = useCallback(async (signal?: AbortSignal) => {
    setSourceStatus('loading');
    try {
      const response = await fetch(PRD_SOURCE_URL, { signal });
      if (!response.ok) throw new Error(`来源文件响应 ${response.status}`);
      const source = await response.text();
      if (!source.includes('# 33.') || !source.includes('算空间产品需求文档')) throw new Error('来源 PRD 不完整');
      setOriginalPrd(source);
      setSourceStatus('ready');
      return source;
    } catch (error) {
      if (!signal?.aborted) setSourceStatus('error');
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadOriginal(controller.signal).catch(() => { /* The toolbar exposes retry through export. */ });
    return () => controller.abort();
  }, [loadOriginal]);

  useEffect(() => {
    setOpen(false);
    setActiveId(page.requirementIds[0]);
    setLinkedIds([]);
    setExportStatus('');
  }, [pathname, page]);

  useEffect(() => {
    if (!inspecting) return;
    const roots = document.querySelectorAll<HTMLElement>('.compute-space');
    roots.forEach(root => root.setAttribute('data-compute-prd-inspect', 'true'));

    const inspectTarget = (event: MouseEvent | KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest('.compute-space') || target.closest('[data-prd-inspector]')) return;
      const annotated = target.closest('[data-prd-id]');
      const ids = splitIds(annotated?.getAttribute('data-prd-id') ?? null);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setLinkedIds(ids.length ? ids : page.requirementIds);
      setActiveId(ids[0] ?? page.requirementIds[0]);
      setOpen(true);
    };
    const click = (event: MouseEvent) => inspectTarget(event);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') inspectTarget(event);
    };
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', keydown, true);
    return () => {
      roots.forEach(root => root.removeAttribute('data-compute-prd-inspect'));
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', keydown, true);
    };
  }, [inspecting, page, pathname]);

  useEffect(() => {
    if (!open) return;
    const nodes = [...document.querySelectorAll<HTMLElement>('.compute-space [data-prd-id]')];
    setLinkedControls([...new Set(nodes.filter(node => splitIds(node.getAttribute('data-prd-id')).includes(activeId)).map(node => {
      const label = node.getAttribute('aria-label') || node.querySelector('h1,h2,h3')?.textContent || node.textContent || node.tagName;
      return label.replace(/\s+/g, ' ').trim().slice(0, 90);
    }))]);
  }, [activeId, open, pathname]);

  function persist(next: RequirementEdits, explicit = false) {
    try {
      window.localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(next));
      setSaveStatus(explicit ? 'PRD 修订已保存到本机。' : '修改已自动保存到本机。');
    } catch {
      setSaveStatus('本机存储不可用；修改仍在当前页面，可导出 Markdown 保存。');
    }
  }

  function updateRequirement(patch: RequirementEdits[string]) {
    const next = { ...edits, [activeId]: { ...edits[activeId], ...patch } };
    setEdits(next);
    persist(next);
  }

  function restoreRequirement() {
    const next = { ...edits };
    delete next[activeId];
    setEdits(next);
    persist(next, true);
  }

  function exportPage() {
    downloadMarkdown(`AI4S_算空间_${page.title}_需求.md`, buildPageMarkdown(page, edits));
    setExportStatus(`已导出“${page.title}”需求与本机修订。`);
  }

  async function exportFull() {
    setExporting(true);
    setExportStatus('正在准备完整 PRD 与本机修订…');
    try {
      const source = originalPrd || await loadOriginal();
      downloadMarkdown('AI4S_算空间_完整PRD与需求映射.md', buildFullMarkdown(source, edits));
      setExportStatus('已导出完整 PRD 原文、全部页面映射和本机修订。');
    } catch {
      setExportStatus('完整 PRD 原文读取失败，未生成不完整导出。请点击“完整 PRD”重试。');
    } finally {
      setExporting(false);
    }
  }

  function openCurrentPage() {
    setLinkedIds(page.requirementIds);
    setActiveId(page.requirementIds[0]);
    setOpen(true);
  }

  const exportButtons = <>
    <Button type="button" variant="ghost" className="min-h-11 px-3 text-xs" disabled={!hydrated} onClick={exportPage}>
      <Download className="size-3.5" />导出本页
    </Button>
    <Button type="button" variant="ghost" className="min-h-11 px-3 text-xs" disabled={!hydrated || exporting} onClick={() => void exportFull()}>
      <Download className="size-3.5" />{exporting ? '准备中…' : '完整 PRD'}
    </Button>
  </>;

  return <>
    <div data-prd-inspector className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-dashed border-line pb-2 text-muted-foreground" aria-label="原型需求工具栏">
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant={inspecting ? 'secondary' : 'ghost'} className="min-h-11 px-3 text-xs" aria-pressed={inspecting} onClick={() => setInspecting(value => !value)}>
          <ScanSearch className="size-3.5" />{inspecting ? '退出需求检视' : '需求检视'}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 px-3 text-xs" onClick={openCurrentPage}>
          <FileText className="size-3.5" />本页需求
        </Button>
        {inspecting && <span className="px-2 text-xs text-primary">检视中：点击区域查看需求；退出后继续演示。</span>}
      </div>
      <div className="flex items-center gap-1">{exportButtons}</div>
      {exportStatus && <p className="w-full px-3 text-xs leading-5" role="status">{exportStatus}</p>}
    </div>

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" data-prd-inspector className="w-full gap-0 overflow-hidden bg-white sm:max-w-[620px]">
        <SheetHeader className="border-b border-line px-5 py-5 pr-12">
          <SheetTitle>需求检视 · {activePage?.title ?? page.title}</SheetTitle>
          <SheetDescription>查看来源、编辑需求并保存本机修订。关闭检视模式后可继续正常操作演示。</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">当前页需求</span>
            <select className={textFieldClass} value={activeId} onChange={event => setActiveId(event.target.value)} aria-label="选择需求条目">
              {computePrdPages.filter(item => item.id === page.id || item.requirementIds.includes(activeId) || linkedIds.some(id => item.requirementIds.includes(id))).map(item => <optgroup key={item.id} label={item.title}>
                {item.requirementIds.map(id => <option value={id} key={id}>{id} · {getRequirement(id, edits)?.title}</option>)}
              </optgroup>)}
            </select>
          </label>
          {linkedIds.length > 1 && <p className="text-xs leading-5 text-muted-foreground">此区域关联 {linkedIds.length} 条需求，可在上方切换。</p>}
          {active && <>
            <div className="rounded-md border border-line bg-surface-2 p-3 text-xs leading-6">
              <strong className="font-mono text-primary">{active.id}</strong>
              <p>PRD 章节：{active.section}</p>
              <p className="break-words">来源：{active.source}</p>
              <a href={PRD_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-primary underline underline-offset-4">查看完整来源 Markdown</a>
            </div>
            <label className="grid gap-2 text-sm"><span className="font-medium">需求标题</span>
              <input className={textFieldClass} disabled={!hydrated} value={active.title} onChange={event => updateRequirement({ title: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm"><span className="font-medium">用户故事</span>
              <textarea className={textFieldClass} rows={3} disabled={!hydrated} value={active.userStory} onChange={event => updateRequirement({ userStory: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm"><span className="font-medium">需求内容</span>
              <textarea className={textFieldClass} rows={6} disabled={!hydrated} value={active.description} onChange={event => updateRequirement({ description: event.target.value })} />
            </label>
            {([
              ['acceptanceCriteria', '验收条件（每行一项）'],
              ['businessRules', '业务规则（每行一项）'],
              ['states', '状态与边界（每行一项）'],
              ['assumptions', '原型假设 / 待确认项（每行一项）'],
            ] as const).map(([key, label]) => <label className="grid gap-2 text-sm" key={key}>
              <span className="font-medium">{label}</span>
              <textarea className={textFieldClass} rows={key === 'acceptanceCriteria' ? 4 : 3} disabled={!hydrated} value={active[key].join('\n')} onChange={event => updateRequirement({ [key]: event.target.value.split('\n') })} />
            </label>)}
            <section className="border-t border-line pt-4">
              <h3 className="text-sm font-medium">关联界面区域</h3>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">
                {(linkedControls.length ? linkedControls : [active.title, `${activePage?.title ?? page.title}的相关操作；未单独标注的区域使用页面章节映射。`]).map((label, index) => <li key={`${label}-${index}`} className="break-words">• {label}</li>)}
              </ul>
            </section>
          </>}
          <section className="border-t border-line pt-4">
            <h3 className="text-sm font-medium">本页章节覆盖</h3>
            <ul className="mt-2 space-y-1 text-xs leading-6 text-muted-foreground">{pageRequirements.map(item => <li key={item.id}>{item.id} · {item.title}</li>)}</ul>
          </section>
        </div>
        <footer className="border-t border-line bg-surface-2 p-4">
          <p className="mb-3 text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">{saveStatus}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="min-h-11" disabled={!hydrated} onClick={() => persist(edits, true)}><Save className="size-4" />保存 PRD</Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={!hydrated || !edits[activeId]} onClick={restoreRequirement}><Undo2 className="size-4" />恢复本条</Button>
            {exportButtons}
          </div>
          {sourceStatus === 'error' && <p className="mt-2 text-xs text-destructive">原文暂不可读；点击“完整 PRD”会重新读取后导出。</p>}
          {exportStatus && <p className="mt-2 text-xs leading-5 text-muted-foreground" role="status">{exportStatus}</p>}
        </footer>
      </SheetContent>
    </Sheet>
    <style>{`
      .compute-space[data-compute-prd-inspect="true"] [data-prd-id] {
        outline: 1px dashed var(--primary);
        outline-offset: 2px;
        cursor: help;
      }
      .compute-space[data-compute-prd-inspect="true"] [data-prd-id]:hover {
        outline-width: 2px;
      }
      .compute-space[data-compute-prd-inspect="true"] [data-prd-inspector] {
        cursor: auto;
      }
    `}</style>
  </>;
}
