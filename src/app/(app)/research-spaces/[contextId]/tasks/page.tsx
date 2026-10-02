import { ResearchSuperHub } from "@/components/v1/research-super-hub";
import { loadResearchSuperHubSource } from "@/components/v1/research-super-hub-server";
import { prepareResearchTaskMarkup } from "@/components/v1/research-super-hub-source";

export default function ResearchTasksPage() {
  const source = loadResearchSuperHubSource();
  return (
    <ResearchSuperHub
      {...source}
      markup={prepareResearchTaskMarkup(source.markup)}
      initialView="tasks"
    />
  );
}
