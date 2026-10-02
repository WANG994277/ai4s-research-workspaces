# Scientific Computing Detail Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace five overlapping task-detail tabs with four mutually exclusive information areas.

**Architecture:** Put the tab contract and legacy mapping in the scientific-computing domain module. Render one focused content branch per tab while reusing the existing cards, tables, charts, downloads, and task data.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules/global component CSS, Node test runner.

---

### Task 1: Protect the new tab contract

**Files:**
- Modify: `src/components/v1/scientific-computing-domain.test.ts`
- Modify: `src/components/v1/scientific-computing-domain.ts`

- [x] Write tests for the four tabs and legacy query mapping.
- [x] Run the focused test and verify it fails because the exports do not exist.
- [ ] Add the exported tab tuple, type, and normalization function.
- [ ] Run the focused test and verify it passes.

### Task 2: Replace duplicate detail branches

**Files:**
- Modify: `src/components/v1/scientific-computing.tsx`
- Modify: `src/components/v1/scientific-computing.css`

- [ ] Import and use the shared tab contract.
- [ ] Build a concise overview with summary cards and destination links.
- [ ] Move configuration, runtime environment, and progress into `配置与运行`.
- [ ] Move full charts, scan results, and recommendations into `结果分析`.
- [ ] Move file tables and complete logs into `文件与日志`.
- [ ] Add semantic tab attributes and responsive layout styles.

### Task 3: Verify the finished flow

**Files:**
- Test: `src/components/v1/scientific-computing-domain.test.ts`

- [ ] Run the focused domain test.
- [ ] Run `pnpm run validate`.
- [ ] Run `pnpm run build`.
- [ ] Inspect running and completed task details in the browser.
