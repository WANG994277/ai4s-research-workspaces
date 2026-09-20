import { KnowledgeWorkspace } from '@/components/knowledge/workspace';

export default async function KnowledgePage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  return <KnowledgeWorkspace segments={segments} />;
}
