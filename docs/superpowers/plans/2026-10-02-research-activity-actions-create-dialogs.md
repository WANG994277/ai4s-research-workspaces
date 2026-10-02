# Research Activity Actions and Create Dialogs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add creator/actions to capability lists and migrate the three approved creation forms into native dialogs.

**Architecture:** Keep list state and modal state inside `ResearchActivities`; use one shared dialog shell with type-specific form bodies. Submit creates local capability rows while existing notification infrastructure supplies bottom feedback.

**Tech Stack:** React, TypeScript, CSS Modules, Radix Dialog, Node.js test runner

---

### Task 1: Protect the approved list contract

**Files:**
- Modify: `src/components/v1/research-activities-source.test.ts`
- Modify: `src/components/v1/research-activities.tsx`

- [ ] Add failing assertions for creator/action columns, view/add-use controls, exact toast text, and absence of `已就绪`.
- [ ] Run the focused test and confirm expected failures.
- [ ] Add creator data, the two columns, a detail dialog, and add-use notification.

### Task 2: Migrate creation dialogs

**Files:**
- Modify: `src/components/v1/research-activities.tsx`
- Modify: `src/components/v1/research-activities.module.css`

- [ ] Add failing assertions for Agent, Skill, and Model form field contracts.
- [ ] Implement a shared wide dialog and the three type-specific forms.
- [ ] Validate names and required type/step fields, then prepend new local rows on submit.

### Task 3: Verify

- [ ] Run research-activity and navigation tests.
- [ ] Run TypeScript and targeted ESLint checks.
- [ ] Browser-check list columns, toast, and all three dialogs.
