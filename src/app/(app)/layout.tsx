'use client';

import { SidebarProvider } from '@/components/layout/sidebar-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ResearchAssistantPanel } from '@/components/layout/research-assistant-panel';
import { Suspense } from 'react';
import { WorkspaceNavigation } from '@/components/research/workspace-navigation';
import { usePathname } from 'next/navigation';
import { isKnowledgePath, isReadSpacePath } from '@/lib/capabilities';
import { ReadShell } from '@/components/read-space/shell';
import { ReadDraftReceiver } from '@/components/read-space/handoff';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Suspense fallback={<div className="p-6 text-sm">正在载入科研工作区…</div>}><SidebarProvider>
      <div className={`flex h-screen overflow-hidden ${isReadSpacePath(pathname) ? 'read-space-layout' : ''}`}>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 min-[1440px]:p-6">
            {isReadSpacePath(pathname) ? <ReadShell>{children}</ReadShell> : <><WorkspaceNavigation />{!pathname.startsWith('/compute-space') && !pathname.startsWith('/do-space') && <ReadDraftReceiver />}{children}</>}
          </main>
        </div>
        {!isKnowledgePath(pathname) && !isReadSpacePath(pathname) && !pathname.startsWith('/compute-space') && !pathname.startsWith('/do-space') && <ResearchAssistantPanel />}
      </div>
    </SidebarProvider></Suspense>
  );
}
