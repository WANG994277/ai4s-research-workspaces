import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const id = Array.isArray(query.id) ? query.id[0] : query.id;
  redirect(
    id
      ? `/research-spaces/current/assets/${encodeURIComponent(id)}`
      : "/research-spaces/current/assets",
  );
}
