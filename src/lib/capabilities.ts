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

export const capabilities: Capability[] = [
  ...entries,
  {
    id: 1001,
    pageId: 'KB-01',
    group: '知识库',
    label: '知识库',
    href: '/knowledge',
    priority: 'P0',
    strategy: 'AI4S自建',
    role: '普通科研人员/项目负责人/科研管理人员',
    legacy: '/knowledge',
    nav: '是',
  },
];

export const researcherGroups = ['科研协作', '读空间', '知识库', '算空间', '做空间', '科研资产'];
export const managerGroups = ['科研驾驶舱', '科研项目管理'];
export const adminGroups: string[] = [];

export function visibleGroups(role: string) {
  // Keep the research cockpit discoverable in every prototype role.
  return role === 'researcher'
    ? ['科研协作', '读空间', '知识库', '算空间', '做空间', '科研驾驶舱', '科研资产']
    : ['科研驾驶舱', '科研协作', '读空间', '知识库', '算空间', '做空间', '科研项目管理', '科研资产'];
}

export function isKnowledgePath(pathname: string) {
  return pathname === '/knowledge' || pathname.startsWith('/knowledge/');
}

export function isReadSpacePath(pathname: string) {
  return pathname === '/read-space' || pathname.startsWith('/read-space/') || pathname === '/literature-search' || pathname.startsWith('/literature-search/') || ['/standards-benchmark', '/patent-analysis', '/knowledge-graph', '/research-writing'].includes(pathname);
}

export function canAccessCapability(role: string, item: Capability) {
  return item.group === '个人工作台' || visibleGroups(role).includes(item.group);
}

export function navigationHref(item: Capability) {
  const doRoutes: Record<string,string> = {'EX-01':'/do-space','EX-02':'/do-space/samples','EX-03':'/do-space/equipment','EX-04':'/do-space/bookings','EX-05':'/do-space/tasks','EX-06':'/do-space/tasks','EX-07':'/do-space/analysis'};
  if (doRoutes[item.pageId]) return doRoutes[item.pageId];
  if (item.pageId === 'CP-03') return '/compute-space/tasks';
  if (item.href === '/literature-search/[id]') return '/literature-search/1';
  if (item.pageId === 'EX-01') return '/experiment-plans';
  return item.href;
}

