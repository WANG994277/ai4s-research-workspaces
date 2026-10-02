# Workbench Space Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add presentational switching for personal and all spaces, restructure the modal as all spaces → project spaces → child topic spaces, and rename the topbar label to current space.

**Architecture:** Keep real-space switching in the existing research store. Add a Shell-local virtual selection for `personal` and `all`, so these options only affect the displayed selection and never change homepage business data. Render project selection separately from its expand control so project and child-topic levels are independently actionable.

**Tech Stack:** Next.js 16, React 19, TypeScript, Lucide React, CSS, Node test runner

---

### Task 1: Lock the space-switcher contract with tests

**Files:**
- Modify: `src/components/v1/research-super-hub-source.test.ts`
- Modify: `src/components/v1/workspace-view.test.ts`

- [ ] **Step 1: Write failing source-contract tests**

Add assertions that the topbar always contains `当前空间：`, the modal contains both virtual entries, and project rows expose distinct selection and expand controls.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm exec tsx --test src/components/v1/research-super-hub-source.test.ts src/components/v1/workspace-view.test.ts`

Expected: the new source-contract assertions fail against the current conditional `当前课题` label and old project-only toggle row.

### Task 2: Implement local virtual switching and the hierarchy

**Files:**
- Modify: `src/components/v1/shell.tsx`

- [ ] **Step 1: Add virtual selection state**

Add a Shell-local union state for `"personal" | "all" | ""`. Resolve the topbar name from this state before falling back to the real current space.

- [ ] **Step 2: Add a virtual selection handler**

Implement a handler that only updates local selection, closes the modal, clears pending selection, and shows a switch notification. It must not call the research-store mutation function.

- [ ] **Step 3: Render quick entries**

Render personal space and all spaces as always-visible selectable rows above the tree. Display descriptive secondary text and the selected check mark.

- [ ] **Step 4: Render the all-space hierarchy**

Make “全部空间” the parent section for every project group. Give each project a dedicated expand button and a separate selectable project-space row. Render each topic as an indented child row, preserving disabled and unsaved-content behavior for real spaces.

- [ ] **Step 5: Run focused tests**

Run: `pnpm exec tsx --test src/components/v1/research-super-hub-source.test.ts src/components/v1/workspace-view.test.ts`

Expected: all focused tests pass.

### Task 3: Polish the modal presentation

**Files:**
- Modify: `src/components/v1/v1.css`

- [ ] **Step 1: Style quick-space cards and hierarchy rows**

Add a two-column quick-selection region, clearer section surface, separate project select/expand hit targets, topic indentation, stable hover states, and selected styling aligned with the existing blue UI.

- [ ] **Step 2: Add responsive behavior**

Collapse quick selections to one column on narrow screens and keep controls at least 44px high.

- [ ] **Step 3: Run static verification**

Run: `pnpm run validate`

Expected: TypeScript and ESLint complete successfully.

### Task 4: Verify the production build

**Files:**
- Verify only

- [ ] **Step 1: Run the build**

Run: `pnpm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 2: Review the diff**

Run: `git diff --check && git diff -- src/components/v1/shell.tsx src/components/v1/v1.css src/components/v1/research-super-hub-source.test.ts src/components/v1/workspace-view.test.ts`

Expected: no whitespace errors; diff is limited to the requested switcher behavior, styles, and tests.
