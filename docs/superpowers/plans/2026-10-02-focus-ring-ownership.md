# Focus Ring Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate blue outlines from focused form fields while retaining intentional component-level and keyboard focus feedback.

**Architecture:** Narrow the global focus fallback to interactive elements that lack consistent component-owned focus styling. Protect the selector boundary with a source-level regression test and verify the original page in a browser.

**Tech Stack:** CSS, Node.js test runner, TypeScript, Next.js

---

### Task 1: Protect global focus ownership

**Files:**
- Create: `src/app/globals-focus.test.ts`
- Modify: `src/app/globals.css:166-169`

- [ ] **Step 1: Write the failing test**

Read `globals.css`, locate the global `:focus-visible` block, assert that its selector is `button, a`, and assert that form controls are absent from that selector.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test src/app/globals-focus.test.ts`

Expected: FAIL because the current selector includes `input`, `select`, and `textarea`.

- [ ] **Step 3: Write minimal implementation**

Change the selector from `button, a, input, select, textarea` to `button, a`; leave the focus declaration unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test src/app/globals-focus.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify repository and original symptom**

Run `pnpm run validate`, then focus the output-search field at `/research-spaces/current/overview?tab=outputs` and verify its computed input outline is `none` while the wrapper retains its blue border and shadow.
