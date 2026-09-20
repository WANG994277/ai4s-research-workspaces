import { LoaderCircle } from 'lucide-react';

export default function KnowledgeLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white p-8 text-center">
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary motion-reduce:animate-none" />
      <h1 className="text-base font-semibold text-foreground">正在载入知识库</h1>
      <p className="text-sm leading-6 text-muted-foreground">正在准备文献、知识图谱和问答工作区…</p>
    </div>
  );
}
