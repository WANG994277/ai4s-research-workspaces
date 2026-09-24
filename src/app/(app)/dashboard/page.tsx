import { ScientificCockpit } from "@/components/research/cockpit/scientific-cockpit";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <ScientificCockpit
      initialView={typeof query.view === "string" ? query.view : undefined}
      initialRecord={
        typeof query.record === "string" ? query.record : undefined
      }
    />
  );
}