export function getCapability(href: string) {
  const url = new URL(href, 'http://local');
  if (url.pathname === '/do-space' || url.pathname.startsWith('/do-space/')) {
    const section = url.pathname.split('/')[2] || '';
    const map:Record<string,[string,string]> = {'':['EX-01','开始实验设计'],agent:['EX-01','实验方案设计与生成'],plans:['EX-01','实验方案'],samples:['EX-02','样品与记录'],equipment:['EX-03','实验设备'],bookings:['EX-04','仪器预约'],orchestrate:['EX-05','实验自动编排'],tasks:['EX-06','实验管理'],analysis:['EX-07','表征分析']};
    const [pageId,label] = map[section] || map['']; const base = capabilities.find(item => item.pageId === pageId);
    return base ? {...base,label} : undefined;
  }
  if (url.pathname.startsWith('/compute-space')) {
    const section = url.pathname.split('/')[2];
    const pageId = section === 'design' ? 'CP-02' : ['tasks','analysis','handoff'].includes(section) ? 'CP-03' : section === 'data' ? 'CP-04' : section === 'models' ? 'CP-05' : section === 'tools' ? 'CP-06' : 'CP-01';
    return capabilities.find(item => item.pageId === pageId);
  }
  if (url.pathname === '/read-space' || url.pathname.startsWith('/read-space/')) {
    const base = capabilities.find(item => item.pageId === 'RD-01');
    if (base) return { ...base, label: url.pathname.endsWith('/tasks') ? '研究任务' : url.pathname.endsWith('/agent') ? '科研思路探索' : url.pathname.endsWith('/handoff') ? '研究验证草稿' : '开始研究' };
  }
  if (isKnowledgePath(url.pathname)) return capabilities.find((item) => item.pageId === 'KB-01');
  if (url.pathname === '/experiment-plans') return capabilities.find((item) => item.pageId === 'EX-01');
  if (url.pathname === '/literature-library') return capabilities.find((item) => item.pageId === 'RD-02');
  if (url.pathname === '/assets/upload') {
    const base = capabilities.find((item) => item.pageId === 'AS-00');
    return base ? { ...base, label: '上传科研资产' } : undefined;
  }
  if (url.pathname === '/assets/search') {
    const base = capabilities.find((item) => item.pageId === 'AS-00');
    return base ? { ...base, label: '科研资产搜索' } : undefined;
  }
  if (url.pathname === '/assets') return capabilities.find((item) => item.pageId === 'AS-00');
  if (url.pathname === '/assets/mine') return capabilities.find((item) => item.pageId === 'AS-05');
  if (url.pathname.startsWith('/assets/data-knowledge') || /^\/assets\/(data|knowledge|outcome)\//.test(url.pathname)) return capabilities.find((item) => item.pageId === 'AS-01');
  if (url.pathname.startsWith('/assets/models') || url.pathname.startsWith('/assets/model/')) return capabilities.find((item) => item.pageId === 'AS-02');
  if (url.pathname.startsWith('/assets/plans') || /^\/assets\/(compute-plan|experiment-plan)\//.test(url.pathname)) return capabilities.find((item) => item.pageId === 'AS-03');
  if (url.pathname.startsWith('/assets/intelligent-services') || /^\/assets\/(agent|workflow|skill|software|algorithm)\//.test(url.pathname)) return capabilities.find((item) => item.pageId === 'AS-04');
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
  if (target.pathname === '/do-space') return current.pathname === '/do-space' || current.pathname === '/do-space/agent';
  if (target.pathname.startsWith('/do-space/')) return current.pathname === target.pathname || current.pathname.startsWith(target.pathname+'/') || (target.pathname==='/do-space/tasks' && current.pathname==='/do-space/orchestrate');
  if (current.pathname.startsWith('/do-space') && target.pathname === '/experiment-design') return true;
  if (target.pathname === '/read-space') return current.pathname === '/read-space' || current.pathname === '/read-space/agent' || current.pathname === '/read-space/handoff';
  if (target.pathname === '/knowledge') return isKnowledgePath(current.pathname);
  if (target.pathname === '/dashboard') return current.pathname === target.pathname && current.searchParams.get('view') === target.searchParams.get('view');
  if (target.pathname === '/literature-search') return current.pathname === '/literature-library' || current.pathname.startsWith('/literature-search');
  if (target.pathname === '/experiment-design') return current.pathname === '/experiment-plans' || current.pathname === target.pathname;
  if (target.pathname === '/lab-resources') return current.pathname.startsWith('/lab-resources');
  if (target.pathname === '/experiments') return current.pathname === '/experiments' || current.pathname === '/experiments/orchestrator';
  if (target.pathname === '/compute-tasks') return current.pathname === '/compute-tasks' || current.pathname.startsWith('/compute-space/tasks') || current.pathname === '/compute-space/analysis';
  if (target.pathname === '/compute-space/tools') return current.pathname.startsWith('/compute-space/tools');
  if (target.pathname === '/compute-space') return current.pathname === '/compute-space' || current.pathname === '/compute-space/agent';
  if (target.pathname === '/assets') return current.pathname === '/assets' || current.pathname === '/assets/upload' || current.pathname === '/assets/search';
  if (target.pathname === '/assets/data-knowledge') return current.pathname === '/assets/data-knowledge' || /^\/assets\/(data|knowledge|outcome)\//.test(current.pathname);
  if (target.pathname === '/assets/models') return current.pathname === '/assets/models' || current.pathname.startsWith('/assets/model/');
  if (target.pathname === '/assets/plans') return current.pathname === '/assets/plans' || /^\/assets\/(compute-plan|experiment-plan)\//.test(current.pathname);
  if (target.pathname === '/assets/intelligent-services') return current.pathname === '/assets/intelligent-services' || /^\/assets\/(agent|workflow|skill|software|algorithm)\//.test(current.pathname);
  if (target.pathname === '/assets/mine') return current.pathname === '/assets/mine';
  return current.pathname === target.pathname;
}

export function contextHref(href: string, projectId: string, sourceId?: string) {
  const url = new URL(href, 'http://local');
  if (projectId) url.searchParams.set('projectId', projectId);
  if (sourceId) url.searchParams.set('sourceId', sourceId);
  return `${url.pathname}${url.search}${url.hash}`;
}
