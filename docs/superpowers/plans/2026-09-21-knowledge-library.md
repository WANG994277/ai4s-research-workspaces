# 科研知识库 Implementation Plan

> **For agentic workers:** use subagent-driven-development for bounded component work, then review specification coverage and code quality. All workers share this checkout and must preserve other edits.

**Goal:** Implement the supplied knowledge-library specification in the existing local frontend prototype and add a first-level 知识库 link immediately after 读空间.

**Architecture:** A shared persisted knowledge store owns bases, versioned documents, evidence, entities, relations, entries and scoped conversations. Route-driven documents/graph/chat views consume the same objects; evidence links open the exact document/version/section. Local text, graph and metadata retrieval is implemented honestly; unavailable external parsing/model services are explicitly shown as unavailable rather than fabricated.

**Tech Stack:** existing Next.js App Router, React, TypeScript, Radix dialogs, Lucide, CSS modules, browser localStorage and IndexedDB. No new remote service or credentials.

## File ownership and work

- [x] Root: `src/components/knowledge/model.ts`, `seed.ts`, `store.tsx`, `files.ts`: shared contract, realistic labeled source excerpts, version-scoped graph evidence, persisted metadata/blob storage and mutations.
- [x] Root: `src/components/knowledge/workspace.tsx`, `documents.tsx`, `dialogs.tsx`, `knowledge.module.css`: directory, active-base header, exactly three core tabs, document filtering/import/retry, base creation/editing, empty/error/permission states, responsive layouts.
- [x] Graph worker: `graph.tsx`, `graph.module.css`: entity/relation search, depth/direction/path filtering, accessible SVG pan/zoom, details and evidence navigation. No generated relationship may lack source evidence.
- [x] Retrieval/chat worker: `retrieval.ts`, `chat.tsx`, `chat.module.css`: text+graph+metadata fusion, evidence-only answers, scoped multi-turn conversations and extraction to entries. No unrelated or unavailable document may contribute an answer.
- [x] Reader/entries worker: `reader.tsx`, `entries.tsx`, `reader.module.css`: section reader, evidence highlighting, notes/tags/favorites, original-file preview, version history, editable sourced knowledge entries.
- [x] Root: `src/app/(app)/knowledge/[[...segments]]/page.tsx`, loading/error boundaries, `src/lib/capabilities.ts`, sidebar/topbar integration. Routes cover default base, documents, document reader, graph, chat and entries; entries stay outside the three core tabs.

## Design contract

- Existing palette #B4232D/#8D1B24, #F5F6F8 background, white surfaces, #D9DDE3 borders, Microsoft YaHei/PingFang body14/caption12, 8px controls.
- Desktop1440: directory~210px, flexible main, assistant~260px; at narrower widths auxiliary panels collapse behind labeled controls. Tables scroll within their panel, never the body.
- No dashboard KPI blocks, discovery tabs, members/settings core tabs. Library groups remain inside the directory only.
- Seed material is explicitly labeled demonstration excerpts. Import preserves original blobs; text formats are locally searchable. Binary source files remain awaiting connected parser unless text is supplied. No fabricated parsed content.
- Each graph entity/relation and every supported answer point links to an existing document/version/section. Unmatched queries show evidence insufficiency.

## Acceptance checks

- [x] `node --import tsx scripts/check-knowledge.mjs`: assert scope isolation, multi-channel retrieval, failed document exclusion, evidence referential integrity, version and graph consistency.
- [x] `pnpm run ts-check` and knowledge-module scoped ESLint: exit0. Full lint excludes generated `.next*/**` artifacts.
- [x] `pnpm build`: successful production build.
- [x] Browser at1440 and1280: first-level nav order, three tabs, create base, import text, filter, graph node/edge evidence, chat citation jump and return, save entry, refresh persistence and no-access base.
- [x] Review screenshots and console, fix actual issues, record supported behaviors and external-service limitations in `docs/knowledge/acceptance.md`.

No existing design image, excluded platform module, or unrelated user change is modified. No remote deployment or git push is part of this task.
