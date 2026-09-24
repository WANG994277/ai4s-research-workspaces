import { Suspense } from 'react';
import { BaselineShell } from '@/components/v1/shell';
export default function AppLayout({children}:{children:React.ReactNode}){return <Suspense fallback={<div>正在载入科研平台…</div>}><BaselineShell>{children}</BaselineShell></Suspense>;}
