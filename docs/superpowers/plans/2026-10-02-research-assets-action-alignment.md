# Research Assets Action Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the “操作” header with the action buttons beneath it in every research-assets table row.

**Architecture:** Keep the existing fixed-width, centered operation column. Change only the research-assets theme override that currently left-aligns the nested action flex container, then verify the computed centers in a real browser at desktop width.

**Tech Stack:** Next.js 16, React 19, CSS, Playwright/browser verification, pnpm

---

### Task 1: Center row actions inside the operation column

**Files:**
- Modify: `src/components/v1/v1.css:5677`
- Test: computed layout on the research-assets list page

- [x] **Step 1: Record the failing layout condition**

Open the research-assets list in a browser and compare the horizontal center of `th.operation` with the horizontal center of the first row's `.rs-row-actions`. The pre-change page must show a material mismatch because `.rs-assets-blue .rs-row-actions` uses `justify-content: flex-start`.

- [x] **Step 2: Implement the minimal CSS change**

```css
.rs-assets-blue .rs-row-actions { justify-content: center; gap: 14px; }
```

- [x] **Step 3: Run static verification**

Run: `pnpm run validate`

Expected: TypeScript and ESLint complete successfully with exit code 0.

Windows note: the aggregate command's quoted regular expression is not compatible with this PowerShell environment, so its two constituent commands were run directly: `pnpm run ts-check` and `pnpm run lint:build`.

- [x] **Step 4: Verify the rendered alignment**

Start the application, open both project-assets and my-assets views, and compare the bounding boxes of `th.operation` and `.rs-row-actions`. Their horizontal centers should differ by no more than 1 CSS pixel. Confirm that multi-action rows remain centered as a group and narrow-screen horizontal scrolling is unchanged.

- [x] **Step 5: Commit the focused change**

```powershell
git add -- src/components/v1/v1.css docs/superpowers/specs/2026-10-02-research-assets-action-pagination-alignment-design.md docs/superpowers/plans/2026-10-02-research-assets-action-alignment.md
git commit -m "fix: center research asset row actions"
```
