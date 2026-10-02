# Research Activities and Scientific Computing Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Scientific Computing into Research Activities and rebuild the Research Activities home page to match the approved reference.

**Architecture:** Research Activities owns the top-level capability tabs and table UI. Scientific Computing is rendered in embedded mode under its tab, while compatibility routes redirect old URLs to the new route family.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules, Node.js test runner

---

### Task 1: Lock navigation and page requirements

**Files:**
- Modify: `src/components/v1/navigation.test.ts`
- Create: `src/components/v1/research-activities-source.test.ts`

- [ ] Write tests asserting that Research Spaces omits the standalone Scientific Computing menu, Research Activities exposes all six tabs, and deleted fields/actions are absent from the Agent table.
- [ ] Run the focused tests and confirm they fail for the current implementation.

### Task 2: Rebuild Research Activities home

**Files:**
- Modify: `src/components/v1/research-activities.tsx`
- Modify: `src/components/v1/research-activities.module.css`

- [ ] Replace the card dashboard with the approved tabbed table layout.
- [ ] Add URL-backed tab selection, search, status filtering, contextual create button, and pagination.
- [ ] Render Scientific Computing in embedded mode for the sixth tab.

### Task 3: Integrate routes and navigation

**Files:**
- Modify: `src/components/v1/navigation.ts`
- Modify: `src/components/v1/shell.tsx`
- Modify: `src/components/v1/scientific-computing.tsx`
- Create: `src/app/(app)/research-spaces/[contextId]/activities/computing/[taskId]/page.tsx`
- Modify: legacy computing route pages

- [ ] Remove the standalone navigation item.
- [ ] Add embedded rendering and Research Activities task-detail paths.
- [ ] Redirect legacy computing URLs to their Research Activities equivalents.

### Task 4: Verify

- [ ] Run focused source, navigation, and computing-domain tests.
- [ ] Run TypeScript and targeted ESLint checks.
- [ ] Verify Agent and Scientific Computing tabs in the browser.
