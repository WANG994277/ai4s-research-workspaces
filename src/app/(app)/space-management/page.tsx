import { redirect } from "next/navigation";

const views: Record<string, string> = {
  项目空间: "topics",
  课题空间: "topics",
  空间成员: "members",
  角色与权限: "roles",
  空间配置: "basic",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const raw = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  redirect(`/research-spaces/current/manage/${views[raw ?? ""] ?? "basic"}`);
}
