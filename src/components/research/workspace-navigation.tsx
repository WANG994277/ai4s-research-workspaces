'use client';
import Link, { useLinkStatus } from 'next/link';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useResearchProject } from './workspace-kit';
const literatureViews = [
  ['检索与筛选', '/literature-search'],
  ['文献精读', '/literature-search/1'],
  ['图表提取', '/literature-search/data-extract'],
  ['专题与知识整理', '/literature-library'],
];
export function WorkspaceNavigation() {
  const pathname = usePathname();
  const { href } = useResearchProject();
  if (pathname === '/experiment-design' || pathname === '/experiment-plans')
    return (
      <nav
        className="mb-5 flex gap-4 border-b border-line pb-3"
        aria-label="实验方案工作区"
      >
        <Link className="research-button" href={href('/experiment-plans')}>
          方案模板与审批
        </Link>
        <Link className="research-button" href={href('/experiment-design')}>
          因子与 DOE 设计
        </Link>
      </nav>
    );
  if (
    !pathname.startsWith('/literature-search') &&
    pathname !== '/literature-library'
  )
    return null;
  const active =
    pathname === '/literature-library'
      ? 3
      : pathname.endsWith('data-extract')
        ? 2
        : pathname === '/literature-search'
          ? 0
          : 1;
  return (
    <nav
      className="mb-5 flex gap-5 border-b border-line"
      aria-label="文献工作区导航"
    >
      {literatureViews.map(([label, path], i) => (
        <Link
          key={path}
          href={href(path)}
          aria-current={active === i ? 'page' : undefined}
          className="group"
        >
          <WorkspaceTabLabel active={active === i} label={label} />
        </Link>
      ))}
    </nav>
  );
}


function WorkspaceTabLabel({ active, label }: { active: boolean; label: string }) {
  const { pending } = useLinkStatus();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) { setSlow(false); return; }
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  return (
    <span className="relative inline-flex">
      <span
        aria-busy={pending}
        className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm ${active || pending ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground group-hover:text-primary'}`}
      >
        {label}
        {pending && <><LoaderCircle aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" /><span role="status" className="sr-only">正在打开{label}</span></>}
      </span>
      {pending && slow && (
        <span className="absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-line bg-white p-3 text-xs text-muted-foreground shadow-lg">
          加载时间较长，可切换其他页签，或刷新页面重试。
        </span>
      )}
    </span>
  );
}
