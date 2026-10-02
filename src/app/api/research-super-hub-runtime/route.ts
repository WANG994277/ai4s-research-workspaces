import { loadResearchSuperHubSource } from "@/components/v1/research-super-hub-server";

export function GET() {
  return new Response(loadResearchSuperHubSource().runtime, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
