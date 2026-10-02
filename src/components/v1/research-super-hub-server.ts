import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractResearchSuperHub,
  type ResearchSuperHubSource,
} from "./research-super-hub-source";

let cachedSource: ResearchSuperHubSource | undefined;

export function loadResearchSuperHubSource() {
  if (cachedSource) return cachedSource;
  const sourcePath = join(process.cwd(), "public", "AI4S科研平台原型设计.html");
  cachedSource = extractResearchSuperHub(readFileSync(sourcePath, "utf8"));
  return cachedSource;
}
