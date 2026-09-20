import { notFound } from 'next/navigation';
import { ReadHome } from '@/components/read-space/home';
import { ReadAgent } from '@/components/read-space/agent';
import { ReadTasks } from '@/components/read-space/tasks';
import { ReadHandoff } from '@/components/read-space/handoff';

export default async function ReadSpacePage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments=[] }=await params;
  if (!segments.length) return <ReadHome/>;
  if (segments.length !== 1) notFound();
  if (segments[0] === 'agent') return <ReadAgent/>;
  if (segments[0] === 'tasks') return <ReadTasks/>;
  if (segments[0] === 'handoff') return <ReadHandoff/>;
  notFound();
}
