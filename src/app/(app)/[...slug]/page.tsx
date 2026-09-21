import { notFound, redirect } from 'next/navigation';
import { capabilities } from '@/lib/capabilities';
import { AssetWorkspace } from '@/components/asset-workspace';
import aliases from '@/data/route-aliases.json';
import { IntegrationPlaceholder } from '@/components/research/integration-placeholder';
import { LabResources } from '@/components/research/lab-resources';
import { SamplesWorkspace, ExperimentsWorkspace } from '@/components/research/experiment-workspace';
import { StandardsWorkspace } from '@/components/research/standards-workspace';
import { ResearchAgentWorkspace } from '@/components/research/agent-workspace';
import { TasksWorkspace } from '@/components/research/tasks-workspace';
import { ToolsWorkspace, DesignWorkspace } from '@/components/research/catalog-workspace';
import { CollaborationProjects } from '@/components/collaboration/projects';
import { CollaborationExperiments } from '@/components/collaboration/experiments';
import { CollaborationFiles } from '@/components/collaboration/files';
import { CollaborationExperts } from '@/components/collaboration/experts';

export default async function CapabilityRoute({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const pathname = `/${slug.join('/')}`;
  const alias = (aliases as Record<string, string | { href: string; feature?: string }>)[pathname];
  if (alias) {
    const target = new URL(typeof alias === 'string' ? alias : alias.href.replace('[id]', '1'), 'http://local');
    for (const [key, value] of Object.entries(query)) if (typeof value === 'string') target.searchParams.set(key, value);
    if (target.pathname !== pathname) redirect(`${target.pathname}${target.search}${target.hash}`);
  }
  if (pathname === '/assets' || pathname.startsWith('/assets/')) return <AssetWorkspace />;
  const tab = typeof query.tab === 'string' ? query.tab : undefined;
  const view = typeof query.view === 'string' ? query.view : undefined;
  const exactHref = tab ? `${pathname}?tab=${tab}` : view ? `${pathname}?view=${view}` : pathname;
  const item = capabilities.find((entry) => entry.href === exactHref)
    ?? capabilities.find((entry) => entry.href.split(/[?#]/)[0] === pathname);
  if (!item) notFound();
  if (item.pageId === 'CO-01') return <CollaborationProjects />;
  if (item.pageId === 'CO-02') return <CollaborationExperiments />;
  if (item.pageId === 'CO-03') return <CollaborationFiles />;
  if (item.pageId === 'CO-04') return <CollaborationExperts />;
  if (item.pageId === 'CP-02') return <DesignWorkspace />;
  if (item.pageId === 'CP-06') return <ToolsWorkspace />;
  if (item.pageId === 'WB-03') return <TasksWorkspace />;
  if (item.pageId === 'RD-01' || item.pageId === 'CP-01') return <ResearchAgentWorkspace compute={item.pageId === 'CP-01'} />;
  if (item.pageId === 'RD-05') return <StandardsWorkspace />;
  if (item.pageId === 'EX-02') return <SamplesWorkspace />;
  if (['EX-03','EX-04'].includes(item.pageId)) return <LabResources key={item.pageId} reservation={item.pageId === 'EX-04'} />;
  if (['EX-05','EX-06'].includes(item.pageId)) return <ExperimentsWorkspace key={item.pageId} orchestrator={item.pageId === 'EX-05'} />;
  if (item.group === '科研项目管理' || ['CP-04','CP-05'].includes(item.pageId)) return <IntegrationPlaceholder item={item} />;
  notFound();
}
