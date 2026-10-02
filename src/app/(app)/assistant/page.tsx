import { ResearchSuperHub } from "@/components/v1/research-super-hub";
import { loadResearchSuperHubSource } from "@/components/v1/research-super-hub-server";

export default function AssistantPage() {
  return <ResearchSuperHub {...loadResearchSuperHubSource()} />;
}
