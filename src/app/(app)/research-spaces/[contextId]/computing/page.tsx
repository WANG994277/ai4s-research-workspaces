import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ contextId: string }> }) {
  const { contextId } = await params;
  redirect(`/research-spaces/${encodeURIComponent(contextId)}/activities?tab=computing`);
}
