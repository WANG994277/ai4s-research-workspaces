import type { ReactNode } from 'react';
import { KnowledgeProvider } from '@/components/knowledge/store';

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return <KnowledgeProvider>{children}</KnowledgeProvider>;
}
