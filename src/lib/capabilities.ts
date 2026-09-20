import entries from '@/data/capabilities.json';

export interface Capability {
  id: number;
  pageId: string;
  group: string;
  label: string;
  href: string;
  priority: string;
  strategy: string;
  role: string;
  legacy: string;
  nav: string;
}

export const capabilities: Capability[] = entries;

export const researcherGroups = ['科研协作', '读空间', '算空间', '做空间', '科研资产'];
export const managerGroups = ['科研驾驶舱', '科研项目管理'];
export const adminGroups: string[] = [];

export function visibleGroups(role: string) {
  // Keep the research cockpit discoverable in every prototype role.
  return role === 'researcher'
    ? [...researcherGroups.slice(0, 4), '科研驾驶舱', '科研资产']
    : ['科研驾驶舱', ...researcherGroups.slice(0, 4), '科研项目管理', '科研资产'];
}

export function canAccessCapability(role: string, item: Capability) {
  return item.group === '个人工作台' || visibleGroups(role).includes(item.group);
}

export function navigationHref(item: Capability) {
  if (item.href === '/literature-search/[id]') return '/literature-search/1';
  if (item.pageId === 'EX-01') return '/experiment-plans';
  return item.href;
}

export function getCapability(href: string) {
  const url = new URL(href, 'http://local');
  if (url.pathname === '/experiment-plans') return capabilities.find((item) => item.pageId === 'EX-01');
  if (url.pathname === '/literature-library') return capabilities.find((item) => item.pageId === 'RD-02');
  // Dashboard views remain distinct when links carry project/source context.
  if (url.pathname === '/dashboard' && url.searchParams.has('view')) {
    const dashboardView = url.searchParams.get('view');
    const matched = capabilities.find((item) => {
      const target = new URL(item.href, 'http://local');
      return target.pathname === '/dashboard' && target.searchParams.get('view') === dashboardView;
    });
    if (matched) return matched;
  }
  const normalized = url.pathname.replace(/\/$/, '') || '/';
  return capabilities.find((item) => item.href === `${normalized}${url.search}`)
    ?? capabilities.find((item) => item.href.split(/[?#]/)[0] === normalized)
    ?? (normalized.startsWith('/literature-search/') ? capabilities.find((item) => item.href === '/literature-search/[id]') : undefined);
}

export function isCurrentCapability(pathname: string, href: string) {
  const current = new URL(pathname, 'http://local');
  const target = new URL(href === '/literature-search/[id]' ? '/literature-search/1' : href, 'http://local');
  if (target.pathname === '/dashboard') return current.pathname === target.pathname && current.searchParams.get('view') === target.searchParams.get('view');
  if (target.pathname === '/literature-search') return current.pathname === '/literature-library' || current.pathname.startsWith('/literature-search');
  if (target.pathname === '/experiment-design') return current.pathname === '/experiment-plans' || current.pathname === target.pathname;
  if (target.pathname === '/lab-resources') return current.pathname.startsWith('/lab-resources');
  if (target.pathname === '/experiments') return current.pathname === '/experiments' || current.pathname === '/experiments/orchestrator';
  if (target.pathname === '/compute-space/data') return current.pathname === '/compute-space/data' || current.pathname === '/compute-space/models';
  return current.pathname === target.pathname;
}

export function contextHref(href: string, projectId: string, sourceId?: string) {
  const url = new URL(href, 'http://local');
  if (projectId) url.searchParams.set('projectId', projectId);
  if (sourceId) url.searchParams.set('sourceId', sourceId);
  return `${url.pathname}${url.search}${url.hash}`;
}
