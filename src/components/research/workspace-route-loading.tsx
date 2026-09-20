import { LoaderCircle } from 'lucide-react';

/** Keep the workspace tabs available while the next route is loading. */
export function WorkspaceRouteLoading() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-xl border border-line bg-white p-8"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        正在打开文献工作区…
      </div>
      <p className="mt-2 text-xs text-muted-foreground">首次打开可能需要稍等，仍可使用上方页签切换。</p>
    </section>
  );
}
