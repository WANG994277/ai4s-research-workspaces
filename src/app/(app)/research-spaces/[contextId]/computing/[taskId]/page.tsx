import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ contextId: string; taskId: string }> }) {
  const { contextId, taskId } = await params;
  redirect(`/research-spaces/${encodeURIComponent(contextId)}/activities/computing/${encodeURIComponent(taskId)}`);
}
