# Sidebar Toggle Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the global navigation collapse control from the sidebar footer to the top bar immediately before the current-page label.

**Architecture:** Keep `BaselineShell` and its `collapsed` state unchanged. Reuse the existing `v-top-nav-toggle` style, with a source-level regression test protecting placement and accessible labels.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Lucide React, Node test runner via `tsx`.

---

### Task 1: Protect the required top-bar structure

**Files:**
- Modify: `src/components/v1/research-super-hub-source.test.ts`
- Test: `src/components/v1/research-super-hub-source.test.ts`

- [x] **Step 1: Write and run the failing test**

Read `src/components/v1/shell.tsx`; assert that `v-top-nav-toggle` and its dynamic accessible label occur before “当前页面”, and that the Logo area contains no `v-sidebar-toggle`.

- [x] **Step 2: Verify RED**

Run: `pnpm exec tsx --test src/components/v1/research-super-hub-source.test.ts`

Expected: FAIL because the global top-title begins directly with the current-page content.

### Task 2: Move the collapse control into the top bar

**Files:**
- Modify: `src/components/v1/shell.tsx`
- Reuse: `src/components/v1/v1.css`
- Test: `src/components/v1/research-super-hub-source.test.ts`

- [x] **Step 1: Implement the minimal markup change**

Place the existing control first inside `.v-top-title`, reuse `v-top-nav-toggle`, add matching `aria-label` and `title`, remove the special-case duplicate from the activities breadcrumb, and leave only the prototype label in the sidebar footer.

- [x] **Step 2: Run focused tests and static checks**

Run: `pnpm exec tsx --test src/components/v1/research-super-hub-source.test.ts`

Run: `pnpm run ts-check`

Run: `pnpm exec eslint src/components/v1/shell.tsx src/components/v1/v1.css src/components/v1/research-super-hub-source.test.ts --quiet`

Expected: all commands exit 0.

- [x] **Step 3: Verify in the running app**

Open `http://localhost:3000/assistant`; confirm the control appears before “当前页面”, toggles between “收起导航” and “展开导航”, and the hub remains intact.

- [x] **Step 4: Review the final diff**

Run: `git diff -- src/components/v1/shell.tsx src/components/v1/v1.css src/components/v1/research-super-hub-source.test.ts`

Expected: only the shell placement, obsolete sidebar-control styles, and regression test change; no `research-super-hub.tsx` or extraction logic change.
