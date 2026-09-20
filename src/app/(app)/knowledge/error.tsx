'use client';

import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function KnowledgeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white p-8 text-center">
      <AlertCircle aria-hidden="true" className="size-7 text-primary" />
      <h1 className="text-base font-semibold text-foreground">知识库暂时无法载入</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">请重试加载。如果仍然失败，可以先返回工作台，再重新打开知识库。</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <RotateCcw aria-hidden="true" className="size-4" />重新加载
        </button>
        <Link href="/workbench" className="inline-flex min-h-9 items-center rounded-md border border-line bg-white px-4 py-2 text-sm text-muted-foreground hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">返回工作台</Link>
      </div>
    </div>
  );
}
