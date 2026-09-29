import { readFileSync } from "node:fs";

const source = readFileSync("src/components/v1/datasets.tsx", "utf8");

if (source.includes("<ContextActions")) {
  throw new Error("Dataset detail still renders Research Agent context actions");
}

if (/import\s*\{[^}]*ContextActions[^}]*\}\s*from\s*["']\.\/actions["']/.test(source)) {
  throw new Error("Dataset marketplace still imports unused ContextActions");
}

console.log("Dataset detail action removal checks passed");
