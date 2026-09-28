import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const v1Ui = read("src/components/v1/ui.tsx");
const v1Css = read("src/components/v1/v1.css");
const knowledge = read("src/components/v1/knowledge.tsx");
const shell = read("src/components/v1/shell.tsx");
const assetHub = read("src/components/assets/hub.tsx");
const assetCss = read("src/components/assets/asset-hub.module.css");
const doCss = read("src/components/do-space-v2/do-space.css");
const collaborationCss = read(
  "src/components/collaboration/collaboration.module.css",
);

for (const marker of [
  "useRef",
  "formId?: string",
  "ref={inputRef}",
  'className="v-search-field"',
  "onMouseDown",
  "inputRef.current?.focus()",
  'aria-hidden="true"',
]) {
  if (!v1Ui.includes(marker)) {
    throw new Error(`Shared SearchBox is missing: ${marker}`);
  }
}

for (const marker of [
  ".v-search input:focus-visible",
  ".v-search:focus-within",
]) {
  if (!v1Css.includes(marker)) {
    throw new Error(`Shared search focus CSS is missing: ${marker}`);
  }
}

for (const marker of [
  'formId="knowledge-home-search"',
  'form="knowledge-home-search"',
  'type="submit"',
  "if (!value.trim() || loading) return",
  "disabled={loading || !input.trim()}",
]) {
  if (!knowledge.includes(marker)) {
    throw new Error(`Knowledge search behavior is missing: ${marker}`);
  }
}

for (const marker of [
  'formId="global-knowledge-search"',
  'form="global-knowledge-search"',
]) {
  if (!shell.includes(marker)) {
    throw new Error(`Global search form association is missing: ${marker}`);
  }
}

for (const marker of ["useRef", "onMouseDown", "inputRef.current?.focus()", "<form"] ) {
  if (!assetHub.includes(marker)) {
    throw new Error(`Asset search interaction is missing: ${marker}`);
  }
}

for (const [name, css, markers] of [
  ["assets", assetCss, [".searchBox:focus-within", ".searchBox input:focus-visible"]],
  ["do-space", doCss, [".do-search:focus-within", ".do-search input:focus-visible"]],
  ["collaboration", collaborationCss, [".search:focus-within", ".search input:focus-visible"]],
]) {
  for (const marker of markers) {
    if (!css.includes(marker)) {
      throw new Error(`${name} search focus CSS is missing: ${marker}`);
    }
  }
}

console.log("Search interaction checks passed");
