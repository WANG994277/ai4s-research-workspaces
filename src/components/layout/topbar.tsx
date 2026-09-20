'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, CheckSquare, ChevronRight, Search, Sparkles, X } from 'lucide-react';
import { capabilities, getCapability, navigationHref, canAccessCapability, isReadSpacePath } from '@/lib/capabilities';
import { useSidebar } from './sidebar-context';
import { ResearchProfileMenu } from '@/components/research/profile-menu';
import { ProjectContext } from '@/components/research/project-context';

const roleNames = { researcher: '科研人员', lead: '课题负责人', manager: '科研管理人员', admin: '平台管理员' };

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { role } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const match = getCapability(`${pathname}?${params}`);
  const title = pathname === '/workbench' ? '工作台' : match?.label ?? '科研工作';
  const parent = pathname === '/workbench' ? 'AI4S' : match?.group ?? 'AI4S';
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const accessible = capabilities.filter((item) => canAccessCapability(role,item));
    if (!keyword) return accessible.filter((item) => item.priority === 'P0').slice(0, 8);
    return accessible.filter((item) => `${item.group} ${item.label}`.toLowerCase().includes(keyword)).slice(0, 12);
  }, [query, role]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault();setSearchOpen((v) => !v); }
      if (e.key === 'Escape') { setSearchOpen(false);setNoticeOpen(false); }
    };
    window.addEventListener('keydown',handle); return () => window.removeEventListener('keydown',handle);
  }, []);

  const openAssistant = () => pathname.startsWith('/do-space') ? router.push('/do-space') : isReadSpacePath(pathname) ? router.push('/read-space/agent') : window.dispatchEvent(new CustomEvent('petrolab:open-assistant'));

  return <>
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
      <nav aria-label="面包屑" className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[13px]">
        <Link href="/workbench" className="font-semibold text-primary hover:underline">AI4S</Link>
        <ChevronRight className="size-3 text-faint" />
        {parent !== 'AI4S' && <><span className="hidden text-muted-foreground sm:inline">{parent}</span><ChevronRight className="hidden size-3 text-faint sm:inline" /></>}
        <span className="truncate font-medium text-foreground">{title}</span>
      </nav>
      <ProjectContext />
      <button onClick={() => setSearchOpen(true)} className="ml-auto hidden h-8 w-[min(32vw,360px)] items-center gap-2 rounded-md border border-line bg-[#F8FAFC] px-3 text-left text-xs text-muted-foreground hover:border-primary/40 md:flex" aria-label="全局搜索">
        <Search className="size-3.5" />搜索文献、数据、模型、实验、课题、专家
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
        <button onClick={() => setSearchOpen(true)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#F6F7F9] md:hidden" aria-label="搜索"><Search className="size-4" /></button>
        <button onClick={openAssistant} className="flex size-8 items-center justify-center rounded-md text-primary hover:bg-[#FCEBEC]" aria-label="打开 AI 科研助手" title="AI 科研助手"><Sparkles className="size-4" /></button>
        <button onClick={() => router.push(isReadSpacePath(pathname) ? '/read-space/tasks' : '/tasks')} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#F6F7F9]" aria-label="查看待办"><CheckSquare className="size-4" /></button>
        <div className="relative">
          <button onClick={() => setNoticeOpen(!noticeOpen)} className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#F6F7F9]" aria-label="消息通知"><Bell className="size-4" /><i className="absolute right-1 top-1 size-1.5 rounded-full bg-[#D92D20]" /></button>
          {noticeOpen && <div className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-line bg-white p-3 shadow-lg"><strong className="text-sm">消息通知</strong><p className="mt-2 text-xs leading-5 text-muted-foreground">实验 GB-2026-0915 数据已同步至 ELN。计算任务 #1024 已完成。</p><Link href="/workbench#activity" onClick={() => setNoticeOpen(false)} className="mt-2 inline-block text-xs text-primary hover:underline">查看科研活动</Link></div>}
        </div>
        <span className="hidden whitespace-nowrap px-1 text-[11px] text-muted-foreground lg:inline">{roleNames[role]}</span>
        <ResearchProfileMenu />
      </div>
    </header>

    {searchOpen && <div className="fixed inset-0 z-[100] flex justify-center bg-[#101828]/35 px-4 pt-[12vh]" onMouseDown={() => setSearchOpen(false)}>
      <div onMouseDown={(event) => event.stopPropagation()} className="h-fit w-full max-w-xl overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-4"><Search className="size-4 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索功能入口" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="搜索功能入口" /><button onClick={() => setSearchOpen(false)} aria-label="关闭搜索" className="text-muted-foreground"><X className="size-4" /></button></div>
        <div className="max-h-[55vh] overflow-y-auto p-2">{results.length ? results.map((item) => <button key={item.id} onClick={() => { router.push(navigationHref(item)); setSearchOpen(false); setQuery(''); }} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-[#FCEBEC]"><span>{item.label}<small className="ml-2 text-muted-foreground">{item.group}</small></span><ChevronRight className="size-3.5 text-faint" /></button>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">没有找到匹配的功能</p>}</div>
      </div>
    </div>}
  </>;
}
