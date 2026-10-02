# Research Activity Final Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the final eight-tab Research Activities structure and exact legacy creation experiences.

**Architecture:** Extract compute-task list data into reusable Research Activities views while retaining the existing detail component and persistence. Put the agent builder in a dedicated route/component and keep skill/model forms in native dialogs.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules, Radix Dialog, Node.js test runner

---

### Task 1: Lock final information architecture
- [ ] Update source tests for eight tabs, model-development naming, and three standalone task tabs.
- [ ] Add source tests for the dedicated Agent builder and exact Skill/Model field contracts.
- [ ] Run and observe expected failures.

### Task 2: Build dedicated Agent builder
- [ ] Add the new route and split-pane builder component.
- [ ] Implement configuration groups, live welcome preview, chat composer, and publish/back controls.
- [ ] Route the Agent create button to the builder and remove its modal form.

### Task 3: Correct Skill and Model Development dialogs
- [ ] Match the legacy option groups, helper copy, full tool list, and validation.
- [ ] Keep local-row creation on successful submit.

### Task 4: Separate task tabs and unify list shell
- [ ] Add Model Training and Model Inference peer tabs.
- [ ] Render compute/training/inference task data in the shared Research Activities toolbar/table/footer shell.
- [ ] Keep detail routes and task creation behavior available.

### Task 5: Verify
- [ ] Run focused tests, TypeScript, and targeted ESLint.
- [ ] Browser-check all eight tabs, the three creation experiences, and task detail navigation.
