# Workspace Blue UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the workspace home composer and dashboard to use the requested shale-gas default topic and blue interaction styling.

**Architecture:** Keep the existing workspace page structure. Add a small pure default-topic selector for deterministic behavior, replace only the home topic native select with an accessible controlled menu, and scope visual changes to workspace home panels.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Node test runner.

---

### Task 1: Deterministic default topic

**Files:**
- Modify: `src/components/v1/workspace.tsx`
- Test: `src/components/v1/workspace.test.ts`

- [ ] Add a failing unit test asserting that “页岩气储层评价课题” is preferred, with project and global fallbacks.
- [ ] Run `node --import tsx --test src/components/v1/workspace.test.ts` and confirm the new assertion fails.
- [ ] Add and use a pure `chooseDefaultWorkspaceTopic` helper.
- [ ] Re-run the target test and confirm it passes.

### Task 2: Accessible topic menu

**Files:**
- Modify: `src/components/v1/workspace.tsx`
- Modify: `src/components/v1/v1.css`

- [ ] Replace the home composer native topic `select` with a controlled trigger and menu.
- [ ] Add click-outside and Escape dismissal while preserving the existing space mutation.
- [ ] Add scoped menu, selected, hover, focus-visible, and responsive styles.

### Task 3: Blue active states and clean composer focus

**Files:**
- Modify: `src/components/v1/v1.css`

- [ ] Keep the composer toolbar divider neutral while the composer is focused.
- [ ] Change selected recommendation and activity tabs to blue.
- [ ] Change activity timeline, dot, and symbol colors to blue.

### Task 4: Verification

**Files:**
- Verify: `src/components/v1/workspace.tsx`
- Verify: `src/components/v1/v1.css`

- [ ] Run `node --import tsx --test src/components/v1/workspace.test.ts`.
- [ ] Run `pnpm run ts-check` and `pnpm run lint:build`.
- [ ] Load `http://localhost:3000/workspace` and confirm the default topic, dropdown menu, focus state, tabs, timeline, and icons.
