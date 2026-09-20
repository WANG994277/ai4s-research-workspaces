'use client';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import { useSidebar } from '@/components/layout/sidebar-context';
import { projects } from '@/mock/research';
import { Modal, useResearchProject } from './workspace-kit';

export function ProjectContext() {
  const { project } = useResearchProject();
  const { setProjectId } = useSidebar();
  const [next, setNext] = useState('');
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  function confirm() {
    setProjectId(next);
    const search = new URLSearchParams(params.toString());
    search.set('projectId', next);
    search.delete('sourceId');
    router.push(`${pathname}?${search}`);
    setNext('');
  }
  return (
    <>
      <div className="flex min-w-0 max-w-[270px] items-center gap-2 border-l border-line pl-3">
        <FolderKanban className="size-4 shrink-0 text-primary" />
        <label className="min-w-0">
          <span className="block text-[10px] text-muted-foreground">
            当前课题 · 课题组内
          </span>
          <select
            aria-label="当前科研课题"
            value={project.id}
            onChange={(e) => setNext(e.target.value)}
            className="w-full truncate bg-white text-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Modal
        open={!!next}
        onClose={() => setNext('')}
        title="切换科研课题"
        description="原课题运行中的任务继续执行，已保存的笔记和产物保留。未保存的表单请先保存。"
      >
        <p className="text-sm">
          将切换到：{projects.find((p) => p.id === next)?.name}
        </p>
        <div className="flex justify-end gap-2">
          <button className="research-button" onClick={() => setNext('')}>
            返回继续编辑
          </button>
          <button className="research-primary" onClick={confirm}>
            确认切换
          </button>
        </div>
      </Modal>
    </>
  );
}
